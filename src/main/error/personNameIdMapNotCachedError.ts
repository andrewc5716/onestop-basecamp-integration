export class PersonNameIdMapNotCachedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PersonNameIdMapNotCachedError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PersonNameIdMapNotCachedError.prototype);
    }
}