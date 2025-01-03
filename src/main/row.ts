import { InvalidHashError } from "./error/invalidHashError";
import { RowBasecampMappingMissingError } from "./error/rowBasecampMappingMissingError";
import { RowMissingIdError } from "./error/rowMissingIdError";
import { RowNotSavedError } from "./error/rowNotSavedError";
import { containsFilter, filterMembers, isFilter, removeFilters } from "./filter";
import { GROUPS_MAP } from "./groups";
import { ALIASES_MAP, MEMBER_MAP } from "./members";
import { getPersonId } from "./people";
import { deleteAllDocumentProperties, getDocumentProperty, setDocumentProperty } from "./propertiesService";
import { getBasecampTodoRequest } from "./todos";

const ROW_ID_KEY: string = "rowId";
const HEXIDECIMAL_BASE: number = 16;
const HEXIDECIMAL_CHAR_LENGTH: number = 2;
const COMMA_FORWARD_SLASH_DELIM_REGEX: RegExp = /[,\/]/;
const MONTH_LENGTH: number = 2;
const DAY_LENGTH: number = 2;
const NEW_LINE_DELIM: string = "\n";
const COLON_DELIM: string = ":";
const LEAD_ROLE_TITLE: string = "Lead";
const COMMA_DELIMITER: string = ",";

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
    const id: string | null = row.metadata.getValue();

    // Creating the metadata object sets the value to the empty string so we need to check for
    // that here to determine if the id has been set or not
    if(id === null || id === "") {
        throw new RowMissingIdError(`Row does not have an id: ${toString(row)}`);
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
    const id: string | null = row.metadata.getValue();

    // Creating the metadata object sets the value to the empty string so we need to check for 
    // that here to determine if the id has been set or not
    return id !== null && id !== "";
}

/**
 * Saves a given row's contents to the PropertiesService
 * 
 * @param row the row's contents to write
 * @param roleTodoIdMap a map that has role titles as the keys and todo ids as the values
 */
export function saveRow(row: Row, roleTodoIdMap: RoleTodoIdMap): void {
    if(!hasId(row)) {
        throw new RowMissingIdError(`Row does not have an id: ${toString(row)}`);
    }

    const rowId: string = getId(row);
    const rowHash: string = toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toString(row)));
    const rowBasecampMapping: RowBasecampMapping = {rowHash: rowHash, roleTodoIdMap: roleTodoIdMap};

    setDocumentProperty(rowId, JSON.stringify(rowBasecampMapping));
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
    Logger.log("Checking if the row has changed...\n")
    if(!hasId(row)) {
        throw new RowMissingIdError(`Row does not have an id: ${toString(row)}`);
    }

    if(!hasBeenSaved(row)) {
        throw new RowNotSavedError(`Row has not yet been saved: ${toString(row)}`);
    }

    const rowId: string = getId(row);
    const currentRowHash: string = toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toString(row)));
    const storedRowHash: string | null = getSavedHash(row);

    // null check to catch cases where the hashes are null (although this shouldn't be the case)
    if(currentRowHash === null || storedRowHash === null) {
        throw new InvalidHashError(`current or stored row has is null: [current: ${currentRowHash}, stored: ${storedRowHash}, row: ${toString(row)}]`);
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
        throw new RowMissingIdError(`Row does not have an id: ${toString(row)}`);
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
export function getRowBasecampMapping(row: Row): RowBasecampMapping | null {
    if(!hasId(row)) {
        throw new RowMissingIdError(`Row does not have an id: ${toString(row)}`);
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
export function toString(row: Row): string {
    return `[${row.startTime}, ${row.endTime}, ${row.who}, ${row.numAttendees}, ${row.what.value}, 
    ${row.where.value}, ${row.inCharge.value}, ${row.helpers.value},
    ${row.childcare.value}, ${row.notes.value}]`;
}

/**
 * Helper function that transforms a byte array into a hexidecimal string
 * 
 * @param byteArray byte array input
 * @returns hexidecimal string representation of the byte array
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

/**
 * Retrieves an array of BasecampTodoRequest objects for an event row. BasecampTodoRequest
 * objects are constructed for both the leads and the helpers
 * 
 * @param row Row to construct and retrieve BasecampTodoRequest objects for
 * @returns a map associating role titles with BasecampTodoRequest objects
 */
export function getBasecampTodoRequestsForRow(row: Row): RoleRequestMap {

    const leadsRoleRequestMap: RoleRequestMap = getBasecampTodoForLeads(row);
    const helperRoleRequestMap: RoleRequestMap = getBasecampTodosForHelpers(row);

    const allRoleRequestMap: RoleRequestMap = {...leadsRoleRequestMap, ...helperRoleRequestMap};

    return allRoleRequestMap;
}

/**
 * Constructs a BasecampTodoRequest object for the lead of a given row
 * 
 * @param row row to construct the BasecampTodoRequest for
 * @param roleRequestMap the Map that associates the roleTitle with the request
 */
export function getBasecampTodoForLeads(row: Row): RoleRequestMap {
    const leadsRoleRequestMap: RoleRequestMap = {};

    const basecampTodoContent: string = `${LEAD_ROLE_TITLE}: ${row.what.value}`;
    const leadIds: string[] = getLeadsBasecampIds(row);
    const basecampTodoDescription: string = getBasecampTodoDescription(row);
    const basecampDueDate: string = getBasecampDueDate(row);

    if(leadIds.length > 0) {
        const leadsRequest: BasecampTodoRequest = getBasecampTodoRequest(basecampTodoContent, basecampTodoDescription, leadIds, leadIds, false, basecampDueDate);
        leadsRoleRequestMap[LEAD_ROLE_TITLE] = leadsRequest;
    } else {
        Logger.log(`${getLeadsNames(row)} do not have any Basecamp ids. row: ${row}`);
    }

    return leadsRoleRequestMap;
}

/**
 * Retrieves Basecamp ids for the leads of a given row
 * 
 * @param row row to retrive leads' Basecamp ids for
 * @returns array of Basecamp ids for the leads of a row
 */
function getLeadsBasecampIds(row: Row): string[] {
    const leadNames: string[] = getLeadsNames(row);
    return getBasecampIdsFromPersonNameList(leadNames);
}

/**
 * Retrieves Basecamp ids for a list of people's names
 * 
 * @param personNameList list of people's names to fetch Basecamp ids for
 * @returns array of Basecamp ids
 */
function getBasecampIdsFromPersonNameList(personNameList: string[]): string[] {
    return personNameList.map((name) => getPersonId(name))
    .filter((personId) => personId !== undefined);
}

/**
 * Retrieves an array of leads' names from a row
 * 
 * @param row row to retrieve leads' names from
 * @returns array of leads names
 */
function getLeadsNames(row: Row): string[] {
    return row.inCharge.value.split(COMMA_FORWARD_SLASH_DELIM_REGEX)
    .map(name => name.trim());
}

/**
 * Constructs the Basecampe Todo description for a given row
 * 
 * @param row row to construct the Basecamp Todo for
 * @returns Basecamp Todo description
 */
function getBasecampTodoDescription(row: Row): string {
    const location: string = `WHERE: ${row.where.value ?? "N\\A"}`;

    const locales: Intl.LocalesArgument = 'en-us';
    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }
    const startTime: string = row.startTime.toLocaleTimeString(locales, options);
    const endTime: string = row.endTime.toLocaleTimeString(locales, options);

    const time: string = `\n\nWHEN: ${startTime} - ${endTime}`;
    const inCharge: string = `\n\nIN CHARGE: ${row.inCharge.value ?? "N\\A"}`;
    const helpers: string = `\n\nHELPERS:\n${row.helpers.value ?? "N\\A"}`;
    const childcare: string = `\n\nCHILDCARE: ${row.childcare.value ?? "N\\A"}`;
    const notes: string = `\n\nNOTES: ${row.notes.value ?? "N\\A"}`;

    return location + time + inCharge + helpers + childcare + notes;
}

/**
 * Retrieves the date from a given row in the format required for a Basecamp Todo (YYYY-MM-DD)
 * 
 * @param row row to retrieve the due date from
 * @returns due date for the row in the Basecamp Todo format (YYYY-MM-DD)
 */
function getBasecampDueDate(row: Row): string {
    const year: number = row.startTime.getFullYear();
    // Months are 0 indexed
    const month: string = String(row.startTime.getMonth() + 1).padStart(MONTH_LENGTH, '0');
    const day: string = String(row.startTime.getDate()).padStart(DAY_LENGTH, '0');

    // Format the date as "YYYY-MM-DD"
    return `${year}-${month}-${day}`;
}

/**
 * Constructs Basecamp Todo requests for helpers
 * 
 * @param row row to construct the Basecamp Todo request for
 * @returns a RoleRequestMap object that associates roles with their corresponding todos
 */
export function getBasecampTodosForHelpers(row: Row): RoleRequestMap {
    const helperRoleRequestMap: RoleRequestMap = {};

    const helperGroups: HelperGroup[] = getHelperGroups(row);
    const leadIds: string[] = getLeadsBasecampIds(row);

    for(const helperGroup of helperGroups) {
        const roleTitle: string = helperGroup.role ? `${helperGroup.role} Helper` : "Helper";
        const basecampTodoContent: string = `${roleTitle}: ${row.what.value}`;
        const basecampTodoDescription: string = getBasecampTodoDescription(row);
        const helperIds: string[] = helperGroup.helperIds.filter(id => !leadIds.includes(id));
        const assigneeIds: string[] = leadIds.concat(helperIds);
        const basecampDueDate: string = getBasecampDueDate(row);

        if(assigneeIds.length > 0) {
            const basecampTodoRequest: BasecampTodoRequest = getBasecampTodoRequest(basecampTodoContent, basecampTodoDescription, assigneeIds, leadIds, false, basecampDueDate);
            helperRoleRequestMap[roleTitle] = basecampTodoRequest;

        } else {
            Logger.log(`${row.helpers.value} do not have any Basecamp ids. row: ${row}`);
        }
    }

    return helperRoleRequestMap;
}

/**
 * Retrieves an array of HelperGroup objects from a row
 * 
 * @param row row to retrieve the different HelperGroups from
 * @returns array of HelperGroups
 */
export function getHelperGroups(row: Row): HelperGroup[] {
    if(row.helpers.value === "") {
        return [];
    }

    const helperGroups: HelperGroup[] = [];

    const helperLines: string[] = row.helpers.value.split(NEW_LINE_DELIM);
    for(const helperLine of helperLines) {
        if (helperLine.includes(COLON_DELIM)) {
            const [role, helperList] = helperLine.split(COLON_DELIM);
            const trimmedHelperList: string = helperList.trim();
            helperGroups.push(getHelperGroupFromHelperList(trimmedHelperList, role));
            
        } else if(helperLine !== "") {
            helperGroups.push(getHelperGroupFromHelperList(helperLine, undefined));
        }
    }
    return helperGroups;
}

/**
 * Parses out the helpers' name into an array of names
 * 
 * @param helpers comma and foward slash deliminated list of helper names
 * @returns array of helper names
 */
function getHelpersNames(helpers: string): string[] {
    const helperStrings: string[] = helpers.split(COMMA_DELIMITER)
    .map(name => name.trim())
    .filter(name => name !== "");

    //const filters: string[] = helperStrings.filter((helperString) => isFilter(helperString));
    //const helperStringsWithoutFilters: string[] = helperStrings.filter((helperString) => !isFilter(helperString));
    const helperNames: string[] = helperStrings.flatMap((helperString) => getMemberNamesFromHelperString(helperString));
    // Removes any duplicates
    const uniqueHelperNames: string[] = [...new Set(helperNames)];
    //const filteredMembers: string[] = filters.length > 0 ? filterMembers(helperNames, filters) : helperNames;

    return uniqueHelperNames;
}

/**
 * Retrieves an array of member names from a helper string
 * 
 * @param helperString string to transform into helper names
 * @returns an array of member names
 */
function getMemberNamesFromHelperString(helperString: string): string[] {
    let helperToken: string = helperString;
    let filters: string[] = [];
    let members: string[] = [];

    // Remove any filters if the individual helper string contains a filter applied specifically to this helper
    if(containsFilter(helperString)) {
        let { stringWithoutFilters: stringWithoutFilters, removedFilters: removedFilters } = removeFilters(helperString);
        helperToken = stringWithoutFilters;
        filters = removedFilters;
    }

    // Expands any groups or aliases if possible
    if(GROUPS_MAP.hasOwnProperty(helperToken)) {
        // Helper string refers to a group
        members = GROUPS_MAP[helperToken];
    } else if(ALIASES_MAP.hasOwnProperty(helperToken)) {
        // Helper string is an alias
        members = ALIASES_MAP[helperToken];
    } else {
        // If the string is not a group or an alias, assume it is a member name
        members = [helperToken];
    }

    // Filters the helpers if any filters were detected
    return filters.length > 0 ? filterMembers(members, filters) : members;
}

/**
 * Constructs a HelperGroup object given a list of helpers and a role for the group
 * 
 * @param helperNameList list of comma and foward slash deliminated helper names
 * @param role the role for the group or undefined if one is not provided
 * @returns constructed HelperGroup object
 */
function getHelperGroupFromHelperList(helperNameList: string, role: string | undefined): HelperGroup {
    const helperNames: string[] = getHelpersNames(helperNameList);
    const helperIds: string[] = getBasecampIdsFromPersonNameList(helperNames);
    return {
        role: role,
        helperIds: helperIds
    };
}

/**
 * Helpful debugging function which clears all row metadata
 */
export function clearAllRowMetadata(): void {
    deleteAllDocumentProperties();
}

/**
 * Gets the roleTodoIdMap object from the RowBasecampMapping object.
 * Used for downstream processing
 * 
 * @param row a list of all the current roles associated with the row including the lead role. This may be identical to the original roles
 * @returns a map that associates role titles with basecamp todo ids
 */
export function getRoleTodoIdMap(row: Row) {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping === null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null! Unable to proceed with updating the todo!");
    }
    return savedRowBasecampMapping.roleTodoIdMap;
}