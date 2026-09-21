/**
 * Domain errors for the member entity.
 *
 * These are thrown by the data layer and translated to HTTP status codes by
 * the route handlers. Keeping them typed means the HTTP layer never has to
 * string-match an error message to decide what status to return.
 */

export class DuplicatePhoneError extends Error {
  constructor(public readonly phone: string) {
    super(`A member with the phone number ${phone} already exists.`);
    this.name = "DuplicatePhoneError";
  }
}

export class MemberNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`No member found with id ${id}.`);
    this.name = "MemberNotFoundError";
  }
}
