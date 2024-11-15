export class TabNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TabNotFoundError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, TabNotFoundError.prototype);
    }
}