import { getBasecampProjectUrl, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";

const TODOLISTS_PATH = '/todolists/';
const TODO_PATH = '/todos/';
const JSON_PATH = '.json';
const TODO_JSON_PATH = '/todos' + JSON_PATH;

export function createTodo(todo: BasecampTodoRequest, todolistIdentifier: TodolistIdentifier): string {
    const rawTodoResponse: JsonData = sendBasecampPostRequest(getCreateTodoUrl(todolistIdentifier), todo);
    const todoResponse: BasecampTodoResponse = rawTodoResponse as BasecampTodoResponse;
    return todoResponse.id;
}

export function updateTodo(todo: BasecampTodoRequest, todoIdentifier: TodoIdentifier): void {
    sendBasecampPutRequest(getUpdateTodoUrl(todoIdentifier), todo);
}

function getCreateTodoUrl(todolistIdentifier: TodolistIdentifier): string {
    return getBasecampProjectUrl(todolistIdentifier.projectId) + TODOLISTS_PATH + todolistIdentifier.todolistId + TODO_JSON_PATH;
}

function getUpdateTodoUrl(todoIdentifier: TodoIdentifier): string {
    return getBasecampProjectUrl(todoIdentifier.projectId) + TODO_PATH + todoIdentifier.todoId + JSON_PATH;
}