import { getBasecampProjectUrl, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";

const SCHEDULES_PATH: string = '/schedules/';
const SCHEDULE_ENTRIES: string = '/schedule_entries/';
const JSON_PATH: string = '.json';
const ENTRIES_JSON_PATH: string = '/entries' + JSON_PATH;

/**
 * Creates a schedule entry (event) in Basecamp
 * 
 * @param request schedule entry object to create in Basecamp
 * @param scheduleIdentifier schedule id where the schedule entry will be created in
 * @returns id of the created schedule entry
 */
export function createScheduleEntry(request: BasecampScheduleEntryRequest, scheduleIdentifier: ScheduleIdentifier): string {
    Logger.log(`Creating new schedule entry: "${request.summary}"`);
    const rawScheduleEntryResponse: JsonData = sendBasecampPostRequest(getCreateScheduleEntryUrl(scheduleIdentifier), request);
    const scheduleEntryResponse: BasecampScheduleEntryResponse = rawScheduleEntryResponse as BasecampScheduleEntryResponse;
    return scheduleEntryResponse.id;
}

/**
 * Updates a schedule entry in Basecamp. This performs a full replacement.
 * 
 * @param request Updates a schedule entry in Basecamp. This performs a full replacement.
 * @param scheduleEntryIdentifier id of the schedule entry to update
 */
export function updateScheduleEntry(request: BasecampScheduleEntryRequest, scheduleEntryIdentifier: ScheduleEntryIdentifier): void {
    Logger.log(`Updating schedule entry: "${request.summary}"`);
    sendBasecampPutRequest(getUpdateScheduleEntryUrl(scheduleEntryIdentifier), request);
}

function getCreateScheduleEntryUrl(scheduleIdentifier: ScheduleIdentifier): string {
    return getBasecampProjectUrl(scheduleIdentifier.projectId) + SCHEDULES_PATH + scheduleIdentifier.scheduleId + ENTRIES_JSON_PATH;
}

function getUpdateScheduleEntryUrl(scheduleEntryIdentifier: ScheduleEntryIdentifier): string {
    return getBasecampProjectUrl(scheduleEntryIdentifier.projectId) + SCHEDULE_ENTRIES + scheduleEntryIdentifier.scheduleEntryId + JSON_PATH;
}