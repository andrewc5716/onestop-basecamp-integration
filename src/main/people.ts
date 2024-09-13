import { SD_TEAM } from "../../config/sdTeam";
import { getBasecampUrl, sendPaginatedBasecampGetRequest } from "./basecamp";
import { getScriptProperty, setScriptProperties } from "./propertiesService";

type PersonNameIdMap = {[key: string]: string};

const PEOPLE_PATH: string = "/people.json";

/**
 * Utility function that retrieves people from the Basecamp API, selects SD people, and then populates
 * the script properties with a map from person name to Basecamp person id. Can be invoked manually
 * from the Google Apps Script Developer UI
 */
export function populatePeopleInDb(): void {
    const requestUrl = getBasecampUrl() + PEOPLE_PATH;
    const peopleData: Person[] = sendPaginatedBasecampGetRequest(requestUrl) as Person[];
    
    // Filter people by SD; currently this is a no-op
    const sdPeople: Person[] = peopleData.filter((person) => SD_TEAM.has(person.name));

    // Reduce all of the people to a single map
    const personNameIdMap: PersonNameIdMap = sdPeople.reduce((map, person) => {
        map[person.name] = person.id;
        return map;
    }, {} as PersonNameIdMap);

    setScriptProperties(personNameIdMap);
}

/**
 * Retrieves a person's id from the script properties
 * 
 * @param personName the name of the person
 * @returns the person's Basecamp id
 */
export function getPersonId(personName: string): string {
    const personId: string | null = getScriptProperty(personName);

    if(personId === null) {
        throw new PersonMissingIdError(`Person does not have an id: [personName: ${personName}]`);
    }

    return personId;
}
