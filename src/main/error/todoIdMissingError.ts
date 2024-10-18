export class TodoIdMissingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TodoIdMissingError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, TodoIdMissingError.prototype);
    }
}