import { ALIASES_MAP } from "./aliases";
import { InvalidHashError } from "./error/invalidHashError";
import { RowBasecampMappingMissingError } from "./error/rowBasecampMappingMissingError";
import { RowMissingIdError } from "./error/rowMissingIdError";
import { RowNotSavedError } from "./error/rowNotSavedError";
import { containsFilter, filterMembers, isFilter, removeFilters } from "./filter";
import { GROUPS_MAP, getMembersFromGroups, GROUP_NAMES } from "./groups";
import { getPersonId, normalizePersonName } from "./people";
import { getDocumentProperty, setDocumentProperty } from "./propertiesService";
import { getBasecampScheduleEntryRequest } from "./schedule";
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
 * @param roleTodoMap a map that has role titles as the keys and todo objects as the values
 * @param scheduleEntryId id of the schedule entry created for this row
 */
export function saveRow(row: Row, roleTodoMap: RoleTodoMap, scheduleEntryId: string | undefined): void {
    if(!hasId(row)) {
        throw new RowMissingIdError(`Row does not have an id: ${toString(row)}`);
    }

    const rowId: string = getId(row);
    const rowHash: string = toHexString(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, toString(row)));
    const tabInfo: TabInfo = { date: row.date };
    const rowBasecampMapping: RowBasecampMapping = {rowHash: rowHash, roleTodoMap: roleTodoMap, scheduleEntryId: scheduleEntryId, tabInfo: tabInfo};

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
    ${row.where.value}, ${row.inCharge.value}, ${row.helpers.value}, ${row.notes.value}]`;
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
 * Returns the number of todos for a given row. Used to determine if there are any 
 * missing Todos
 * 
 * @param row row to calculate the number of todos for
 * @returns the number of todos for the given row
 */
function getNumTodosForRow(row: Row): number {
    const leadIds: string[] = getLeadsBasecampIds(row);
    const numLeadsTodos: number = leadIds.length > 0 ? 1 : 0;
    const helperGroups: HelperGroup[] = getHelperGroups(row);

    return helperGroups.reduce((numTodos, helperGroup) => {
        const helperIds: string[] = getHelperIdsWithoutLeads(helperGroup, leadIds);
        return helperIds.length > 0 ? numTodos + 1 : numTodos;
    }, numLeadsTodos);
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
        const leadsRequest: BasecampTodoRequest = getBasecampTodoRequest(basecampTodoContent, basecampTodoDescription, leadIds, leadIds, true, basecampDueDate);
        leadsRoleRequestMap[LEAD_ROLE_TITLE] = leadsRequest;
    } else {
        Logger.log(`${getLeadsNames(row)} do not have any Basecamp ids. row: ${JSON.stringify(row)}`);
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
    const leadNames: string[] = getLeadsNames(row).flatMap((name) => ALIASES_MAP.hasOwnProperty(name) ? ALIASES_MAP[name] : name);
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
    return row.inCharge.value.split(COMMA_DELIMITER)
    .map(name => normalizePersonName(name))
    .filter(name => name !== "");
}

/**
 * Constructs the Basecampe Todo description for a given row
 * 
 * @param row row to construct the Basecamp Todo for
 * @returns Basecamp Todo description
 */
function getBasecampTodoDescription(row: Row): string {
    const location: string = getRichTextFromText("WHERE", row.where);
    const locales: Intl.LocalesArgument = 'en-us';
    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }
    const startTime: string = row.startTime.toLocaleTimeString(locales, options);
    const endTime: string = row.endTime.toLocaleTimeString(locales, options);

    const time: string = `WHEN: ${startTime} - ${endTime}`;
    const inCharge: string = getRichTextFromText("IN CHARGE", row.inCharge);
    const helpers: string = getRichTextFromText("HELPERS", row.helpers);
    const notes: string = getRichTextFromText("NOTES", row.notes);

    return wrapWithDivTag(combineWithBreakTags([location, time, inCharge, helpers, notes]));
}

function getRichTextFromText(prefix: string, text: Text): string {
    if(text.tokens.length === 1) {
        return `${prefix}: ${replaceNewLinesWithBreakTags(text.value)}`;
    }

    const textTokens: TextData[] = text.tokens;
    let richText: string = `${prefix}: `;
    for(const token of textTokens) {
        if(token.hyperlink !== null) {
            richText += `<a href="${token.hyperlink}">${replaceNewLinesWithBreakTags(token.value)}</a>`;
        } else if(token.strikethrough) {
            richText += `<strike>${replaceNewLinesWithBreakTags(token.value)}</strike>`;
        } else {
            richText += replaceNewLinesWithBreakTags(token.value);
        }
    }

    return richText;
}

function wrapWithDivTag(text: string): string {
    return `<div>${text}</div>`;
}

function combineWithBreakTags(stringsToCombine: string[]): string {
    return stringsToCombine.join("<br>");
}

function replaceNewLinesWithBreakTags(text: string): string {
    return text.replace(NEW_LINE_DELIM, "<br>");
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
        const assigneeIds = getHelperIdsWithoutLeads(helperGroup, leadIds);
        const basecampDueDate: string = getBasecampDueDate(row);

        if(assigneeIds.length > 0) {
            const basecampTodoRequest: BasecampTodoRequest = getBasecampTodoRequest(basecampTodoContent, basecampTodoDescription, assigneeIds, leadIds, true, basecampDueDate);
            helperRoleRequestMap[roleTitle] = basecampTodoRequest;

        } else {
            Logger.log(`${row.helpers.value} do not have any Basecamp ids. row: ${row}`);
        }
    }

    return helperRoleRequestMap;
}

function getHelperIdsWithoutLeads(helperGroup: HelperGroup, leadIds: string[]): string[] {
    return helperGroup.helperIds.filter(id => !leadIds.includes(id));
}

/**
 * @param row row to retrieve helper lines from
 * @returns an array of helper lines
 */
export function getHelperLines(row: Row): string[] {
    return row.helpers.value.split(NEW_LINE_DELIM);
}

/**
 * @param helperLine a line from the helpers column in a row
 * @returns true or false
 */
export function hasRole(helperLine: string): boolean {
    return helperLine.includes(COLON_DELIM);
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

    const helperLines: string[] = getHelperLines(row);
    for(const helperLine of helperLines) {
        if (hasRole(helperLine)) {
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
    .map(name => normalizePersonName(name))
    .filter(name => name !== "");

    const helperNames: string[] = helperStrings.flatMap((helperString) => getMemberNamesFromHelperIdentifier(helperString));
    // Removes any duplicates
    const uniqueHelperNames: string[] = [...new Set(helperNames)];

    return uniqueHelperNames;
}

/**
 * Retrieves an array of member names from a single helper identifier (person/alias/group)
 * 
 * @param helperIdentifier string identifier of person/alias/group to transform into member names
 * @returns an array of member names
 */
function getMemberNamesFromHelperIdentifier(helperString: string): string[] {
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
 * Gets all of the expanded helper names as a list of member names from the helper column of a row
 * 
 * @param row the row to get the helper names from
 * @returns constructed HelperGroup object
 */
function getAllHelperNames(row: Row): string[] {
    const allHelpers: string[] = [];
    const helperLines: string[] = getHelperLines(row);

    for(const helperLine of helperLines) {
        if (hasRole(helperLine)) {
            const [role, helperList] = helperLine.split(COLON_DELIM);
            const trimmedHelperList: string = helperList.trim();
            allHelpers.push(...getHelpersNames(trimmedHelperList));
            
        } else if(helperLine !== "") {
            allHelpers.push(...getHelpersNames(helperLine));
        }
    }

    return allHelpers;
}

/**
 * Retrieves an array of domain names from a row
 * 
 * @param row row to retrieve domain names from
 * @returns array of domain names
 */
function getDomainNames(row: Row): string[] {
    return row.domain.split(COMMA_FORWARD_SLASH_DELIM_REGEX)
    .map(value => value.toLowerCase().trim())
    .filter(value => GROUP_NAMES.includes(value));
}

/**
 * Retrieves an array of domain filters from a row
 * 
 * @param row row to retrieve domain filters from
 * @returns array of domain filters
 */
function getDomainFilters(row: Row): string[] {
    return row.domain.split(COMMA_FORWARD_SLASH_DELIM_REGEX)
    .map(value => value.toLowerCase().trim()).filter(value => isFilter(value));
}

/**
 * Splits the value of the who column of a row based on the COMMA_FORWARD_SLASH_DELIM_REGEX
 * 
 * @param row - An event row
 * @returns a split string representing who is attending an event
 */
function splitWhoColumn(row: Row): string[] {
    return row.who.split(COMMA_FORWARD_SLASH_DELIM_REGEX);
}

/**
 * Retrieves an array of ministry names from a row
 * 
 * @param row row to retrieve ministry names from
 * @returns array of ministry group names
 */
function getMinistryNames(row: Row): string[] {
    return splitWhoColumn(row)
        .map(name => name.toLowerCase().trim())
        .filter(value => GROUP_NAMES.includes(value));
}

/**
 * Retrieves an array of ministry filters from a row
 * 
 * @param row row to retrieve ministry filters from
 * @returns array of ministry filters
 */
function getMinistryFilters(row: Row): string[] {
    return splitWhoColumn(row)
    .map(name => name.toLowerCase().trim())
    .filter(value => isFilter(value));
}

/**
 * Retrieves an array of names from a row.
 * 
 * @param row - Row to retrieve the different attendees from.
 * @returns Array of Person.
 */
export function getAttendeesFromRow(row: Row): string[] {
    const attendees: string[] = [];

    // Step 1: Extract Ministry Names and Filters
    const ministryNames = getMinistryNames(row);
    const ministryFilters = getMinistryFilters(row);

    // Step 2: Extract Domain Names and Filters
    const domainNames = getDomainNames(row);
    const domainFilters = getDomainFilters(row);

    attendees.push(...getLeadsNames(row));
    attendees.push(...getAllHelperNames(row));

    if(ministryNames.length > 0) {
        // Process Ministry Attendees
        const ministryAttendees = filterMinistryAttendees(ministryNames, ministryFilters);
        attendees.push(...ministryAttendees);

    } else if(domainNames.length > 0 && ministryFilters.length === 0) {
        // Process Domain Attendees
        const domainAttendees = filterDomainAttendees(domainNames, domainFilters);
        attendees.push(...domainAttendees);

    } else if(domainNames.length > 0 && ministryFilters.length > 0) {
        // Special case: Filter the domain using filters from the ministry column if there are no ministry groups present in the ministry column
        const domainAttendees = filterDomainAttendees(domainNames, ministryFilters);
        attendees.push(...domainAttendees);

    } else  {
        // Step 5: Handle Missing Data
        Logger.log("ERROR: Unable to get attendees from row becuase both domain and ministry columns are empty!")
    }

    return attendees;
}

/**
 * Process attendees for ministry groups.
 * 
 * @param ministryNames - Names of ministry groups.
 * @param ministryFilters - Filters to apply to the ministry members.
 * @returns Array of filtered members.
 */
function filterMinistryAttendees(ministryNames: string[], ministryFilters: string[]): string[] {
    const members = getMembersFromGroups(ministryNames);
    return filterMembers(members, ministryFilters);
}

/**
 * Process attendees for domains.
 * 
 * @param domainNames - Names of domains.
 * @param domainFilters - Filters to apply to the domain members.
 * @returns Array of filtered members.
 */
function filterDomainAttendees(domainNames: string[], domainFilters: string[]): string[] {
    const members = getMembersFromGroups(domainNames);
    return filterMembers(members, domainFilters);
}

/**
 * Gets the roleTodoMap object from the RowBasecampMapping object.
 * Used for downstream processing
 * 
 * @param row a list of all the current roles associated with the row including the lead role. This may be identical to the original roles
 * @returns a map that associates role titles with basecamp todo objects
 */
export function getRoleTodoMap(row: Row): RoleTodoMap {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping === null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null! Unable to proceed with updating the todo!");
    }
    return savedRowBasecampMapping.roleTodoMap;
}

export function getSavedScheduleEntryId(row: Row): string | undefined {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping === null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null!");
    }
    return savedRowBasecampMapping.scheduleEntryId;
}

export function isMissingTodos(row: Row): boolean {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping === null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null!");
    }
    const numExpectedTodos: number = getNumTodosForRow(row);
    return Object.values(savedRowBasecampMapping.roleTodoMap).length !== numExpectedTodos;
}

export function isMissingScheduleEntry(row: Row): boolean {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping === null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null!");
    }
    return savedRowBasecampMapping.scheduleEntryId === undefined;
}

export function hasBasecampAttendees(row: Row): boolean {
    return getBasecampIdsFromPersonNameList(getAttendeesFromRow(row)).length > 0;
}

export function getScheduleEntryRequestForRow(row: Row, roleTodoMap: RoleTodoMap): BasecampScheduleEntryRequest {
    const summary: string = getScheduleEntrySummary(row);
    const startsAt: string = row.startTime.toISOString();
    const endsAt: string = row.endTime.toISOString();
    const description: string = getScheduleEntryDescription(row, roleTodoMap);
    const participantIds: string[] = getBasecampIdsFromPersonNameList(getAttendeesFromRow(row));

    return getBasecampScheduleEntryRequest(summary, startsAt, endsAt, description, participantIds, false, true);
}

/**
 * Makes the "summary", or the title of the Basecamp schedule entry. Uses the attendee column, otherwise the domain column.
 * @param row 
 * @returns 
 */
function getScheduleEntrySummary(row: Row): string {
    const attendeeGroups: string[] = splitWhoColumn(row);
    if (attendeeGroups.length > 0 ) {
        return buildScheduleEntrySummary(attendeeGroups, row.what.value);
    } else {
        const domainGroups: string[] = row.domain.split(COMMA_FORWARD_SLASH_DELIM_REGEX);
        return buildScheduleEntrySummary(domainGroups, row.what.value);
    }
}

function buildScheduleEntrySummary(groups: string[], eventName: string): string {
    const group: string = groups.map(group => group.toUpperCase()).join(" ");
    return`[${group}] ${eventName}`; 
}

function getScheduleEntryDescription(row: Row, roleTodoMap: RoleTodoMap): string {
    const location: string = getRichTextFromText("WHERE", row.where);
    const locales: Intl.LocalesArgument = 'en-us';
    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }
    const startTime: string = row.startTime.toLocaleTimeString(locales, options);
    const endTime: string = row.endTime.toLocaleTimeString(locales, options);

    const what: string = getRichTextFromText("WHAT", row.what);
    const time: string = `WHEN: ${startTime} - ${endTime}`;
    const inCharge: string = getRichTextFromText("IN CHARGE", row.inCharge);
    const helpers: string = getRichTextFromText("HELPERS", row.helpers);
    const notes: string = getRichTextFromText("NOTES", row.notes);
    const relatedTodos: string = getRichTextForTodoLinks(roleTodoMap);

    return wrapWithDivTag(combineWithBreakTags([what, location, time, inCharge, helpers, notes, relatedTodos]));
}

function getRichTextForTodoLinks(roleTodoMap: RoleTodoMap): string {
    let richText: string = "RELATED TODOS: <ul>";
    for(const todo of Object.values(roleTodoMap)) {
        richText += `<li><a href="${todo.url}">${todo.title}</a></li>`;
    }
    richText += "</ul>";

    return richText;
}
