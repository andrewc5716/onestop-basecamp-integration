export class RowBasecampMappingMissingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RowBasecampMappingMissingError";

        // Fix the prototype chain to ensure proper inheritance so the instanceOf check is reliable
        Object.setPrototypeOf(this, RowBasecampMappingMissingError.prototype);
    }
}