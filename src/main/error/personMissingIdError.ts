class PersonMissingIdError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PersonMissingIdError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PersonMissingIdError.prototype);
    }
}