import { loadMapFromScriptProperties, setScriptProperty } from "./propertiesService";
import { getCellValues } from "./scan";

const COMMA_DELIMITER: string = ",";
const GROUPS_TAB_NAME: string = "Groups";
const SUPERGROUPS_TAB_NAME: string = "Supergroups";
const GROUP_NAME_COLUMN_INDEX: number = 0;
const GROUP_MEMBER_NAMES_COLUMN_INDEX: number = 1;
const SUPERGROUP_NAME_COLUMN_INDEX: number = 0;
const SUBGROUP_COLUMN_INDEX: number = 1;
const GROUPS_MAP_KEY: string = "GROUPS_MAP";

// Interface declared here because this is an internal object used only during the Supergroup loading process
declare interface Supergroup {
    name: string,
    subgroups: string[],
};

// Maps a Supergroup name to its corresponding Supergroup object
// Only used internally within this module for loading
type SupergroupMap = { [key: string]: Supergroup };

export const GROUPS_MAP: GroupsMap = loadMapFromScriptProperties(GROUPS_MAP_KEY) as GroupsMap;

/**
 * Loads groups and supergroups from the Onestop into script properties
 */
export function loadGroupsFromOnestopIntoScriptProperties(): void {
    const groupsMap: GroupsMap = loadGroupsFromOnestop();
    const supergroupsMap: GroupsMap = loadSupergroupsFromOnestop(groupsMap);
    const combinedGroupsMaps: GroupsMap = mergeGroupsMaps(groupsMap, supergroupsMap);
    const duplicateFreeGroupsMap: GroupsMap = removeDuplicatesFromGroupMaps(combinedGroupsMaps);

    setScriptProperty(GROUPS_MAP_KEY, JSON.stringify(duplicateFreeGroupsMap));
}

function loadGroupsFromOnestop(): GroupsMap {
    const cellValues: any[][] = getCellValues(GROUPS_TAB_NAME);
    const groupsMap: GroupsMap = {};

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];
        const groupName: string = rowValues[GROUP_NAME_COLUMN_INDEX];
        const groupMemberNames: string[] = getGroupMemberNames(rowValues);

        if(groupName === "") {
            // Skip empty entries
            continue;
        }

        if(groupsMap.hasOwnProperty(groupName)) {
            Logger.log(`Group ${groupName} has already been defined in the Groups table. Combining the two lists of members`);
            groupsMap[groupName] = groupsMap[groupName].concat(groupMemberNames);
        } else {
            groupsMap[groupName] = groupMemberNames;
        }
    }

    return groupsMap;
}

function getGroupMemberNames(rowValues: any[]): string[] {
    const groupMemberNameList: string = rowValues[GROUP_MEMBER_NAMES_COLUMN_INDEX];
    return groupMemberNameList.split(COMMA_DELIMITER).map((name) => name.trim()).filter((name) => name !== "");
}

function loadSupergroupsFromOnestop(loadedGroups: GroupsMap): GroupsMap {
    const cellValues: any[][] = getCellValues(SUPERGROUPS_TAB_NAME);

    let loadedSupergroups: GroupsMap = {};
    const allSupergroups: SupergroupMap = parseSupergroups(cellValues);

    for(const supergroupName of Object.keys(allSupergroups)) {
        if(!loadedSupergroups.hasOwnProperty(supergroupName)) {
            const { loadedMembers: loadedMembers, loadedSupergroups: newLoadedSupergroups} = loadGroupByName(supergroupName, allSupergroups, loadedGroups, loadedSupergroups);
            loadedSupergroups[supergroupName] = loadedMembers;
            loadedSupergroups = mergeGroupsMaps(loadedSupergroups, newLoadedSupergroups);
        }
    }

    return loadedSupergroups;
}

function parseSupergroups(cellValues: any[][]): SupergroupMap {
    const allSupergroups: SupergroupMap = {};

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];
        const currentSupergroup: Supergroup = constructSupergroup(rowValues);

        if(currentSupergroup.name === "") {
            // Skip empty entries
            continue;
        }

        allSupergroups[currentSupergroup.name] = currentSupergroup;
    }

    return allSupergroups;
}

function loadGroupByName(groupName: string, allSupergroups: SupergroupMap, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): { loadedMembers: string[], loadedSupergroups: GroupsMap } {
    if(!isValidGroup(groupName, allSupergroups, loadedGroups)) {
        return { loadedMembers: [], loadedSupergroups: {} };
    } else if(!isSuperGroup(groupName, allSupergroups)) {
        // Is a regular group
        return { loadedMembers: loadedGroups[groupName], loadedSupergroups: {} };
    } else {
        const supergroup: Supergroup = allSupergroups[groupName];
        const subgroups: string[] = supergroup.subgroups;

        if(allSubgroupsHaveBeenLoaded(supergroup, loadedGroups, loadedSupergroups)) {
            const subgroupMembers: string[] = getAllMembersFromSubgroups(subgroups, loadedGroups, loadedSupergroups);
            return { loadedMembers: subgroupMembers, loadedSupergroups: {} };
        } else {
            const { loadedMembers: loadedMembers, loadedSupergroups: newLoadedSupergroups} = loadAllSubgroups(subgroups, allSupergroups, loadedGroups, loadedSupergroups);
            newLoadedSupergroups[supergroup.name] = loadedMembers;
            return { loadedMembers: loadedMembers, loadedSupergroups: newLoadedSupergroups};
        }
    }
}

function loadAllSubgroups(subgroups: string[], allSupergroups: SupergroupMap, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): { loadedMembers: string[], loadedSupergroups: GroupsMap } {
    let members: string[] = [];
    let newLoadedSupergroups: GroupsMap = {};
    for(const subgroup of subgroups) {
        const { loadedMembers: newMembers, loadedSupergroups: newlyLoadedSupergroups } = loadGroupByName(subgroup, allSupergroups, loadedGroups, loadedSupergroups);
        members = members.concat(newMembers);
        newLoadedSupergroups = mergeGroupsMaps(newLoadedSupergroups, newlyLoadedSupergroups);
    }

    return { loadedMembers: members, loadedSupergroups: newLoadedSupergroups};
}

function isValidGroup(groupName: string, allSupergroups: SupergroupMap, loadedGroups: GroupsMap): boolean {
    return allSupergroups.hasOwnProperty(groupName) || loadedGroups.hasOwnProperty(groupName);
}

function isSuperGroup(groupName: string, allSupergroups: SupergroupMap): boolean {
    return allSupergroups.hasOwnProperty(groupName);
}

function constructSupergroup(rowValues: any[]): Supergroup {
    const supergroupName: string = rowValues[SUPERGROUP_NAME_COLUMN_INDEX];
    const subgroupNames: string[] = getSubgroupNames(rowValues);
    
    return {
        name: supergroupName,
        subgroups: subgroupNames,
    };
}

function getSubgroupNames(rowValues: any[]): string[] {
    const subgroupNameList: string = rowValues[SUBGROUP_COLUMN_INDEX];
    return subgroupNameList.split(COMMA_DELIMITER).map((name) => name.trim()).filter((name) => name !== "");
}

function allSubgroupsHaveBeenLoaded(supergroup: Supergroup, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): boolean {
    const subgroupNames: string[] = supergroup.subgroups;
    for(const subgroupName of subgroupNames) {
        if(!loadedGroups.hasOwnProperty(subgroupName) && !loadedSupergroups.hasOwnProperty(subgroupName)) {
            return false;
        }
    }

    return true;
}

function getAllMembersFromSubgroups(subgroups: string[], loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): string[] {
    let members: string[] = [];

    for(const subgroup of subgroups) {
        if(loadedGroups.hasOwnProperty(subgroup)) {
            members = members.concat(loadedGroups[subgroup]);
        } else if(loadedSupergroups.hasOwnProperty(subgroup)) {
            members = members.concat(loadedSupergroups[subgroup]);
        } 
    }

    return members;
}

function mergeGroupsMaps(firstGroupsMap: GroupsMap, secondGroupsMap: GroupsMap): GroupsMap {
    const finalGroupsMap: GroupsMap = {...firstGroupsMap};

    const groups: string[] = Object.keys(secondGroupsMap);
    for(const group of groups) {
        if(finalGroupsMap.hasOwnProperty(group)) {
            Logger.log(`Warning: Duplicate group ${group} detected`);
            finalGroupsMap[group] = finalGroupsMap[group].concat(secondGroupsMap[group]);
        } else {
            finalGroupsMap[group] = secondGroupsMap[group];
        }
    }

    return finalGroupsMap;
}

function removeDuplicatesFromGroupMaps(groupsMap: GroupsMap): GroupsMap {
    const processedGroupsMap: GroupsMap = {};
    for(const [groupName, groupMembers] of Object.entries(groupsMap)) {
        processedGroupsMap[groupName] = [...new Set(groupMembers)];
    }

    return processedGroupsMap;
}
