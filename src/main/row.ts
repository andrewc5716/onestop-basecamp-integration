const ROW_ID_KEY: string = "rowId";

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
 * If the unique id has not been set, null will be returned
 * 
 * @param row the Row to retrieve the unique id for
 * @returns unique id for the row; null if one has not been set
 */
export function getId(row: Row): string {
    const id = row.metadata.getValue();

    if(id === null) {
        throw Error("Row does not have an id: " + toString(row));
    }

    return id;
}

/**
 * Assigns a new unique id to a row
 * 
 * @param row the row to assign a new unique id to
 * @returns the new unique id
 */
export function assignId(row: Row): string {
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
 * Returns a string representation of the given row
 * 
 * @param row the row to return a string representation for
 * @returns string representation of the given row
 */
function toString(row: Row): string {
    return `[${row.startTime}, ${row.endTime}, ${row.who}, ${row.what.value}, ${row.where.value}, 
    ${row.inCharge.value}, ${row.helpers.value}]`;
}
