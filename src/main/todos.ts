import { getBasecampProjectUrl, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";

const TODOLISTS_PATH: string = '/todolists/';
const TODO_PATH: string = '/todos/';
const JSON_PATH: string = '.json';
const TODO_JSON_PATH: string = '/todos' + JSON_PATH;
export const TODOLIST_ID: string= "7865336721";

/**
 * Creates a todo in Basecamp
 * 
 * @param todo object to put in Basecamp
 * @param todolistIdentifier id of the todolist where the todo will be created in
 * @returns the id of the created todo. This must be saved by the caller to update this todo in the future.
 */
export function createTodo(todo: BasecampTodoRequest, todolistIdentifier: TodolistIdentifier): string {
    const rawTodoResponse: JsonData = sendBasecampPostRequest(getCreateTodoUrl(todolistIdentifier), todo);
    const todoResponse: BasecampTodoResponse = rawTodoResponse as BasecampTodoResponse;
    return todoResponse.id;
}

/**
 * Updates a todo in Basecamp. This will fully replace the contents of the todo,
 * omitting any existing parameters will clear the existing todo's values.
 * 
 * @param todo payload to replace the existing todo
 * @param todoIdentifier id of the existing todo to replace
 */
export function updateTodo(todo: BasecampTodoRequest, todoIdentifier: TodoIdentifier): void {
    sendBasecampPutRequest(getUpdateTodoUrl(todoIdentifier), todo);
}

export function deleteTodo() {
    
}

function getCreateTodoUrl(todolistIdentifier: TodolistIdentifier): string {
    return getBasecampProjectUrl(todolistIdentifier.projectId) + TODOLISTS_PATH + todolistIdentifier.todolistId + TODO_JSON_PATH;
}

function getUpdateTodoUrl(todoIdentifier: TodoIdentifier): string {
    return getBasecampProjectUrl(todoIdentifier.projectId) + TODO_PATH + todoIdentifier.todoId + JSON_PATH;
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