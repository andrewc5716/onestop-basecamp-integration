import { getScriptProperty } from "../src/main/propertiesService";

export const PROD_BASECAMP_CLIENT_ID: string = getScriptProperty("BASECAMP_CLIENT_ID") ?? "";
export const PROD_BASECAMP_CLIENT_SECRET: string = getScriptProperty("BASECAMP_CLIENT_SECRET") ?? "";
export const PROD_BASECAMP_PROJECT_ID: string = getScriptProperty("BASECAMP_PROJECT_ID") ?? "";
export const PROD_BASECAMP_SCHEDULE_ID: string = getScriptProperty("BASECAMP_SCHEDULE_ID") ?? "";
export const PROD_BASECAMP_TODOLIST_ID: string = getScriptProperty("BASECAMP_TODOLIST_ID") ?? "";