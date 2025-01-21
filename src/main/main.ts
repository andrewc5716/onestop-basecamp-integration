import { deleteDocumentProperty, getAllDocumentProperties } from "./propertiesService";
import { getRoleTodoIdMap, getSavedScheduleEntryId, getScheduleEntryRequestForRow } from "./row";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, hasChanged, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
import { createScheduleEntry, deleteScheduleEntry, getDefaultScheduleIdentifier, getScheduleEntryIdentifier, updateScheduleEntry } from "./schedule";
import { createNewTodos, createTodosForNewRoles, deleteObsoleteTodos, deleteTodos, updateTodosForExistingRoles } from "./todos";

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
            Logger.log(`Row for ${eventRow.what.value} on ${eventRow.startTime} already exists! Processing it as an existing row...\n`);
            processExistingRow(eventRow);
        } else {
            Logger.log(`Row for ${eventRow.what.value} on ${eventRow.startTime} is new! Processing it as a new row...\n`)
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
 * If new helper groups are added new tasks in basecamp are created for them
 * If helper groups are deleted then their corresponding tasks in basecamp will also be deleted.
 * 
 * The current state of the row will always be saved into the document properties at the end.
 * 
 * @param row 
 */
function processExistingRow(row: Row): void {

    if(hasChanged(row)) {
        const updatedRoleTodoIdMap: RoleTodoIdMap = handleTodosForExistingRow(row);
        const scheduleEntryId: string = handleScheduleEntryForExistingRow(row);

        saveRow(row, updatedRoleTodoIdMap, scheduleEntryId);
    }
}

function handleTodosForExistingRow(row: Row): RoleTodoIdMap {
    const currentRoleRequestMap: RoleRequestMap = getBasecampTodoRequestsForRow(row);
    const lastSavedRoleTodoIdMap: RoleTodoIdMap  = getRoleTodoIdMap(row);

    deleteObsoleteTodos(currentRoleRequestMap, lastSavedRoleTodoIdMap);

    const newRoleTodoIdMap: RoleTodoIdMap = createTodosForNewRoles(currentRoleRequestMap, lastSavedRoleTodoIdMap);
    const existingRoleTodoIdMap: RoleTodoIdMap = updateTodosForExistingRoles(currentRoleRequestMap, lastSavedRoleTodoIdMap);

    return {...existingRoleTodoIdMap, ...newRoleTodoIdMap};
}

function handleScheduleEntryForExistingRow(row: Row): string {
    const scheduleEntryId: string = getSavedScheduleEntryId(row);
    const scheduleEntryRequest: BasecampScheduleEntryRequest = getScheduleEntryRequestForRow(row);
    const scheduleEntryIdentifier: ScheduleEntryIdentifier = getScheduleEntryIdentifier(scheduleEntryId);
    updateScheduleEntry(scheduleEntryRequest, scheduleEntryIdentifier);

    return scheduleEntryId;
}

/**
 * Processes new event rows by creating a new Basecamp Todo for each of the roles associated with that 
 * particular event row. If at least on Todo is created in Bascamp, the row is saved for easier retrieval
 * and updating later
 * 
 * @param row 
 */
function processNewRow(row: Row): void {
    const roleRequestMap: RoleRequestMap = getBasecampTodoRequestsForRow(row);
    const roleTodoIdMap: RoleTodoIdMap = createNewTodos(roleRequestMap);

    const scheduleEntryRequest: BasecampScheduleEntryRequest = getScheduleEntryRequestForRow(row);
    const scheduleEntryId: string = createScheduleEntry(scheduleEntryRequest, getDefaultScheduleIdentifier());

    if(Object.keys(roleTodoIdMap).length > 0 && scheduleEntryId !== "") {
        generateIdForRow(row);
        saveRow(row, roleTodoIdMap, scheduleEntryId);
    }
}

function deleteOldRows(processedRowIds: string[]): void {
    const propertyStore: DocumentProperties = getAllDocumentProperties();

    for(const rowId in propertyStore) {
        if(!processedRowIds.includes(rowId)) {

            const rowBasecampMapping: RowBasecampMapping = propertyStore[rowId];

            // Handle Todos
            const roleTodoIdMap: RoleTodoIdMap = rowBasecampMapping.roleTodoIdMap;
            const todoIds: string[] = Object.values(roleTodoIdMap);
            deleteTodos(todoIds);

            // Handle Schedule Entries
            // Have to use the Date constructor because GAS retrieves the date as a string
            const rowDate: Date = new Date(rowBasecampMapping.tabInfo.date);
            if(isInFuture(rowDate)) {
                const scheduleEntryId: string = rowBasecampMapping.scheduleEntryId;
                const scheduleEntryIdentifier: ScheduleEntryIdentifier = getScheduleEntryIdentifier(scheduleEntryId);
                deleteScheduleEntry(scheduleEntryIdentifier);
            }

            deleteDocumentProperty(rowId);
        }
    }
}

function isInFuture(date: Date): boolean {
    return date.getTime() > Date.now();
}
