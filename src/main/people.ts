import { BASECAMP_PROJECT_ID } from "../../config/environmentVariables";
import { getBasecampUrl, sendPaginatedBasecampGetRequest } from "./basecamp";
import { PersonNameIdMapNotCachedError } from "./error/personNameIdMapNotCachedError";
import { MEMBER_MAP } from "./members";
import { getScriptProperty, setScriptProperty } from "./propertiesService";

type PersonNameIdMap = {[key: string]: string};

const PEOPLE_JSON: string = "/people.json";
const PROJECTS_PATH: string = "/projects/";
const PEOPLE_MAP_KEY: string = "PEOPLE_MAP";
const REMOVE_PARENTHESES_REGEX: RegExp = /\(.*?\)/g;
const REMOVE_EXTRA_WHITESPACE_REGEX: RegExp = /\s+/g;
const STAFF_REGEX: RegExp = /\bstaff\b/gi;

let cachedPersonNameIdMap: PersonNameIdMap | null = null;

/**
 * Utility function that retrieves people from the Basecamp API, selects SD people, and then populates
 * the script properties with a map from person name to Basecamp person id. Can be invoked manually
 * from the Google Apps Script Developer UI
 */
export function populatePeopleInDb(): void {
    const requestUrl: string = getPeoplePath();
    const peopleData: Person[] = sendPaginatedBasecampGetRequest(requestUrl) as Person[];

    // Reduce all of the people to a single map
    const personNameIdMap: PersonNameIdMap = peopleData.reduce((map: PersonNameIdMap, person: Person) => {
        const personName: string = normalizePersonName(person.name);
        map[personName] = person.id;
        return map;
    }, {} as PersonNameIdMap);

    setScriptProperty(PEOPLE_MAP_KEY, JSON.stringify(personNameIdMap));
    cachedPersonNameIdMap = personNameIdMap;
}

function getPeoplePath(): string {
    return getBasecampUrl() + PROJECTS_PATH + BASECAMP_PROJECT_ID + PEOPLE_JSON;
}

/**
 * Retrieves a person's id from their name first checking the in memory cache and then falling
 * back on the script properties if necessary
 * 
 * @param personName the name of the person
 * @returns the person's Basecamp id
 */
export function getPersonId(personName: string): string | undefined {
    const normalizedPersonName: string = normalizePersonName(personName);

    // Pull the basecamp id from the member properties if possible
    if(MEMBER_MAP.hasOwnProperty(normalizedPersonName)) {
        return MEMBER_MAP[normalizedPersonName].basecampId;
    }

    // Otherwise fallback on the legacy method that relies on the basecamp people endpoint
    Logger.log("Falling back to legacy method to fetch person basecamp id");

    // Check the in memory cache first
    if(cachedPersonNameIdMap !== null) {
        const id: string | undefined = getPersonIdFromCache(normalizedPersonName);

        if(id !== undefined) {
            return id;
        }
    }

    // Otherwise attempt to fetch it from the script properties
    const personNameIdMap: string | null = getScriptProperty(PEOPLE_MAP_KEY);

    if(personNameIdMap === null) {
        populatePeopleInDb();
        return getPersonIdFromCache(normalizedPersonName);
    }

    // Populate the cache and fetch the person id if it exists
    cachedPersonNameIdMap = JSON.parse(personNameIdMap);
    return getPersonIdFromCache(normalizedPersonName);
}

/**
 * Returns whether or not the people have been populated in the db
 * 
 * @returns boolean representing whether or not the people have been populated in the db
 */
export function peopleHaveBeenPopulated(): boolean {
    const personNameIdMap: string | null = getScriptProperty(PEOPLE_MAP_KEY);

    return personNameIdMap !== null;
}

/**
 * Fetches a person's Basecampe id given their name from the in memory cache
 * 
 * @param personName the person's name to fetch the id for
 * @returns the person's id
 */
function getPersonIdFromCache(personName: string): string | undefined {
    if(cachedPersonNameIdMap !== null) {
        if(cachedPersonNameIdMap.hasOwnProperty(personName)) {
            return cachedPersonNameIdMap[personName];
        } else {
            return undefined;
        }
    } else {
        throw new PersonNameIdMapNotCachedError("Map of person name to id has not been cached");
    }
}

/**
 * Normalizes a person name removing any city in parenthesis if found, and also removes middle names
 * 
 * @param rawPersonName person name that may include city in parenthesis, e.g. Andrew Chan (Sd)
 * @returns the person's name without parentheses
 */
export function normalizePersonName(rawPersonName: string): string {
    const withoutParentheses: string = rawPersonName.replace(REMOVE_PARENTHESES_REGEX, '');
    const withoutExtraWhitespace: string = withoutParentheses.replace(REMOVE_EXTRA_WHITESPACE_REGEX, ' ');
    const withoutStaffWord: string = withoutExtraWhitespace.replace(STAFF_REGEX, '');
    return withoutStaffWord.toLowerCase().trim();
}
