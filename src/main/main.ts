import { PROJECT_ID } from "./basecamp";
import { generateIdForRow, getBasecampTodoForLeads, getBasecampTodosForHelpers, getId, hasId, saveRow } from "./row";
import { getActiveDailyTabs, getAllSpreadsheetTabs, getRowsWithEvents } from "./scan";
import { createTodo, TODOLIST_ID } from "./todos";

const DEFAULT_TODOLIST_IDENTIFIER: TodolistIdentifier = {
    projectId: PROJECT_ID,
    todolistId: TODOLIST_ID
};

export function main(): void {
    const tabs: Sheet[] = getAllSpreadsheetTabs();
    const dailyActiveTabs: Sheet[] = getActiveDailyTabs(tabs);
    
    // Fetches all event rows from all of the daily active tabs
    const eventRows: Row[] = dailyActiveTabs.flatMap((dailyActiveTab) => getRowsWithEvents(dailyActiveTab));
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

}

function processNewRow(row: Row): void {
    const leadsBasecampTodoRequest: BasecampTodoRequest | undefined = getBasecampTodoForLeads(row);
    const helpersBasecampTodoRequest: BasecampTodoRequest[] = getBasecampTodosForHelpers(row);

    if(leadsBasecampTodoRequest !== undefined) {
        helpersBasecampTodoRequest.push(leadsBasecampTodoRequest);
    }

    const basecampTodoIds: string[] = addNewTodos(helpersBasecampTodoRequest);

    generateIdForRow(row);
    saveRow(row, basecampTodoIds);
}

function addNewTodos(basecampRequests: BasecampTodoRequest[]): string[] {
    const basecampTodoIds: string[] = [];
    for(const request of basecampRequests) {
        basecampTodoIds.push(createTodo(request, DEFAULT_TODOLIST_IDENTIFIER));
    }

    return basecampTodoIds;
}

function deleteOldRows(processedRowIds: string[]): void {

}
