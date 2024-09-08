class PropertiesServiceWriteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PropertiesServiceWriteError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, PropertiesServiceWriteError.prototype);
    }
}