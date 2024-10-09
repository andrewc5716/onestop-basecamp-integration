import { PROJECT_ID } from "./basecamp";
import { BasecampRequestMissingError } from "./error/basecampRequestMissingError";
import { RowBasecampMappingMissingError } from "./error/rowBasecampMappingMissingError";
import { TodoIsMissingError } from "./error/todoIdMissingError";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, getRowBasecampMapping, hasChanged, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
import { createTodo, TODOLIST_ID, updateTodo } from "./todos";

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

/**
 * Processes existing event rows by checking whether the row has been modified and if so indiscriminately
 * updates all the tasks with the new information
 * 
 * @param row 
 */
function processExistingRow(row: Row): void {

    if(hasChanged(row)) {

        const basecampTodoRequests: Map<string, BasecampTodoRequest> = getBasecampTodoRequestsForRow(row);

        const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);

        const roles: string[] = Array.from(basecampTodoRequests.keys());

        for (const role of roles) {

            let todoId = savedRowBasecampMapping?.roleTodoIdMap.get(role);
            let request = basecampTodoRequests.get(role);

            if(request == undefined) {
                throw new BasecampRequestMissingError("Missing basecamp request!");
                
            } else if (todoId == undefined) {
                createTodo(request, DEFAULT_TODOLIST_IDENTIFIER)

            } else {

                let todoIdentifier: TodoIdentifier = {
                    projectId: PROJECT_ID,
                    todoId: todoId
                }

                updateTodo(request, todoIdentifier)
            }
        }

        const newRoles = Array.from(basecampTodoRequests.keys());
        const oldRoles: string[] = roles.filter(role => !newRoles.includes(role));

        for(const oldRole of oldRoles) {
            // Delete the todo associated with the old helper role
        }
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
