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

type SupergroupMap = { [key: string]: Supergroup };

function loadSupergroupsFromOnestop(loadedGroups: GroupsMap): GroupsMap {
    const cellValues: any[][] = getCellValues(SUPERGROUPS_TAB_NAME);

    const allSupergroups: SupergroupMap = {};
    const loadedSupergroups: GroupsMap = {};

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

    for(const supergroupName of Object.keys(allSupergroups)) {
        if(!loadedSupergroups.hasOwnProperty(supergroupName)) {
            const loadedMembers: string[] = loadGroupByName(supergroupName, allSupergroups, loadedGroups, loadedSupergroups);
            loadedSupergroups[supergroupName] = loadedMembers;
        }
    }

    return loadedSupergroups;
}

function loadGroupByName(groupName: string, allSupergroups: SupergroupMap, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): string[] {
    if(!isValidGroup(groupName, allSupergroups, loadedGroups)) {
        return [];
    } else if(!isSuperGroup(groupName, allSupergroups)) {
        // Is a regular group
        return loadedGroups[groupName];
    } else {
        const supergroup: Supergroup = allSupergroups[groupName];
        const subgroups: string[] = supergroup.subgroups;
        if(allSubgroupsHaveBeenLoaded(supergroup, loadedGroups, loadedSupergroups)) {
            let members: string[] = [];
            for(const subgroup of subgroups) {
                const membersToLoad: string[] = loadedGroups.hasOwnProperty(subgroup) ? loadedGroups[subgroup] : loadedSupergroups[subgroup];
                members = members.concat(membersToLoad);
            }
            loadedSupergroups[groupName] = members;
            return members;
        } else {
            let members: string[] = [];
            for(const subgroup of subgroups) {
                members = members.concat(loadGroupByName(subgroup, allSupergroups, loadedGroups, loadedSupergroups));
            }
            loadedSupergroups[groupName] = members;
            return members;
        }
    }
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
