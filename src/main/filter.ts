/**
 * To add a new filter, create a filter function that matches the type FilterFunction and then add the mapping to the FILTER_MAP
 */

import { MEMBER_MAP } from "./members";

type FilterMap = { [onestopFilterName: string]: FilterFunction };

const COMMA_DELIMITER: string = ",";
const BROS_GENDER: string = "Male";
const SIS_GENDER: string = "Female";

// Maps a filter's name on the Onestop to its corresponding filter function
export const FILTER_MAP: FilterMap = {
    Bros: brosFilter, 
    Sis: sisFilter,
    Married: marriedFilter,
    Parents: parentsFilter,
    Moms: momsFilter,
    Dads: dadsFilter,
    "Minus Moms": minusMomsFilter,
    "Minus Dads": minusDadsFilter,
};

/**
 * A list of all the filters from FILTER_MAP
 */
export const FILTER_NAMES: string[] = Object.keys(FILTER_MAP) as string[];

/**
 * Filters an array of group members based on the given list of filters from the Onestop
 * 
 * @param groupMembers array of group members to filter
 * @param filterList comma separated list of filters from the Onestop
 * @returns array of group members that meet all of the filters criteria
 */
export function filterMembers(groupMembers: string[], filterList: string): string[] {
    return groupMembers.filter(getCombinedFilter(filterList));
}

/**
 * Constructs a singular filtering function meant to be passed into the array filter() function that is composed of all of the filters
 * in the given list from the Onestop. The returned filtering function should only return true if a group member meets the criteria for
 * every filter in the list
 * 
 * @param filterList comma separated list of filters from the Onestop
 * @returns singular filtering function that is composed of all of the filters from the filter list
 */
function getCombinedFilter(filterList: string): FilterFunction {
    const filterNames: string[] = parseFilterNames(filterList);
    // Gets all filter function pointers using the FILTER_MAP
    const filterFunctions: FilterFunction[] = filterNames.map((filterName) => FILTER_MAP[filterName]).filter((filter) => filter != undefined);
    // Adds the valid member filter to the beginning. The first filter always applied will be to check if the member is valid
    filterFunctions.unshift(validMemberFilter);

    // Returns a function which only returns true if every filter function returns true; will short circuit
    return (memberName: string) => filterFunctions.every((filterFunction) => filterFunction(memberName));
}

function parseFilterNames(filterList: string): string[] {
    return filterList.split(COMMA_DELIMITER).map(filterName => filterName.trim()).filter(filterName => filterName !== "");
}

function validMemberFilter(memberName: string): boolean {
    return MEMBER_MAP.hasOwnProperty(memberName);
}

function brosFilter(memberName: string): boolean {
    return MEMBER_MAP[memberName].gender === BROS_GENDER;
}

function sisFilter(memberName: string): boolean {
    return MEMBER_MAP[memberName].gender === SIS_GENDER;
}

function marriedFilter(memberName: string): boolean {
    return MEMBER_MAP[memberName].married;
}

function parentsFilter(memberName: string): boolean {
    return MEMBER_MAP[memberName].parent;
}

function dadsFilter(memberName: string): boolean {
    const member: Member = MEMBER_MAP[memberName];
    return member.gender === BROS_GENDER && member.parent;
}

function momsFilter(memberName: string): boolean {
    const member: Member = MEMBER_MAP[memberName];
    return member.gender === SIS_GENDER && member.parent;
}

function minusMomsFilter(memberName: string): boolean {
    return !momsFilter(memberName);
}

function minusDadsFilter(memberName: string): boolean {
    return !dadsFilter(memberName);
}
