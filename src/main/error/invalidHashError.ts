export class InvalidHashError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidHashError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, InvalidHashError.prototype);
    }
}