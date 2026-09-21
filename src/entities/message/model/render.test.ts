import { describe, expect, it } from "vitest";
import { extractVariables, missingVariables, renderTemplate } from "./render";

describe("extractVariables", () => {
  it("finds placeholders in order, without duplicates", () => {
    expect(extractVariables("Hi {{name}}, {{plan}} ends {{date}}. Bye {{name}}.")).toEqual([
      "name",
      "plan",
      "date",
    ]);
  });

  it("tolerates spacing inside the braces", () => {
    expect(extractVariables("Hi {{ name }}")).toEqual(["name"]);
  });

  it("returns nothing for a template with no placeholders", () => {
    expect(extractVariables("Just a message.")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("substitutes known values", () => {
    expect(
      renderTemplate("Hi {{name}}, your {{plan}} expires on {{date}}.", {
        name: "Aarav",
        plan: "Pro Athlete Pass",
        date: "26 Sep 2026",
      })
    ).toBe("Hi Aarav, your Pro Athlete Pass expires on 26 Sep 2026.");
  });

  it("LEAVES unknown placeholders visible rather than blanking them", () => {
    // The point: "Hi , your membership expires on ." looks like broken software
    // and might actually be sent. A visible {{date}} gets noticed.
    expect(renderTemplate("Hi {{name}}, expires {{date}}.", { name: "Aarav" })).toBe(
      "Hi Aarav, expires {{date}}."
    );
  });

  it("treats an empty string as missing, not as a value", () => {
    expect(renderTemplate("Hi {{name}}", { name: "" })).toBe("Hi {{name}}");
  });

  it("treats null and undefined as missing", () => {
    expect(renderTemplate("Hi {{name}}", { name: null })).toBe("Hi {{name}}");
    expect(renderTemplate("Hi {{name}}", {})).toBe("Hi {{name}}");
  });

  it("substitutes every occurrence, not just the first", () => {
    expect(renderTemplate("{{name}} and {{name}}", { name: "A" })).toBe("A and A");
  });

  it("leaves a lone message untouched", () => {
    expect(renderTemplate("No placeholders here.", {})).toBe("No placeholders here.");
  });
});

describe("missingVariables", () => {
  it("reports exactly what is unresolved", () => {
    expect(
      missingVariables("Hi {{name}}, expires {{date}}", { name: "Aarav" })
    ).toEqual(["date"]);
  });

  it("is empty when everything is supplied", () => {
    expect(
      missingVariables("Hi {{name}}", { name: "Aarav" })
    ).toEqual([]);
  });
});
