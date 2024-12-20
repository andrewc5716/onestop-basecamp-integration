import { PropertiesServiceDeleteError } from "./error/propertiesServiceDeleteError";
import { PropertiesServiceReadError } from "./error/propertiesServiceReadError";
import { PropertiesServiceWriteError } from "./error/propertiesServiceWriteError";

type Properties = GoogleAppsScript.Properties.Properties;

const scriptProperties: Properties = PropertiesService.getScriptProperties();
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
        const error: Error = e as Error;
        throw new PropertiesServiceReadError(`Failed to retrieve document property: [key: ${key}] ${error.message}`);
    }

    return value;
}

/**
 * Retrieves a document property from the PropertiesService
 * 
 * @returns the property or null if the key does not have a property
 */
export function getAllDocumentProperties(): DocumentProperties {
    const allProperties: { [key: string]: string } = documentProperties.getProperties();
    const propertyStore: DocumentProperties = {};

    for (const key in allProperties) {
        propertyStore[key] = JSON.parse(allProperties[key]);
    }

    return propertyStore;
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
        Logger.log(`New document property set:\n{${key}: ${value}}`);
    } catch (e: any) {
        const error: Error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to document property PropertiesService: [key: ${key}, value: ${value}] ${error.message}`);
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
        const error: Error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to document property PropertiesService: [properties: ${properties}] ${error.message}`);
    }
}

/**
 * Retrieves a script property from the PropertiesService
 * 
 * @param key the key for the property
 * @returns the property or null if the key does not have a property
 */
export function getScriptProperty(key: string): string | null {
    let value: string | null = null;
    try {
        value = scriptProperties.getProperty(key);
    } catch (e: any) {
        const error: Error = e as Error;
        throw new PropertiesServiceReadError(`Failed to retrieve script property: [key: ${key}] ${error.message}`);
    }

    return value;
}

/**
 * Sets a script property in the PropertiesService
 * 
 * @param key the key to write
 * @param value the value to write
 */
export function setScriptProperty(key: string, value: string): void {
    try {
        scriptProperties.setProperty(key, value);
    } catch (e: any) {
        const error: Error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to script property PropertiesService: [key: ${key}, value: ${value}] ${error.message}`);
    }
}

/**
 * Batched write of script properties setting all of the provided script properties in the PropertiesService
 * 
 * @param properties object containing all of the key/value pairs to set in the PropertiesService
 */
export function setScriptProperties(properties: {[key: string]: string}): void {
    try {
        scriptProperties.setProperties(properties);
    } catch (e: any) {
        const error: Error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to script property PropertiesService: [properties: ${properties}] ${error.message}`);
    }
}

/**
 * Deletes a document property
 * @param rowId the id for the row to be deleted from the document property store
 */
export function deleteDocumentProperty(rowId: string): void {
    try {
        documentProperties.deleteProperty(rowId);
    } catch (e: any) {
        const error: Error = e as Error;
        throw new PropertiesServiceDeleteError(`Failed to delete all document property [${rowId}]: ${error.message}`);
    }
}

/**
 * Useful debugging function that will clear all document properties
 */
export function deleteAllDocumentProperties(): void {
    try {
        documentProperties.deleteAllProperties();
    } catch (e: any) {
        const error: Error = e as Error;
        throw new PropertiesServiceDeleteError(`Failed to delete all document properties: ${error.message}`)
    }
}

/**
 * Logs all document properties of the current Google Sheets document.
 *
 * Retrieves and logs key-value pairs from the document properties using the 
 * Apps Script Logger. Useful for debugging and auditing document metadata.
 *
 * @function logDocumentProperties
 * @returns {void}
 *
 * @example
 * logDocumentProperties();
 */
export function logDocumentProperties(): void {
    const allProperties: {[key: string]: string} = documentProperties.getProperties();
    for (const key in allProperties) {
      Logger.log(key + ': ' + allProperties[key]);
    }
}

/**
 * Loads and parses a map stored in the script properties. The reutned object can be cast to its corresponding
 * type.
 * 
 * @param key key that the map is stored under within the script properties
 * @returns the map object from the script properties
 */
export function loadMapFromScriptProperties(key: string): Object {
    const map: string | null = getScriptProperty(key);
    return map ? JSON.parse(map) : {};
}
