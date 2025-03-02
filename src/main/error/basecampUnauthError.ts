export class BasecampUnauthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BasecampUnauthError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, BasecampUnauthError.prototype);
    }
}