/**
 * Message template rendering.
 *
 * Templates use `{{variable}}` placeholders, matching what Meta expects in a
 * WhatsApp template.
 *
 * UNKNOWN VARIABLES ARE LEFT VISIBLE (`{{date}}` stays as `{{date}}`) rather
 * than being blanked out. Silently substituting an empty string produces
 * "Hi , your  membership expires on ." which looks like a bug in the gym's
 * software - and worse, might actually get sent. Leaving the placeholder in
 * place means a human sees exactly what is unresolved before anything goes out.
 */

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

/** Every variable name used in a template, de-duplicated, in first-use order. */
export function extractVariables(body: string): string[] {
  const found: string[] = [];
  for (const match of body.matchAll(PLACEHOLDER)) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

/** Variables a template needs that the supplied values do not cover. */
export function missingVariables(
  body: string,
  values: Record<string, string | null | undefined>
): string[] {
  return extractVariables(body).filter(
    (name) => values[name] === undefined || values[name] === null || values[name] === ""
  );
}

/** Substitutes known variables; unknown ones are left as `{{name}}`. */
export function renderTemplate(
  body: string,
  values: Record<string, string | null | undefined>
): string {
  return body.replace(PLACEHOLDER, (whole, name: string) => {
    const value = values[name];
    if (value === undefined || value === null || value === "") return whole;
    return String(value);
  });
}
