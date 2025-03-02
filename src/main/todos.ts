import { BASECAMP_PROJECT_ID, BASECAMP_TODOLIST_ID } from "../../config/environmentVariables";
import { getBasecampProjectUrl, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";
import { BasecampRequestMissingError } from "./error/basecampRequestMissingError";
import { BasecampUnauthError } from "./error/basecampUnauthError";
import { TodoIdMissingError } from "./error/todoIdMissingError";
import { getExistingRoles, getNewRoles, getRemovedRoles } from "./role";

const TODOLISTS_PATH: string = '/todolists/';
const TODO_PATH: string = '/todos/';
const RECORDINGS_PATH: string = '/recordings/';
const JSON_PATH: string = '.json';
const TODO_JSON_PATH: string = '/todos' + JSON_PATH;
const TRASHED_TODO_JSON_PATH: string = '/status/trashed' + JSON_PATH;

/**
 * Creates a todo in Basecamp
 * 
 * @param request object to put in Basecamp
 * @param todolistIdentifier id of the todolist where the todo will be created in
 * @returns a BasecampTodo object representing the created Todo
 */
export function createTodo(request: BasecampTodoRequest, todolistIdentifier: TodolistIdentifier): BasecampTodo {
    Logger.log(`Creating new todo: "${request.content}"...\n`);
    const rawTodoResponse: JsonData = sendBasecampPostRequest(getCreateTodoUrl(todolistIdentifier), request);
    const todoResponse: BasecampTodoResponse = rawTodoResponse as BasecampTodoResponse;
    return { id: todoResponse.id, title: todoResponse.title, url: todoResponse.app_url };
}

/**
 * Updates a todo in Basecamp. This will fully replace the contents of the todo,
 * omitting any existing parameters will clear the existing todo's values.
 * 
 * @param request payload to replace the existing todo
 * @param todoIdentifier id of the existing todo to replace
 */
export function updateTodo(request: BasecampTodoRequest, todoIdentifier: TodoIdentifier): void {
    Logger.log(`Updating existing todo: "${request.content}"...\n`);
    sendBasecampPutRequest(getUpdateTodoUrl(todoIdentifier), request);
}


/**
 * Trashes a todo in Basecamp. 
 * 
 * @param todo payload to replace the existing todo
 * @param todoIdentifier id of the existing todo to replace
 */
export function deleteTodo(todoIdentifier: TodoIdentifier): void {
    Logger.log("Deleting todo...\n");
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
export function createNewTodos(roleRequestMap: RoleRequestMap): RoleTodoMap {
    const roleTodoMap: RoleTodoMap = {};

    Object.keys(roleRequestMap).forEach( role => {
        let request: BasecampTodoRequest = roleRequestMap[role];
        try {
            let basecampTodo: BasecampTodo = createTodo(request, getDefaultTodoListIdentifier());
            roleTodoMap[role] = basecampTodo;
        } catch(error: any) {
            if(error instanceof BasecampUnauthError) {
                throw error;
            }
            Logger.log(`Error creating todo for role ${role}: ${error}`);
        }
    });

    return roleTodoMap;
}

/**
 * Deletes the list of todos based on their todo ids
 * 
 * @param todoIds todo ids corresponding to todos to delete
 */
export function deleteTodos(todoIds: string[]): void {

    for(const id of todoIds) {

        let todoIdentifier: TodoIdentifier = {
            projectId: BASECAMP_PROJECT_ID,
            todoId: id
        }

        try {
            deleteTodo(todoIdentifier);
        } catch(error: any) {
            if(error instanceof BasecampUnauthError) {
                throw error;
            }
            Logger.log(`Error deleting todo with id ${id}: ${error}`);
        }
    }
}

/**
 * Deletes todos associated with helper groups that are no longer present on the event row.
 * The first line checks whether there are any rows present in the original roles that are not present in the current roles (indicating an obsolete role)
 * 
 * @param currentRoleRequestMap a map associating an event's roles with api request bodies
 * @param lastSavedRoleTodoMap a map associating an event's roles to existing todo objects, that is currently saved in the document properties
 * @returns a string array of obsolete roles that were deleted
 */
export function deleteObsoleteTodos(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoMap: RoleTodoMap): string[] {
    Logger.log("Checking for removed roles...\n")
    const removedRoles: string[] = getRemovedRoles(currentRoleRequestMap, lastSavedRoleTodoMap);

    if(removedRoles.length > 0) {
        const obsoleteTodoIds: string[] = getObsoleteTodosIds(removedRoles, lastSavedRoleTodoMap);
        deleteTodos(obsoleteTodoIds);

    } else {
        Logger.log("No removed roles detected!\n");
    }

    return removedRoles;
}

/**
 * Gets a list of obsolete todo ids based off of the obsolete roels roles by comparing the original and current roles together
 * 
 * @param obsoleteRoles an array of obsolete roles
 * @param lastSavedRoleTodoMap a map associating an event's roles with todo objects
 * @returns an array of obsolete roles
 */
export function getObsoleteTodosIds(obsoleteRoles: string[], lastSavedRoleTodoMap: RoleTodoMap): string[] {

    const obsoleteTodoIds: string[] = [];
    
    for(const role of obsoleteRoles) {
        Logger.log(`Found removed role: ${role}!\n`);
        let todoId: string = lastSavedRoleTodoMap[role].id;
        obsoleteTodoIds.push(todoId);
    }

    return obsoleteTodoIds;
}

/**
 * Updates todos for existing roles. Gets the request body from the roleRequestMap map
 * Gets the existing todo id from the roleTodoMap object
 * 
 * @param currentRoleRequestMap a map associating role titles with BasecampTodoRequest objects
 * @param lastSavedRoleTodoMap a map associating an event's roles to existing todo objects that is currently saved in the document properties
 * @returns an object mapping surviving roles with their existing todo objects
 */
export function updateTodosForExistingRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoMap: RoleTodoMap): RoleTodoMap {
    Logger.log("Updating todos for existing roles...");
    const existingRoleTodoMap: RoleTodoMap = {};
    const existingRoles: string[] = getExistingRoles(currentRoleRequestMap, lastSavedRoleTodoMap);

    for(const role of existingRoles) {
        let existingTodo: BasecampTodo = lastSavedRoleTodoMap[role];
        let request: BasecampTodoRequest = currentRoleRequestMap[role];

        if(request === undefined) {
            throw new BasecampRequestMissingError("Missing basecamp request!");

        } else if(existingTodo.id === undefined) {
            throw new TodoIdMissingError("Missing todo id!");
        }
        
        let todoIdentifier: TodoIdentifier = {
            projectId: BASECAMP_PROJECT_ID,
            todoId: existingTodo.id
        };

        try {
            updateTodo(request, todoIdentifier);
            existingRoleTodoMap[role] = existingTodo;
        } catch(error: any) {
            if(error instanceof BasecampUnauthError) {
                throw error;
            }
            Logger.log(`Error updating todo for role ${role}: ${error}`);
        }
    }

    return existingRoleTodoMap;
}

/**
 * Create todos for new roles. Gets the request body from the roleRequestMap map
 * 
 * @param currentRoleRequestMap a map associating an event's roles with api request bodies
 * @param lastSavedRoleTodoMap a map associating an event's roles to existing todo objects that is currently saved in the document properties
 * @returns an object mapping new roles with their newly created todo objects
 */
export function createTodosForNewRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoMap: RoleTodoMap): RoleTodoMap {
    Logger.log("Checking for new roles...\n");

    const newRoles: string[] = getNewRoles(currentRoleRequestMap, lastSavedRoleTodoMap);
    const newRoleTodoMap: RoleTodoMap = {};
    
    if(newRoles.length > 0) {
        Logger.log(`New role(s) detected: ${newRoles}\n`);
        for(const role of newRoles) {
            let request: BasecampTodoRequest = currentRoleRequestMap[role];

            if(request === undefined) {
                throw new BasecampRequestMissingError("Missing basecamp request!");
            }

            try {
                let newTodoId = createTodo(request, getDefaultTodoListIdentifier());
                newRoleTodoMap[role] = newTodoId;
            } catch(error: any) {
                if(error instanceof BasecampUnauthError) {
                    throw error;
                }
                Logger.log(`Error creating todo for role ${role}: ${error}`);
            }
        }

    } else {
        Logger.log("No new roles detected!\n");
    }

    return newRoleTodoMap;
}

function getDefaultTodoListIdentifier(): TodolistIdentifier {
    return {
        projectId: BASECAMP_PROJECT_ID,
        todolistId: BASECAMP_TODOLIST_ID
    }
};