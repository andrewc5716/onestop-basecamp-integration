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
        throw Error(`Failed to retrieve row: [key: ${key}] ${error.message}`);
    }

    return value;
}

/**
 * Sets a document property in the PropertiesService
 * 
 * @param key the key to write
 * @param value the value to write
 * @returns boolean representing whether the writing was successful or not
 */
export function setDocumentProperty(key: string, value: string): boolean {
    try {
        documentProperties.setProperty(key, value);
    } catch (e: any) {
        const error = e as Error;
        Logger.log(`Failed to save to document PropertiesService: [key: ${key}, value: ${value}] ${error.message}`);
        return false;
    }

    return true;
}