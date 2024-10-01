import { PROJECT_ID } from "./basecamp";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
import { createTodo, TODOLIST_ID } from "./todos";

const DEFAULT_TODOLIST_IDENTIFIER: TodolistIdentifier = {
    projectId: PROJECT_ID,
    todolistId: TODOLIST_ID
};

/**
 * 
 */
export function main(): void {
    const eventRows: Row[] = getEventRowsFromSpreadsheet();
    const processedRowIds: string[] = [];

    for(const eventRow of eventRows) {
        if(hasId(eventRow)) {
            processExistingRow(eventRow);
        } else {
            processNewRow(eventRow);
        }

        processedRowIds.push(getId(eventRow));
    }

    deleteOldRows(processedRowIds);
}

function processExistingRow(row: Row): void {
    // Will be implemented as part of https://3.basecamp.com/4474129/buckets/38736474/todos/7717428992
}

/**
 * 
 * 
 * @param row 
 */
function processNewRow(row: Row): void {
    const basecampTodoRequests: BasecampTodoRequest[] = getBasecampTodoRequestsForRow(row);
    const basecampTodoIds: string[] = createNewTodos(basecampTodoRequests);

    generateIdForRow(row);
    saveRow(row, basecampTodoIds);
}

/**
 * 
 * @param basecampRequests 
 * @returns 
 */
function createNewTodos(basecampRequests: BasecampTodoRequest[]): string[] {
    const basecampTodoIds: string[] = [];
    for(const request of basecampRequests) {
        basecampTodoIds.push(createTodo(request, DEFAULT_TODOLIST_IDENTIFIER));
    }

    return basecampTodoIds;
}

function deleteOldRows(processedRowIds: string[]): void {
    // Will be implemented as part of https://3.basecamp.com/4474129/buckets/38736474/todos/7762398829
}
