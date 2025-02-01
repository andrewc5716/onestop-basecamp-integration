export class PersonAliasClashError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PersonAliasClashError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PersonAliasClashError.prototype);
    }
}