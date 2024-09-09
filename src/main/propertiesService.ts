type Properties = GoogleAppsScript.Properties.Properties;

const documentProperties: Properties = PropertiesService.getDocumentProperties();

/**
 * Retrieves a document property from the PropertiesService
 * 
 * @param key the key for the property
 * @returns the property or null if the key does not have a property
 */
export function getDocumentProperty(key: string): string | null {
    let value: string | null = null;
    try {
        value = documentProperties.getProperty(key);
    } catch (e: any) {
        const error = e as Error;
        throw new PropertiesServiceReadError(`Failed to retrieve row: [key: ${key}] ${error.message}`);
    }

    return value;
}

/**
 * Sets a document property in the PropertiesService
 * 
 * @param key the key to write
 * @param value the value to write
 */
export function setDocumentProperty(key: string, value: string): void {
    try {
        documentProperties.setProperty(key, value);
    } catch (e: any) {
        const error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to document PropertiesService: [key: ${key}, value: ${value}] ${error.message}`);
    }
}

/**
 * Batched write of document properties setting all of the provided document properties in the PropertiesService
 * 
 * @param properties object containing all of the key/value pairs to set in the PropertiesService
 */
export function setDocumentProperties(properties: {[key: string]: string}): void {
    try {
        documentProperties.setProperties(properties);
    } catch (e: any) {
        const error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to document PropertiesService: [properties: ${properties}] ${error.message}`);
    }
}
