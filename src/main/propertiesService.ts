type Properties = GoogleAppsScript.Properties.Properties;

const documentProperties: Properties = PropertiesService.getDocumentProperties();

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