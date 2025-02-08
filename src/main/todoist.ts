import { fetchWithRetry } from "./retry";
import {TODOIST_USER_TOKEN_MAP} from "../../config/environmentVariables";

const TODOIST_API_BASE_URL = "https://api.todoist.com/rest/v2";
const TODOIST_LABEL_NAME = "OnestopIntegration";

export interface TodoistLabel {
  id: string;             // The unique identifier of the label
  name: string;           // The name of the label
  color: string;          // The color name of the label
  order: number;          // The order of the label in the label list
  is_favorite: boolean;   // Indicates whether the label is marked as a favorite
}
export interface TodoistDue {
  date: string;          // The due date of the task in YYYY-MM-DD format
  string: string;        // The user-input due string (e.g., "Feb 8")
  lang: string;          // The language of the due string
  is_recurring: boolean; // Whether the due date is recurring
}
export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  is_completed: boolean;
  due: TodoistDue | null;
}
export type TodoistGetLabelsResponse = TodoistLabel[];
export type TodoistGetTasksResponse = TodoistTask[];


/**
 * Creates the "OnestopIntegration" label in Todoist if it doesn't already exist.
 * @param token - The Todoist API token.
 */
export function createLabelIfNotExists(token: string): void {
  const response = fetchWithRetry(`${TODOIST_API_BASE_URL}/labels`, {
    method: 'get',
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const jsonResponse: TodoistGetLabelsResponse = JSON.parse(response.getContentText());
  const labelExists = jsonResponse?.some((label: any) => label.name === TODOIST_LABEL_NAME);

  if (!labelExists) {
    fetchWithRetry(`${TODOIST_API_BASE_URL}/labels`, {
      method: "post",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({ name: TODOIST_LABEL_NAME })
    });
  }
}

/**
 * Deletes all existing Todoist tasks created by the integration in preparation for new ones to be created.
 * Retrieve and clear out existing Todoist tasks with the label "OnestopIntegration"
 * @param token - The Todoist API token.
 */
export function clearTodoistTasks(token: string): void {
  createLabelIfNotExists(token);

  const response = fetchWithRetry(`${TODOIST_API_BASE_URL}/tasks`, {
    method: "get",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const jsonResponse: TodoistGetTasksResponse = JSON.parse(response.getContentText());

  const tasksToDelete = jsonResponse.filter((task: any) => task.labels.includes(TODOIST_LABEL_NAME));

  for (const task of tasksToDelete) {
    fetchWithRetry(`${TODOIST_API_BASE_URL}/tasks/${task.id}`, {
      method: "delete",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
  }
}

/**
 * Creates a new Todoist task
 * @param token - The Todoist API token.
 * @param title - The title of the task.
 * @param description - The description of the task.
 * @param datetime - The due date and time of the task in ISO 8601 format.
 */
export function createTodoistTask(token: string, title: string, description: string, datetime: string): void {
  fetchWithRetry(`${TODOIST_API_BASE_URL}/tasks`, {
    method: "post",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      content: title,
      description: description,
      due_datetime: datetime,
      labels: [TODOIST_LABEL_NAME]
    })
  });
}
