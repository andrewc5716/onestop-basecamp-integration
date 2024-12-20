/**
 * To add a new filter, create a filter function that matches the type FilterFunction and then add the mapping to the FILTER_MAP
 */

import { MEMBER_MAP } from "./members";

type FilterMap = { [onestopFilterName: string]: FilterFunction };

const COMMA_DELIMITER: string = ",";
const BROS_GENDER: string = "Male";
const SIS_GENDER: string = "Female";
// Maps a filter's name on the Onestop to its corresponding filter function
const FILTER_MAP: FilterMap = {
    bros: brosFilter, 
    sis: sisFilter,
    married: marriedFilter,
    parents: parentsFilter,
    moms: momsFilter,
    dads: dadsFilter,
    "minus moms": minusMomsFilter,
    "minus dads": minusDadsFilter,
};

/**
 * Determines if a given string has a corresponding filter
 * 
 * @param potentialFilter the potential filter string
 * @returns boolean representing whether the given string has a corresponding filter
 */
export function isFilter(potentialFilter: string): boolean {
    return FILTER_MAP.hasOwnProperty(potentialFilter.toLowerCase());
}

/**
 * Filters an array of group members based on the given list of filters from the Onestop
 * 
 * @param groupMembers array of group members to filter
 * @param filterList comma separated list of filters from the Onestop
 * @returns array of group members that meet all of the filters criteria
 */
export function filterMembers(groupMembers: string[], filterList: string[]): string[] {
    return groupMembers.filter(getCombinedFilter(filterList));
}

/**
 * Constructs a singular filtering function meant to be passed into the array filter() function that is composed of all of the filters
 * in the given list from the Onestop. The returned filtering function should only return true if a group member meets the criteria for
 * every filter in the list
 * 
 * @param filterList list of filters from the Onestop
 * @returns singular filtering function that is composed of all of the filters from the filter list
 */
function getCombinedFilter(filterList: string[]): FilterFunction {
    const filterNames: string[] = getFilters(filterList);
    // Gets all filter function pointers using the FILTER_MAP
    const filterFunctions: FilterFunction[] = filterNames.map((filterName) => FILTER_MAP[filterName.toLowerCase()]).filter((filter) => filter != undefined);
    // Adds the valid member filter to the beginning. The first filter always applied will be to check if the member is valid
    filterFunctions.unshift(validMemberFilter);

    // Returns a function which only returns true if every filter function returns true; will short circuit
    return (memberName: string) => filterFunctions.every((filterFunction) => filterFunction(memberName));
}

function getFilters(filterList: string[]): string[] {
    return filterList.map(filterName => filterName.trim()).filter(filterName => filterName !== "");
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
