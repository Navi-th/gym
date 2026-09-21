/**
 * Domain errors for the subscription entity.
 *
 * Typed so the HTTP layer can map them to status codes without string-matching
 * a message.
 */

export class MemberAlreadySubscribedError extends Error {
  constructor(
    public readonly memberId: string,
    public readonly existingEndDate: string
  ) {
    super(
      `This member already has cover until ${existingEndDate}. Renew it instead of assigning a new plan.`
    );
    this.name = "MemberAlreadySubscribedError";
  }
}

export class SubscriptionNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`No subscription found with id ${id}.`);
    this.name = "SubscriptionNotFoundError";
  }
}
