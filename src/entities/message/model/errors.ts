/** Thrown when the dedupe_key guard refuses a second identical send. */
export class DuplicateMessageError extends Error {
  constructor(public readonly dedupeKey: string) {
    super(
      "This exact message has already been recorded for this member and period. It was not sent twice."
    );
    this.name = "DuplicateMessageError";
  }
}

export class TemplateNotFoundError extends Error {
  constructor(public readonly key: string) {
    super(`No message template with key "${key}".`);
    this.name = "TemplateNotFoundError";
  }
}
