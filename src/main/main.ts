import { deleteDocumentProperty, getAllDocumentProperties } from "./propertiesService";
import { addBasecampLinkToRow, getRoleTodoMap, getSavedScheduleEntryId, getScheduleEntryRequestForRow, isMissingScheduleEntry, isMissingTodos, toString } from "./row";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, hasChanged, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
import { createScheduleEntryForRow, deleteScheduleEntry, getScheduleEntryIdentifier, updateScheduleEntry } from "./schedule";
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

    if(hasChanged(row) || isMissingTodos(row)) {
        Logger.log("Row has changed, or is missing todos. Updating...");
        // Update Todos and Schedule Entry if the row has changed or if Todos are missing
        const updatedRoleTodoMap: RoleTodoMap = handleTodosForExistingRow(row);
        const scheduleEntryId: string | undefined = handleScheduleEntryForExistingRow(row, updatedRoleTodoMap);
        saveRow(row, updatedRoleTodoMap, scheduleEntryId);
    } else if(isMissingScheduleEntry(row)) {
        Logger.log(`Row for ${toString(row)} is missing a schedule entry. Creating one...`);
        // Create the Schedule Entry if it is missing
        const roleTodoMap: RoleTodoMap = getRoleTodoMap(row);
        const scheduleEntryId: string | undefined = handleScheduleEntryForExistingRow(row, roleTodoMap);
        saveRow(row, roleTodoMap, scheduleEntryId);
    }
}

function handleTodosForExistingRow(row: Row): RoleTodoMap {
    const currentRoleRequestMap: RoleRequestMap = getBasecampTodoRequestsForRow(row);
    const lastSavedRoleTodoMap: RoleTodoMap  = getRoleTodoMap(row);

    deleteObsoleteTodos(currentRoleRequestMap, lastSavedRoleTodoMap);

    const newRoleTodoMap: RoleTodoMap = createTodosForNewRoles(currentRoleRequestMap, lastSavedRoleTodoMap);
    const existingRoleTodoMap: RoleTodoMap = updateTodosForExistingRoles(currentRoleRequestMap, lastSavedRoleTodoMap);

    return {...existingRoleTodoMap, ...newRoleTodoMap};
}

function handleScheduleEntryForExistingRow(row: Row, updatedRoleTodoMap: RoleTodoMap): string | undefined {
    let scheduleEntryId: string | undefined = getSavedScheduleEntryId(row);
    
    if(scheduleEntryId !== undefined) {
        // Update the Schedule Entry if it exists
        const scheduleEntryRequest: BasecampScheduleEntryRequest = getScheduleEntryRequestForRow(row, updatedRoleTodoMap);
        const scheduleEntryIdentifier: ScheduleEntryIdentifier = getScheduleEntryIdentifier(scheduleEntryId);

        try {
            updateScheduleEntry(scheduleEntryRequest, scheduleEntryIdentifier);
        } catch (error: any) {
            Logger.log(`Error updating schedule entry for row ${toString(row)}: ${error}`);
        }
    } else {
        // Create the Schedule Entry if it is missing
        const basecampScheduleEntry: BasecampScheduleEntry | undefined = createScheduleEntryForRow(row, updatedRoleTodoMap);
        scheduleEntryId = basecampScheduleEntry?.id;

        if(basecampScheduleEntry !== undefined) {
            addBasecampLinkToRow(row, basecampScheduleEntry.url);
        }
    }

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
    const roleTodoMap: RoleTodoMap = createNewTodos(roleRequestMap);
    const basecampScheduleEntry: BasecampScheduleEntry | undefined = createScheduleEntryForRow(row, roleTodoMap);

    if(basecampScheduleEntry !== undefined) {
        addBasecampLinkToRow(row, basecampScheduleEntry.url);
    }

    generateIdForRow(row);
    saveRow(row, roleTodoMap, basecampScheduleEntry?.id);
}

function deleteOldRows(processedRowIds: string[]): void {
    const propertyStore: DocumentProperties = getAllDocumentProperties();

    for(const rowId in propertyStore) {
        if(!processedRowIds.includes(rowId)) {

            const rowBasecampMapping: RowBasecampMapping = propertyStore[rowId];

            // Handle Todos
            const roleTodoMap: RoleTodoMap = rowBasecampMapping.roleTodoMap;
            const todoIds: string[] = Object.values(roleTodoMap).map(todo => todo.id);
            deleteTodos(todoIds);

            // Handle Schedule Entries
            // Have to use the Date constructor because GAS retrieves the date as a string
            const rowDate: Date = new Date(rowBasecampMapping.tabInfo.date);
            if(isInFuture(rowDate) && rowBasecampMapping.scheduleEntryId !== undefined) {
                const scheduleEntryId: string = rowBasecampMapping.scheduleEntryId;
                const scheduleEntryIdentifier: ScheduleEntryIdentifier = getScheduleEntryIdentifier(scheduleEntryId);

                try {
                    deleteScheduleEntry(scheduleEntryIdentifier);
                } catch (error: any) {
                    Logger.log(`Error deleting schedule entry for row ${rowId}: ${error}`);
                }
            }

            deleteDocumentProperty(rowId);
        }
    }
}

function isInFuture(date: Date): boolean {
    return date.getTime() > Date.now();
}
