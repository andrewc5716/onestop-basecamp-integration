import { getBasecampProjectUrl, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";
import { getBasecampDueDate, getBasecampTodoDescription, getLeadsBasecampIds } from "./row";

const TODOLISTS_PATH = '/todolists/';
const TODO_PATH = '/todos/';
const JSON_PATH = '.json';
const TODO_JSON_PATH = '/todos' + JSON_PATH;

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

function getCreateTodoUrl(todolistIdentifier: TodolistIdentifier): string {
    return getBasecampProjectUrl(todolistIdentifier.projectId) + TODOLISTS_PATH + todolistIdentifier.todolistId + TODO_JSON_PATH;
}

function getUpdateTodoUrl(todoIdentifier: TodoIdentifier): string {
    return getBasecampProjectUrl(todoIdentifier.projectId) + TODO_PATH + todoIdentifier.todoId + JSON_PATH;
}

export function getBasecampTodoForLeads(row: Row): BasecampTodoRequest {
    const leadIds: string[] = getLeadsBasecampIds(row);
    const basecampTodoDescription: string = getBasecampTodoDescription(row);
    const basecampDueDate: string = getBasecampDueDate(row);

    const basecampTodoRequest: BasecampTodoRequest = {
        content: `Lead: ${row.what.value}`,
        description: basecampTodoDescription,
        assignee_ids: leadIds,
        completion_subscriber_ids: leadIds,
        notify: true,
        due_on: basecampDueDate
    }

    return basecampTodoRequest;
}
