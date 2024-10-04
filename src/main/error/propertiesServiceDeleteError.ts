export class PropertiesServiceDeleteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PropertiesServiceDeleteError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PropertiesServiceDeleteError.prototype);
    }
}