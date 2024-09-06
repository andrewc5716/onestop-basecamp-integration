import { getDocumentProperty, setDocumentProperties, setDocumentProperty } from "./propertiesService";

const ROW_ID_KEY: string = "rowId";
const HEXIDECIMAL_BASE: number = 16;
const HEXIDECIMAL_CHAR_LENGTH: number = 2;

/**
 * Retrieves the metadata object for a given range. If the metadata object does not exist,
 * this function will set the row id key so the metadata object is created and a reference
 * can be held
 * 
 * @param range Range representing an event row
 * @returns reference to the Metadata object for this row
 */
export function getMetadata(range: Range): Metadata {
    let metadataList: Metadata[] = range.getDeveloperMetadata();

    if (metadataList.length === 0) {
        // Add the row id key so the metadata object is created
        range.addDeveloperMetadata(ROW_ID_KEY);
        metadataList = range.getDeveloperMetadata();
    }

    return metadataList[0];
}

/**
 * Retrieves the unique id for a Row. The unique id is stored in the value of the metadata.
 * 
 * @param row the Row to retrieve the unique id for
 * @returns unique id for the row
 */
export function getId(row: Row): string {
    const id = row.metadata.getValue();

    // Creating the metadata object sets the value to the empty string so we need to check for
    // that here to determine if the id has been set or not
    if(id === null || id === "") {
        throw Error("Row does not have an id: " + toString(row));
    }

    return id;
}

/**
 * Generates a new unique id for a row
 * 
 * @param row the row to generate a new unique id for
 * @returns the new unique id
 */
export function generateIdForRow(row: Row): string {
    const newId: string = Utilities.getUuid();
    row.metadata.setValue(newId);
    return newId;
}

/**
 * Returns a boolean representing whether a given Row has been assigned a unique id or not
 * 
 * @param row the row to check the unique id of
 * @returns boolean representing whether a given Row has been assigned a unique id or not
 */
export function hasId(row: Row): boolean {
    return row.metadata.getValue() !== null;
}

/**
 * Saves a given row's contents to the PropertiesService
 * 
 * @param row the row's contents to write
 * @returns boolean representing whether the save operation was successful or not
 */
export function saveRow(row: Row): boolean {
    if(!hasId(row)) {
        throw Error(`Row does not have an id: ${toString(row)}`);
    }

    const rowId: string = getId(row);
    const rowHash: string = toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toString(row)));
    const rowBasecampMapping: RowBasecampMapping = {rowHash: rowHash};

    return setDocumentProperty(rowId, JSON.stringify(rowBasecampMapping));
}

/**
 * Batched version of saveRow() which saves an array of row's contents
 * to the PropertiesService at one time
 * 
 * @param rows array of rows to write
 * @returns boolean representing whether the save operation was successful or not
 */
export function saveRows(rows: Row[]): boolean {
    const rowsWithIds = rows.filter((row) => {
        const rowHasId: boolean = hasId(row);
        if(!rowHasId) {
            Logger.log(`Row does not have an id: ${toString(row)}`);
            return false;
        }
        return true;
    });

    if(rowsWithIds.length > 0) {
        // Constructs an object containing all of the rowId/rowHash pairs to be written
        const properties: {[key: string]: string} = {};
        for(const row of rowsWithIds) {
            const rowId: string = getId(row);
            const rowHash: string = toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toString(row)));
            const rowBasecampMapping: RowBasecampMapping = {rowHash: rowHash};
            properties[rowId] = JSON.stringify(rowBasecampMapping);
        }

        return setDocumentProperties(properties);
    } else {
        Logger.log("No rows with ids provided");
    }

    return true;
}

/**
 * Checks if a given row has been saved to the PropertiesService
 * 
 * @param row the row to check
 * @returns boolean representing whether or not the given row has been saved to the PropertiesService or not
 */
export function hasBeenSaved(row: Row): boolean {
    if(!hasId(row)) {
        Logger.log(`Row does not have an id: ${toString(row)}`);
        return false;
    }

    const rowHash: string | null = getSavedHash(row);

    return rowHash !== null;
}

/**
 * Checks if a given row's contents has been changed
 * 
 * @param row the row to check
 * @returns boolean representing whether the given row's contents has been changed or not
 */
export function hasChanged(row: Row): boolean {
    if(!hasId(row)) {
        throw Error(`Row does not have an id: ${toString(row)}`);
    }

    if(!hasBeenSaved(row)) {
        throw Error(`Row has not yet been saved: ${toString(row)}`);
    }

    const rowId: string = getId(row);
    const currentRowHash: string = toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toString(row)));
    const storedRowHash: string | null = getSavedHash(row);

    // null check to catch cases where the hashes are null (although this shouldn't be the case)
    if(currentRowHash === null || storedRowHash === null) {
        throw Error(`current or stored row has is null: [current: ${currentRowHash}, stored: ${storedRowHash}, row: ${toString(row)}]`);
    }

    return currentRowHash !== storedRowHash;
}

/**
 * Helper function which fetches a given row's saved hash from the PropertiesService
 * 
 * @param row the row to retrieve the hash for
 * @returns the row hash or null if the row cannot be found in the PropertiesService
 */
function getSavedHash(row: Row): string | null {
    if(!hasId(row)) {
        throw Error(`Row does not have an id: ${toString(row)}`);
    }

    const rowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    
    return rowBasecampMapping !== null ? rowBasecampMapping.rowHash : null;
}

/**
 * Helper function which fetches a given row's RowBasecampMapping object from the PropertiesService
 * 
 * @param row the row to retrieve the RowBasecampMapping object for
 * @returns the RowBasecampMapping object or null if the row cannot be found in the PropertiesService
 */
function getRowBasecampMapping(row: Row): RowBasecampMapping | null {
    if(!hasId(row)) {
        throw Error(`Row does not have an id: ${toString(row)}`);
    }

    const rowId: string = getId(row);
    const result: string | null = getDocumentProperty(rowId);

    return result !== null ? JSON.parse(result) : null;
}

/**
 * Returns a string representation of the given row
 * 
 * @param row the row to return a string representation for
 * @returns string representation of the given row
 */
function toString(row: Row): string {
    return `[${row.startTime}, ${row.endTime}, ${row.who}, ${row.numAttendees}, ${row.what.value}, 
    ${row.where.value}, ${row.inCharge.value}, ${row.helpers.value}, ${row.foodLead.value}, 
    ${row.childcare.value}, ${row.notes.value}]`;
}

/**
 * Helper function that transforms a byte array into a hexidecimal string
 * 
 * @param byteArray 
 * @returns 
 */
function toHexString(byteArray: number[]): string {
    return byteArray.map(byte => {
        // Convertes the raw byte to its corresponding hexidecimal string value
        const hexByteString = byte.toString(HEXIDECIMAL_BASE);
        // Appends a leading 0 if the hex string is less than 2 characters long
        return hexByteString.length < HEXIDECIMAL_CHAR_LENGTH ? '0' + hexByteString : hexByteString;
    })
    .join('');
}
