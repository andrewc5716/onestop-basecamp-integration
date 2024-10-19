import { deleteDocumentProperty, getAllDocumentProperties } from "./propertiesService";
import { getRoleTodoIdMap } from "./row";
import { generateIdForRow, getBasecampTodoRequestsForRow, getId, hasChanged, hasId, saveRow } from "./row";
import { getEventRowsFromSpreadsheet } from "./scan";
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

        const currentRoleRequestMap: RoleRequestMap = getBasecampTodoRequestsForRow(row);
        const lastSavedRoleTodoIdMap: RoleTodoIdMap  = getRoleTodoIdMap(row);

        deleteObsoleteTodos(currentRoleRequestMap, lastSavedRoleTodoIdMap);

        const newRoleTodoIdMap: RoleTodoIdMap = createTodosForNewRoles(currentRoleRequestMap, lastSavedRoleTodoIdMap);
        const existingRoleTodoIdMap: RoleTodoIdMap = updateTodosForExistingRoles(currentRoleRequestMap, lastSavedRoleTodoIdMap);

        const updatedRoleTodoIdMap: RoleTodoIdMap = {...existingRoleTodoIdMap, ...newRoleTodoIdMap};

        saveRow(row, updatedRoleTodoIdMap);
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
    const roleRequestMap: RoleRequestMap = getBasecampTodoRequestsForRow(row);
    const roleTodoIdMap: RoleTodoIdMap = createNewTodos(roleRequestMap);

    if(Object.keys(roleTodoIdMap).length > 0) {
        generateIdForRow(row);
        saveRow(row, roleTodoIdMap);
    }
}

function deleteOldRows(processedRowIds: string[]): void {
    const propertyStore: DocumentProperties = getAllDocumentProperties();

    for(const rowId in propertyStore) {
        if(!processedRowIds.includes(rowId)) {

            const rowBasecampMapping: RowBasecampMapping = propertyStore[rowId];
            const roleTodoIdMap: RoleTodoIdMap = rowBasecampMapping.roleTodoIdMap;
            const todoIds: string[] = Object.values(roleTodoIdMap);

            deleteTodos(todoIds);
            deleteDocumentProperty(rowId);
        }
    }
}