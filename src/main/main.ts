import { PROJECT_ID } from "./basecamp";
import { BasecampRequestMissingError } from "./error/basecampRequestMissingError";
import { RowBasecampMappingMissingError } from "./error/rowBasecampMappingMissingError";
import { TodoIsMissingError } from "./error/todoIdMissingError";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, getRowBasecampMapping, hasChanged, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
import { createTodo, deleteTodo, TODOLIST_ID, updateTodo } from "./todos";

const DEFAULT_TODOLIST_IDENTIFIER: TodolistIdentifier = {
    projectId: PROJECT_ID,
    todolistId: TODOLIST_ID
};

/**
 * Main entry point for the Onestop to Basecamp Integration that contains the core logic for
 * adding/updating/deleting Basecamp Todos based on the rows on the Onestop as well as a function to
 * create a menu item to give users the ability to manually trigger the import process. 
 */
export function importOnestopToBasecamp(): void {

    const eventRows: Row[] = getEventRowsFromSpreadsheet();
    const processedRowIds: string[] = [];

    for(const eventRow of eventRows) {
        if(hasId(eventRow)) {
            console.log(`Row for ${eventRow.what.value} on ${eventRow.startTime} already exists! Processing it as an existing row...\n`);
            processExistingRow(eventRow);
        } else {
            console.log(`Row for ${eventRow.what.value} on ${eventRow.startTime} is new! Processing it as a new row...\n`)
            processNewRow(eventRow);
        }

        // Some rows may not have an id if a todo request isn't successfully made
        if (hasId(eventRow)) {
            processedRowIds.push(getId(eventRow));
        }
    }

    deleteOldRows(processedRowIds);
}

/**
 * Processes existing event rows by checking whether the row has been modified and if so indiscriminately
 * updates all the tasks in basecamp with the new information while updating backend metadata
 * 
 * @param row 
 */
function processExistingRow(row: Row): void {

    if(hasChanged(row)) {

        const basecampTodoRequests: Map<string, BasecampTodoRequest> = getBasecampTodoRequestsForRow(row);
        const existingRoleTodoIdMap: { [key: string]: string }  = getRoleTodoIdMap(row);
        
        const currentRoles: string[] = getCurrentEventRoles(basecampTodoRequests);
        const originalRoles: string[] = getOriginalEventRoles(existingRoleTodoIdMap);

        const newRoles: string[] = getNewRoles(currentRoles, originalRoles);
        const newRoleTodoIdMap: { [key: string]: string } = createTodosForNewRoles(newRoles, basecampTodoRequests);

        const existingRoles: string[] = getExistingRoles(currentRoles, originalRoles);
        updateTodosForExistingRoles(existingRoles, basecampTodoRequests, existingRoleTodoIdMap)

        const obsoleteRoles: string[] = getObsoleteRoles(currentRoles, originalRoles);
        deleteObsoleteTodos(obsoleteRoles, existingRoleTodoIdMap);

        const newRoleIdTodoIdMap = updateRoleTodoIdMap(obsoleteRoles, newRoleTodoIdMap, existingRoleTodoIdMap)

        saveRow(row, newRoleIdTodoIdMap);
    }
}

/**
 * Gets a list of roles from a roleTodoIdMap
 * 
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 */
function getOriginalEventRoles(roleTodoIdMap: { [key: string]: string }): string[] {
    return Object.keys(roleTodoIdMap);
}

/**
 * Gets a list of roles from a basecampTodoRequests map

 * @param basecampTodoRequests a map associating role titles with BasecampTodoRequest objects
 */
function getCurrentEventRoles(basecampTodoRequests: Map<string, BasecampTodoRequest>): string[] {
    return Array.from(basecampTodoRequests.keys());
}

/**
 * Updates todos in basecamp for existing roles. Otherwise create a new todos for new roles
 * 
 * @param currentRoles a string array of current event roles
 * @param originalRoles a string array of original event roles
 * @param basecampTodoRequests a map associating role titles with BasecampTodoRequest objects
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 */
function updateTodosForExisting(existingRoles: string[], basecampTodoRequests: Map<string, BasecampTodoRequest>, roleTodoIdMap: { [key: string]: string }) {
    Logger.log("Changes detected in a row! Updateding associated todos to reflect changes...\n");
    updateTodosForExistingRoles(existingRoles, basecampTodoRequests, roleTodoIdMap);
}

/**
 * Gets a list of new roles by comparing the original and current roles together
 * 
 * @param currentRoles a string array of current event roles
 * @param originalRoles a string array of original event roles
 * @returns an array of obsolete roles
 */
function getNewRoles(currentRoles: string[], originalRoles: string[]): string[] {
    return currentRoles.filter(role => !originalRoles.includes(role));
}

/**
 * Gets a list of roles that haven't changed by comparing the original and current roles together
 * 
 * @param currentRoles a string array of current event roles
 * @param originalRoles a string array of original event roles
 * @returns an array of obsolete roles
 */
function getExistingRoles(currentRoles: string[], originalRoles: string[]): string[] {
    return currentRoles.filter(role => originalRoles.includes(role));
}

/**
 * Create todos for new roles. Gets the request body from the basecampTodoRequests map
 * 
 * @param newRoles a string array of current event roles
 * @param basecampTodoRequests a map associating role titles with BasecampTodoRequest objects
 * @returns an object mapping new roles with their newly created todo ids
 */
function createTodosForNewRoles(newRoles: string[], basecampTodoRequests: Map<string, BasecampTodoRequest>): { [key: string]: string } {

    const newRoleTodoIdMap: { [key: string]: string } = {};

    for(const role in newRoles) {
        let request = basecampTodoRequests.get(role);
        let newTodoId = createTodo(request, DEFAULT_TODOLIST_IDENTIFIER);
        newRoleTodoIdMap[role] = newTodoId;
    }

    return newRoleTodoIdMap;
}

/**
 * Updates todos for existing roles. Gets the request body from the basecampTodoRequests map
 * Gets the existing todo id from the roleTodoIdMap object
 * 
 * @param newRoles a string array of current event roles
 * @param basecampTodoRequests a map associating role titles with BasecampTodoRequest objects
 * @param roleTodoIdMap a map associating an event's roles with existing todo ids
 */
function updateTodosForExistingRoles(existingRoles: string[], basecampTodoRequests: Map<string, BasecampTodoRequest>, roleTodoIdMap: { [key: string]: string }) {

    for(const role in existingRoles) {
        let existingTodoId = roleTodoIdMap[role];
        let request = basecampTodoRequests.get(role);

        let todoIdentifier: TodoIdentifier = {
            projectId: PROJECT_ID,
            todoId: existingTodoId
        }

        updateTodo(request, todoIdentifier)
    }
}

/**
 * Gets the roleTodoIdMap object from the RowBasecampMapping object.
 * Used for downstream processing
 * 
 * @param row a list of all the current roles associated with the row including the lead role. This may be identical to the original roles
 * @returns a map that associates role titles with basecamp todo ids
 */
function getRoleTodoIdMap(row: Row) {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping == null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null! Unable to proceed with updating the todo!");
    }
    return savedRowBasecampMapping.roleTodoIdMap
}

/**
 * Deletes todos associated with helper groups that are no longer present on the event row.
 * The first line checks whether there are any rows present in the original roles that are not present in the current roles (indicating an obsolete role)
 * 
 * @param obsoleteRoles an array of all the roles no longer associated with the event
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 * @returns a string array of obsolete roles that were deleted
 */
function deleteObsoleteTodos(obsoleteRoles: string[], roleTodoIdMap: { [key: string]: string }): string[] {
    Logger.log("Checking for obsolete roles...\n")
    const obsoleteTodoIds: string[] = getObsoleteTodosIds(obsoleteRoles, roleTodoIdMap);
    deleteTodos(obsoleteTodoIds);
    return obsoleteRoles;
}

/**
 * Gets a list of obsolete roles by comparing the original and current roles together
 * 
 * @param originalRoles a string array of original event roles
 * @param currentRoles a string array of current event roles
 * @returns an array of obsolete roles
 */
function getObsoleteRoles(currentRoles: string[], originalRoles: string[]) {
    return originalRoles.filter(role => !currentRoles.includes(role));
}

/**
 * Gets a list of obsolete todo ids based off of the obsolete roels roles by comparing the original and current roles together
 * 
 * @param obsoleteRoles an array of obsolete roles
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 * @returns an array of obsolete roles
 */
function getObsoleteTodosIds(obsoleteRoles: string[], roleTodoIdMap: { [key: string]: string }): string[] {

    const obsoleteTodoIds = []
    
    for(const role of obsoleteRoles) {
        Logger.log(`Found obsolete role: ${role}!\n`)
        let todoId = roleTodoIdMap[role];
        obsoleteTodoIds.push(todoId);
    }

    return obsoleteTodoIds
}

/**
 * Deletes the list of todos based on their todo ids
 * 
 * @param todoIds todo ids corresponding to todos to delete
 */
function deleteTodos(todoIds: string[]): void {

    for(const id of todoIds) {

        let todoIdentifier: TodoIdentifier = {
            projectId: PROJECT_ID,
            todoId: id
        }

        deleteTodo(todoIdentifier);
    }
}

/**
 * Updates the existing roleTodoIdMap to include new roles/ids and deletes obsolete roles/ids
 * 
 * @param obsoleteRoles a string array of obsolete roles no longer needed for an event
 * @param newRoleIdTodoIdMap a map associating an event's new roles with new todo ids
 * @param existingRoleTodoIdMap the existing roleTodoIdMap that was fetched at the start of processing the existing row.
 * @returns the updated roleTodoIdMap without the obsolete roles/todos and with the newly added roles and todo ids
 */
function updateRoleTodoIdMap( obsoleteRoles: string[], newRoleIdTodoIdMap: { [key: string]: string }, existingRoleTodoIdMap: { [key: string]: string }): { [key: string]: string } {
    let updatedRoleTodoIdMap = addNewRolesToRoleTodoIdMap(newRoleIdTodoIdMap, existingRoleTodoIdMap);
    updatedRoleTodoIdMap = deleteObsoleteRolesFromRoleTodoIdMap(obsoleteRoles, updatedRoleTodoIdMap);
    return updatedRoleTodoIdMap;
}

/**
 * Modifies the roleTodoIdMap by removing obsolete roles.
 * 
 * @param obsoleteRoles a string array of obsolete roles no longer needed for an event
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 * @returns the updated roleTodoIdMap without the obsolete roles
 */
function deleteObsoleteRolesFromRoleTodoIdMap(obsoleteRoles: string[], roleTodoIdMap: { [key: string]: string }):  { [key: string]: string } {

    for(const role of obsoleteRoles) {
        delete roleTodoIdMap[role]; // Modify the roleTodoIdMap to reflect changes in the document properties
    }

    return roleTodoIdMap
}

/**
 * Combines the existing roleTodoIdMap with a new roleTodoIdMap object in order to avoid keep the document properties
 * consistent with the state of the onestop
 * 
 * @param newRoleTodoIdMap a generated map that represents new roles associated with newly created todo ids
 * @param roleTodoIdMap a map retrieved from the document properties associating an event's existing roles with existing todo ids
 */
function addNewRolesToRoleTodoIdMap(newRoleTodoIdMap: { [key: string]: string }, existingRoleTodoIdMap: { [key: string]: string }): { [key: string]: string } {
    return { ...newRoleTodoIdMap, ...existingRoleTodoIdMap };
}

/**
 * Processes new event rows by creating a new Basecamp Todo for each of the roles associated with that 
 * particular event row. If at least on Todo is created in Bascamp, the row is saved for easier retrieval
 * and updating later
 * 
 * @param row 
 */
function processNewRow(row: Row): void {
    const basecampTodoRequests: Map<string, BasecampTodoRequest> = getBasecampTodoRequestsForRow(row);
    const roleTodoIdMap: { [key: string]: string } = createNewTodos(basecampTodoRequests);

    if(Object.keys(roleTodoIdMap).length > 0) {
        generateIdForRow(row);
        saveRow(row, roleTodoIdMap);
    }
}

/**
 * Sends requests to create new Basecamp Todos
 * 
 * @param basecampRequests array of BasecampTodoRequest objects to send
 * @returns a map that associates role titles with basecamp todo ids
 */
function createNewTodos(basecampRequests: Map<string, BasecampTodoRequest>): { [key: string]: string } {
    const roleTodoIdMap: { [key: string]: string } = {};

    for (const [roleTitle, basecampRequest] of basecampRequests) {
        let basecampTodoId: string = createTodo(basecampRequest, DEFAULT_TODOLIST_IDENTIFIER)
        roleTodoIdMap[roleTitle] = basecampTodoId;
    }

    return roleTodoIdMap;
}

function deleteOldRows(processedRowIds: string[]): void {
    // Will be implemented as part of https://3.basecamp.com/4474129/buckets/38736474/todos/7762398829
}
