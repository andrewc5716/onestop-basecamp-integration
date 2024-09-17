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
        const error = e as Error;
        throw new PropertiesServiceReadError(`Failed to retrieve document property: [key: ${key}] ${error.message}`);
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
        const error = e as Error;
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
        const error = e as Error;
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
        const error = e as Error;
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
        const error = e as Error;
        throw new PropertiesServiceWriteError(`Failed to save to script property PropertiesService: [properties: ${properties}] ${error.message}`);
    }
}
