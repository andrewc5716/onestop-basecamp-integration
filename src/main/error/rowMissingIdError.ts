export class RowMissingIdError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RowMissingIdError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, RowMissingIdError.prototype);
    }
}