#!/usr/bin/env node
/**
 * FSD layer boundary checker.
 *
 * Feature-Sliced Design only holds up if the import rules are enforced —
 * otherwise a single deep import quietly re-couples two layers and the
 * structure decays. This script is the enforcement.
 *
 * Why a script and not eslint-plugin-boundaries: the plugin needs
 * eslint-import-resolver-typescript to resolve the "@/*" alias, which is two
 * more dependencies and a fragile config. Our rules are simple enough that a
 * direct check is shorter, has zero dependencies, and is easy to read.
 *
 * Run: npm run lint:fsd
 *
 * THE THREE RULES
 *
 * 1. A layer may only import from layers BELOW it.
 *      _app > _pages > widgets > features > entities > shared
 *    (Next.js routing in app/ sits above all of them and may import anything.)
 *
 * 2. Slices on the SAME layer may not import each other.
 *      widgets/member-stats  ->  widgets/renewals-queue   is forbidden.
 *    Applies to _pages / widgets / features / entities only: `shared` and
 *    `_app` are built from segments, not slices, so they are exempt.
 *
 * 3. Imports must use a slice's PUBLIC API, never reach inside it.
 *      import { getMembers } from "@/entities/member"        OK
 *      import { getMembers } from "@/entities/member/api/..."  forbidden
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const NEXT_APP = join(ROOT, "app");

// Ordered top to bottom: earlier layers may import later ones.
const LAYERS = ["_app", "_pages", "widgets", "features", "entities", "shared"];
const RANK = new Map(LAYERS.map((name, index) => [name, index]));

// Only these layers are organised as SLICES, so only they are subject to the
// no-cross-slice rule. Per the FSD spec, `shared` and `_app` consist of
// SEGMENTS (ui, lib, db, config), and segments within them may reference each
// other freely - there is no slice boundary to respect.
const SLICED_LAYERS = new Set(["_pages", "widgets", "features", "entities"]);

// Test files and declarations are exempt from layer rules.
const IGNORE_FILE = /\.(test|spec|d)\.tsx?$/;

/** Matches `from "@/<layer>/<slice>..."` and captures layer + full sub-path. */
const IMPORT_RE = /from\s+["']@\/([A-Za-z_][\w-]*)((?:\/[\w.-]+)*)["']/g;

function walk(dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return found; // directory does not exist
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Works out which layer and slice a file belongs to.
 * Returns null for files that are not inside a layer (e.g. top-level types).
 */
function locate(file) {
  const rel = relative(SRC, file).split(sep);
  const [layer, slice] = rel;
  if (!RANK.has(layer)) return null;
  return { layer, slice: slice ?? null, rank: RANK.get(layer) };
}

const violations = [];
const sourceFiles = [...walk(SRC), ...walk(NEXT_APP)];

for (const file of sourceFiles) {
  if (IGNORE_FILE.test(file)) continue;

  const inLayer = locate(file);
  const isNextRouting = file.startsWith(NEXT_APP + sep);
  const from = relative(ROOT, file);

  const source = readFileSync(file, "utf8");
  let match;
  IMPORT_RE.lastIndex = 0;

  while ((match = IMPORT_RE.exec(source)) !== null) {
    const [, targetLayer, rest] = match;
    if (!RANK.has(targetLayer)) continue; // not a layer import (e.g. @/app)

    const segments = rest.split("/").filter(Boolean);
    const targetSlice = segments[0] ?? null;
    const targetPath = `@/${targetLayer}${rest}`;

    // ---- Rule 3: must import the public API, not reach inside a slice ----
    // A valid import is exactly "@/<layer>/<slice>".
    if (segments.length > 1) {
      violations.push({
        rule: "deep-import",
        from,
        target: targetPath,
        hint: `import from "@/${targetLayer}/${targetSlice}" instead`,
      });
    }

    // Next.js routing sits above every FSD layer — no ordering rule applies.
    if (isNextRouting) continue;
    if (!inLayer) continue;

    // ---- Rule 1: no importing from layers above ----
    if (RANK.get(targetLayer) < inLayer.rank) {
      violations.push({
        rule: "upward-import",
        from,
        target: targetPath,
        hint: `"${inLayer.layer}" may not import from "${targetLayer}"`,
      });
      continue;
    }

    // ---- Rule 2: no cross-slice imports on the same layer ----
    if (
      RANK.get(targetLayer) === inLayer.rank &&
      SLICED_LAYERS.has(inLayer.layer) &&
      targetSlice &&
      inLayer.slice &&
      targetSlice !== inLayer.slice
    ) {
      violations.push({
        rule: "cross-slice",
        from,
        target: targetPath,
        hint: `"${inLayer.layer}" slices must not import each other`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
if (violations.length === 0) {
  console.log(`FSD OK — ${sourceFiles.length} files checked, 0 violations.`);
  process.exit(0);
}

console.error(`FSD VIOLATIONS (${violations.length}):\n`);
for (const v of violations) {
  console.error(`  [${v.rule}] ${v.from}`);
  console.error(`      -> ${v.target}`);
  console.error(`      ${v.hint}\n`);
}
process.exit(1);
