export class TodoIsMissingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TodoIsMissingError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, TodoIsMissingError.prototype);
    }
}