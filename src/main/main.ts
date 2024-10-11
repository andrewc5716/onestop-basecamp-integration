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
 * updates all the tasks with the new information
 * 
 * @param row 
 */
function processExistingRow(row: Row): void {

    Logger.log("Checking if the row has changed...\n")

    if(hasChanged(row)) {

        Logger.log("Changes detected in row! Updateding associated todos to reflect changes...\n")
        
        const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
        
        if(savedRowBasecampMapping == null) {
            throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null! Unable to proceed with updating the todo!");
        }
        
        const basecampTodoRequests: Map<string, BasecampTodoRequest> = getBasecampTodoRequestsForRow(row);
        const currentRoles: string[] = Array.from(basecampTodoRequests.keys());

        const roleTodoIdMap = savedRowBasecampMapping.roleTodoIdMap
        const originalRoles: string[] = Object.keys(roleTodoIdMap)

        for (const role of currentRoles) {

            let todoId = roleTodoIdMap[role];
            let request = basecampTodoRequests.get(role);

            if(request == undefined) {
                throw new BasecampRequestMissingError("Missing basecamp request!");
                
            } else if (todoId == undefined) {
                let newTodoId = createTodo(request, DEFAULT_TODOLIST_IDENTIFIER)
                roleTodoIdMap[role] = newTodoId // Modify the roleTodoIdMap to reflect changes in the document properties
                
            } else {
                
                let todoIdentifier: TodoIdentifier = {
                    projectId: PROJECT_ID,
                    todoId: todoId
                }
                
                Logger.log(`Updating todo for ${row.what.value} (${row.startTime})...\n`)
                updateTodo(request, todoIdentifier)
            }
        }   

        deleteObsoleteTodos(originalRoles, currentRoles, roleTodoIdMap);

        saveRow(row, roleTodoIdMap);
    }
}

/**
 * Deletes todos associated with helper groups that are no longer present on the event row.
 * The first line checks whether there are any rows present in the original roles that are not present in the current roles (indicating an obsolete role)
 * 
 * @param originalRoles a list of all the original roles associated with the row including the lead role 
 * @param currentRoles a list of all the current roles associated with the row including the lead role. This may be identical to the original roles
 */
function deleteObsoleteTodos(originalRoles: string[], currentRoles: string[], roleTodoIdMap: { [key: string]: string }): void {
    Logger.log("Checking for obsolete roles...\n")
    const obsoleteRoles: string[] = originalRoles.filter(role => !currentRoles.includes(role));
    
    for(const role of obsoleteRoles) {
        Logger.log(`Found obsolete role: ${role}!\n`)
        let todoId = roleTodoIdMap[role];

        let todoIdentifier: TodoIdentifier = {
            projectId: PROJECT_ID,
            todoId: todoId
        }

        Logger.log("Deleting todo...\n")
        deleteTodo(todoIdentifier);

        delete roleTodoIdMap[role]; // Modify the roleTodoIdMap to reflect changes in the document properties
    }
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
    const basecampTodoIds: { [key: string]: string } = {};

    for (const [roleTitle, basecampRequest] of basecampRequests) {
        let basecampTodoId: string = createTodo(basecampRequest, DEFAULT_TODOLIST_IDENTIFIER)
        basecampTodoIds[roleTitle] = basecampTodoId;
    }

    return basecampTodoIds;
}

function deleteOldRows(processedRowIds: string[]): void {
    // Will be implemented as part of https://3.basecamp.com/4474129/buckets/38736474/todos/7762398829
}
