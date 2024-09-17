export class PeopleNotPopulatedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PeopleNotPopulatedError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PeopleNotPopulatedError.prototype);
    }
}