import { BASECAMP_PROJECT_ID, BASECAMP_SCHEDULE_ID } from "../../config/environmentVariables";
import { getBasecampProjectUrl, sendBasecampPostRequest, sendBasecampPutRequest } from "./basecamp";
import { BasecampUnauthError } from "./error/basecampUnauthError";
import { getScheduleEntryRequestForRow, toString } from "./row";

const SCHEDULES_PATH: string = '/schedules/';
const SCHEDULE_ENTRIES: string = '/schedule_entries/';
const JSON_PATH: string = '.json';
const ENTRIES_JSON_PATH: string = '/entries' + JSON_PATH;
const RECORDINGS_PATH: string = '/recordings/';
const TRASHED_STATUS_JSON_PATH: string = '/status/trashed' + JSON_PATH;

/**
 * Creates a schedule entry (event) in Basecamp
 * 
 * @param request schedule entry object to create in Basecamp
 * @param scheduleIdentifier schedule id where the schedule entry will be created in
 * @returns id of the created schedule entry
 */
export function createScheduleEntry(request: BasecampScheduleEntryRequest, scheduleIdentifier: ScheduleIdentifier): BasecampScheduleEntry {
    Logger.log(`Creating new schedule entry: "${request.summary}"`);
    const rawScheduleEntryResponse: JsonData = sendBasecampPostRequest(getCreateScheduleEntryUrl(scheduleIdentifier), request);
    const scheduleEntryResponse: BasecampScheduleEntryResponse = rawScheduleEntryResponse as BasecampScheduleEntryResponse;
    return { id: scheduleEntryResponse.id, url: scheduleEntryResponse.app_url };
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

/**
 * Trashes a schedule entry in Basecamp. 
 * 
 * @param scheduleEntryIdentifier: id of the schedule entry to delete
 */
export function deleteScheduleEntry(scheduleEntryIdentifier: ScheduleEntryIdentifier): void {
    Logger.log(`Deleting schedule entry: "${scheduleEntryIdentifier.scheduleEntryId}"`);
    sendBasecampPutRequest(getDeleteScheduleEntryUrl(scheduleEntryIdentifier), {});
}

export function getBasecampScheduleEntryRequest(summary: string, startsAt: string, endsAt: string, description: string, participantIds: string[], allDay: boolean, notify: boolean): BasecampScheduleEntryRequest {
    return {
        summary: summary,
        starts_at: startsAt,
        ends_at: endsAt,
        description: description,
        participant_ids: participantIds,
        all_day: allDay,
        notify: notify,
    };
}

export function getDefaultScheduleIdentifier(): ScheduleIdentifier {
    return {
        projectId: BASECAMP_PROJECT_ID,
        scheduleId: BASECAMP_SCHEDULE_ID,
    };
}

export function getScheduleEntryIdentifier(scheduleEntryId: string): ScheduleEntryIdentifier {
    return {
        projectId: BASECAMP_PROJECT_ID,
        scheduleEntryId: scheduleEntryId,
    }
}

function getCreateScheduleEntryUrl(scheduleIdentifier: ScheduleIdentifier): string {
    return getBasecampProjectUrl(scheduleIdentifier.projectId) + SCHEDULES_PATH + scheduleIdentifier.scheduleId + ENTRIES_JSON_PATH;
}

function getUpdateScheduleEntryUrl(scheduleEntryIdentifier: ScheduleEntryIdentifier): string {
    return getBasecampProjectUrl(scheduleEntryIdentifier.projectId) + SCHEDULE_ENTRIES + scheduleEntryIdentifier.scheduleEntryId + JSON_PATH;
}

function getDeleteScheduleEntryUrl(scheduleEntryIdentifier: ScheduleEntryIdentifier): string {
    return getBasecampProjectUrl(scheduleEntryIdentifier.projectId) + RECORDINGS_PATH + scheduleEntryIdentifier.scheduleEntryId + TRASHED_STATUS_JSON_PATH;
}

export function createScheduleEntryForRow(row: Row, roleTodoMap: RoleTodoMap): BasecampScheduleEntry | undefined {
    const scheduleEntryRequest: BasecampScheduleEntryRequest = getScheduleEntryRequestForRow(row, roleTodoMap);
    let basecampScheduleEntry: BasecampScheduleEntry | undefined = undefined;
    try {
        basecampScheduleEntry = createScheduleEntry(scheduleEntryRequest, getDefaultScheduleIdentifier());
    } catch(error: any) {   
        if(error instanceof BasecampUnauthError) {
            throw error;
        }
        Logger.log(`Error creating schedule entry for ${toString(row)}: ${error}`);
    }

    return basecampScheduleEntry;
}
