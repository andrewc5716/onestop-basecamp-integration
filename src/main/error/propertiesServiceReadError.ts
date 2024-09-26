export class PropertiesServiceReadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PropertiesServiceReadError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PropertiesServiceReadError.prototype);
    }
}