import { getBasecampProjectUrl, PROJECT_ID, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";
import { BasecampRequestMissingError } from "./error/basecampRequestMissingError";
import { DEFAULT_TODOLIST_IDENTIFIER } from "./main";
import { getRoles, RoleStatus } from "./role";

const TODOLISTS_PATH: string = '/todolists/';
const TODO_PATH: string = '/todos/';
const RECORDINGS_PATH: string = '/recordings/';
const JSON_PATH: string = '.json';
const TODO_JSON_PATH: string = '/todos' + JSON_PATH;
const TRASHED_TODO_JSON_PATH: string = '/status/trashed' + JSON_PATH;

export const TODOLIST_ID: string= "7865336721";

/**
 * Creates a todo in Basecamp
 * 
 * @param todo object to put in Basecamp
 * @param todolistIdentifier id of the todolist where the todo will be created in
 * @returns the id of the created todo. This must be saved by the caller to update this todo in the future.
 */
export function createTodo(request: BasecampTodoRequest | undefined, todolistIdentifier: TodolistIdentifier): string {
    
    if(request == undefined) {
        throw new BasecampRequestMissingError("Missing basecamp request!");
    } else {
        Logger.log(`Creating new todo: "${request.content}"...\n`)
        const rawTodoResponse: JsonData = sendBasecampPostRequest(getCreateTodoUrl(todolistIdentifier), request);
        const todoResponse: BasecampTodoResponse = rawTodoResponse as BasecampTodoResponse;
        return todoResponse.id;
    }
}

/**
 * Updates a todo in Basecamp. This will fully replace the contents of the todo,
 * omitting any existing parameters will clear the existing todo's values.
 * 
 * @param todo payload to replace the existing todo
 * @param todoIdentifier id of the existing todo to replace
 */
export function updateTodo(request: BasecampTodoRequest | undefined, todoIdentifier: TodoIdentifier): void {

    if(request == undefined) {
        throw new BasecampRequestMissingError("Missing basecamp request!");
    } else {
        Logger.log(`Updating existing todo: "${request.content}"...\n`)
        sendBasecampPutRequest(getUpdateTodoUrl(todoIdentifier), request);
    }
}


/**
 * Trashes a todo in Basecamp. 
 * 
 * @param todo payload to replace the existing todo
 * @param todoIdentifier id of the existing todo to replace
 */
export function deleteTodo(todoIdentifier: TodoIdentifier): void {
    Logger.log("Deleting todo...\n")
    sendBasecampPutRequest(getDeleteTodoUrl(todoIdentifier), {});
}

function getCreateTodoUrl(todolistIdentifier: TodolistIdentifier): string {
    return getBasecampProjectUrl(todolistIdentifier.projectId) + TODOLISTS_PATH + todolistIdentifier.todolistId + TODO_JSON_PATH;
}

function getUpdateTodoUrl(todoIdentifier: TodoIdentifier): string {
    return getBasecampProjectUrl(todoIdentifier.projectId) + TODO_PATH + todoIdentifier.todoId + JSON_PATH;
}

function getDeleteTodoUrl(todoIdentifier: TodoIdentifier): string {
    return getBasecampProjectUrl(todoIdentifier.projectId) + RECORDINGS_PATH + todoIdentifier.todoId + TRASHED_TODO_JSON_PATH;
}

/**
 * Constructs a BasecampTodoRequest object
 * 
 * @param content Name for the Todo object
 * @param description Description for the Todo object
 * @param assigneeIds array of assignee ids who the Todo will be assigned to
 * @param completionSubsciberIds array of user ids who will be notified when the Todo is completed
 * @param notify whether to notify the assignees upon Todo creation
 * @param basecampDueDate when the Todo is due; YYYY-MM-DD
 * @returns BasecampTodoRequest object
 */
export function getBasecampTodoRequest(content: string, description: string, assigneeIds: string[], completionSubsciberIds: string[], 
    notify: boolean, basecampDueDate: string): BasecampTodoRequest {
    return {
        content: content,
        description: description,
        assignee_ids: assigneeIds,
        completion_subscriber_ids: completionSubsciberIds,
        notify: notify,
        due_on: basecampDueDate
    }
}

/**
 * Sends requests to create new Basecamp Todos
 * 
 * @param basecampRequests array of BasecampTodoRequest objects to send
 * @returns a map that associates role titles with basecamp todo ids
 */
export function createNewTodos(roleRequestMap: RoleRequestMap): RoleTodoIdMap {
    const roleTodoIdMap: RoleTodoIdMap = {};

    Object.keys(roleRequestMap).forEach( role => {
        let request = roleRequestMap[role];
        let basecampTodoId: string = createTodo(request, DEFAULT_TODOLIST_IDENTIFIER)
        roleTodoIdMap[role] = basecampTodoId;
    });

    return roleTodoIdMap;
}

/**
 * Deletes the list of todos based on their todo ids
 * 
 * @param todoIds todo ids corresponding to todos to delete
 */
export function deleteTodos(todoIds: string[]): void {

    for(const id of todoIds) {

        let todoIdentifier: TodoIdentifier = {
            projectId: PROJECT_ID,
            todoId: id
        }

        deleteTodo(todoIdentifier);
    }
}

/**
 * Deletes todos associated with helper groups that are no longer present on the event row.
 * The first line checks whether there are any rows present in the original roles that are not present in the current roles (indicating an obsolete role)
 * 
 * @param roleRequestMap a map associating an event's roles with api request bodies
 * @param currentRoleTodoIdMap a map associating an event's roles to existing todo ids, that is currently saved in the document properties
 * @returns a string array of obsolete roles that were deleted
 */
export function deleteObsoleteTodos(roleRequestMap: RoleRequestMap, currentRoleTodoIdMap: RoleTodoIdMap): string[] {
    Logger.log("Checking for obsolete roles...\n")
    const obsoleteRoles: string[] = getRoles(roleRequestMap, currentRoleTodoIdMap, RoleStatus.OBSOLETE);

    if(obsoleteRoles.length > 0) {
        const obsoleteTodoIds: string[] = getObsoleteTodosIds(obsoleteRoles, currentRoleTodoIdMap);
        deleteTodos(obsoleteTodoIds);

    } else {
        Logger.log("No obsolete roles detected!\n");
    }

    return obsoleteRoles;
}

/**
 * Gets a list of obsolete todo ids based off of the obsolete roels roles by comparing the original and current roles together
 * 
 * @param obsoleteRoles an array of obsolete roles
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 * @returns an array of obsolete roles
 */
export function getObsoleteTodosIds(obsoleteRoles: string[], roleTodoIdMap: RoleTodoIdMap): string[] {

    const obsoleteTodoIds = []
    
    for(const role of obsoleteRoles) {
        Logger.log(`Found obsolete role: ${role}!\n`)
        let todoId = roleTodoIdMap[role];
        obsoleteTodoIds.push(todoId);
    }

    return obsoleteTodoIds
}

/**
 * Updates todos for existing roles. Gets the request body from the roleRequestMap map
 * Gets the existing todo id from the roleTodoIdMap object
 * 
 * @param roleRequestMap a map associating role titles with BasecampTodoRequest objects
 * @param roleTodoIdMap a map associating an event's roles to existing todo ids that is currently saved in the document properties
 * @returns an object mapping surviving roles with their existing todo ids
 */
export function updateTodosForSurvivingRoles(roleRequestMap: RoleRequestMap, roleTodoIdMap: RoleTodoIdMap): RoleTodoIdMap {
    Logger.log("Updating todos for surviving roles...");
    const survivingRoleTodoIdMap: RoleTodoIdMap = {};
    const survivingRoles: string[] = getRoles(roleRequestMap, roleTodoIdMap, RoleStatus.SURVIVING);

    for(const role of survivingRoles) {
        let survivingTodoId = roleTodoIdMap[role];
        let request = roleRequestMap[role];

        let todoIdentifier: TodoIdentifier = {
            projectId: PROJECT_ID,
            todoId: survivingTodoId
        }

        updateTodo(request, todoIdentifier);

        survivingRoleTodoIdMap[role] = survivingTodoId;
    }

    return survivingRoleTodoIdMap;
}

/**
 * Create todos for new roles. Gets the request body from the roleRequestMap map
 * 
 * @param roleRequestMap a map associating an event's roles with api request bodies
 * @param roleTodoIdMap a map associating an event's roles to existing todo ids that is currently saved in the document properties
 * @returns an object mapping new roles with their newly created todo ids
 */
export function createTodosForNewRoles(roleRequestMap: RoleRequestMap, roleTodoIdMap: RoleTodoIdMap): RoleTodoIdMap {
    Logger.log("Checking for new roles...\n");

    const newRoles: string[] = getRoles(roleRequestMap, roleTodoIdMap, RoleStatus.NEW);
    const newRoleTodoIdMap: RoleTodoIdMap = {};
    
    if(newRoles.length > 0) {
        Logger.log(`New role(s) detected: ${newRoles}\n`)
        for(const role of newRoles) {
            let request = roleRequestMap[role];
            let newTodoId = createTodo(request, DEFAULT_TODOLIST_IDENTIFIER);
            newRoleTodoIdMap[role] = newTodoId;
        }

    } else {
        Logger.log("No new roles detected!\n")
    }

    return newRoleTodoIdMap;
}