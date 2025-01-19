export class DomainMissingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DomainMissingError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, DomainMissingError.prototype);
    }
}