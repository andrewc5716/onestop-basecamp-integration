import { getBasecampUrl, sendPaginatedBasecampGetRequest } from "./basecamp";
import { PersonMissingIdError } from "./error/personMissingIdError";
import { PersonNameIdMapNotCachedError } from "./error/personNameIdMapNotCachedError";
import { getScriptProperty, setScriptProperty } from "./propertiesService";

type PersonNameIdMap = {[key: string]: string};

// Project ID hardcoded to our SD Basecamp Integration project for testing
// In the future we may consider moving this to a script property as a config value
const PROJECT_ID: string = "38736474";
const PEOPLE_PATH: string = `/projects/${PROJECT_ID}/people.json`;
const PEOPLE_MAP_KEY: string = "PEOPLE_MAP";

// Regex to match a person's name followed by a city in parentheses. ex. John MiddleName1 ... MiddleName5 Doe (SD)
const CITY_REGEX: string = "^(.*)\(([^)]*)\)$";

let cachedPersonNameIdMap: PersonNameIdMap | null = null;

/**
 * Utility function that retrieves people from the Basecamp API, selects SD people, and then populates
 * the script properties with a map from person name to Basecamp person id. Can be invoked manually
 * from the Google Apps Script Developer UI
 */
export function populatePeopleInDb(): void {
    const requestUrl: string = getBasecampUrl() + PEOPLE_PATH;
    const peopleData: Person[] = sendPaginatedBasecampGetRequest(requestUrl) as Person[];

    // Reduce all of the people to a single map
    const personNameIdMap: PersonNameIdMap = peopleData.reduce((map: PersonNameIdMap, person: Person) => {
        const match: RegExpMatchArray | null = person.name.match(CITY_REGEX);
        // Extracts the person's name without the city
        const personName: string = match ? `${match[1].trim()}` : person.name;

        map[personName] = person.id;
        return map;
    }, {} as PersonNameIdMap);

    setScriptProperty(PEOPLE_MAP_KEY, JSON.stringify(personNameIdMap));
    cachedPersonNameIdMap = personNameIdMap;
}

/**
 * Retrieves a person's id from their name first checking the in memory cache and then falling
 * back on the script properties if necessary
 * 
 * @param personName the name of the person
 * @returns the person's Basecamp id
 */
export function getPersonId(personName: string): string {
    // Check the in memory cache first
    if(cachedPersonNameIdMap !== null) {
        return getPersonIdFromCache(personName);
    }

    // Otherwise attempt to fetch it from the script properties
    const personNameIdMap: string | null = getScriptProperty(PEOPLE_MAP_KEY);

    if(personNameIdMap === null) {
        populatePeopleInDb();
        return getPersonIdFromCache(personName);
    }

    // Populate the cache and fetch the person id if it exists
    cachedPersonNameIdMap = JSON.parse(personNameIdMap);
    if(cachedPersonNameIdMap !== null && cachedPersonNameIdMap.hasOwnProperty(personName)) {
        return cachedPersonNameIdMap[personName];
    } else {
        throw new PersonMissingIdError(`Person does not have an id: [personName: ${personName}]`);
    }
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
function getPersonIdFromCache(personName: string): string {
    if(cachedPersonNameIdMap !== null) {
        if(cachedPersonNameIdMap.hasOwnProperty(personName)) {
            return cachedPersonNameIdMap[personName];
        } else {
            throw new PersonMissingIdError(`Person does not have an id: [personName: ${personName}]`);
        }
    } else {
        throw new PersonNameIdMapNotCachedError("Map of person name to id has not been cached");
    }
}
