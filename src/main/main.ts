import { PROJECT_ID } from "./basecamp";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
import { createTodo, TODOLIST_ID } from "./todos";

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
            processExistingRow(eventRow);
        } else {
            processNewRow(eventRow);
        }

        // Some rows may not have an id if a todo request isn't successfully made
        if (hasId(eventRow)) {
            processedRowIds.push(getId(eventRow));
        }
    }

    deleteOldRows(processedRowIds);
}

function processExistingRow(row: Row): void {
    // Will be implemented as part of https://3.basecamp.com/4474129/buckets/38736474/todos/7717428992
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
    const roleTodoIdMap: Map<string, string> = createNewTodos(basecampTodoRequests);

    if(roleTodoIdMap.size > 0) {
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
function createNewTodos(basecampRequests: Map<string, BasecampTodoRequest>): Map<string, string> {
    const basecampTodoIds = new Map<string, string>();

    for (const [roleTitle, basecampRequest] of basecampRequests) {
        let basecampTodoId: string = createTodo(basecampRequest, DEFAULT_TODOLIST_IDENTIFIER)
        basecampTodoIds.set(roleTitle, basecampTodoId);
    }

    return basecampTodoIds;
}

function deleteOldRows(processedRowIds: string[]): void {
    // Will be implemented as part of https://3.basecamp.com/4474129/buckets/38736474/todos/7762398829
}
