import { getScriptProperty } from "../src/main/propertiesService";

export const PROD_BASECAMP_CLIENT_ID: string = getScriptProperty("BASECAMP_CLIENT_ID") ?? "";
export const PROD_BASECAMP_CLIENT_SECRET: string = getScriptProperty("BASECAMP_CLIENT_SECRET") ?? "";