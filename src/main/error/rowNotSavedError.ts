class RowNotSavedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RowNotSavedError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, RowNotSavedError.prototype);
    }
}