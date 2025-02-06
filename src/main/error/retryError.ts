export class RetryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RetryError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, RetryError.prototype);
    }
}