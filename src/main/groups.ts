import { mergeAliasMaps } from "./aliases";
import { loadMapFromScriptProperties, setScriptProperty } from "./propertiesService";
import { getCellValues } from "./scan";

const COMMA_DELIMITER: string = ",";
const GROUPS_TAB_NAME: string = "Groups";
const SUPERGROUPS_TAB_NAME: string = "Supergroups";
const GROUP_NAME_COLUMN_INDEX: number = 0;
const GROUP_MEMBER_NAMES_COLUMN_INDEX: number = 1;
const GROUP_ALIASES_COLUMN_INDEX: number = 2;
const SUPERGROUP_NAME_COLUMN_INDEX: number = 0;
const SUBGROUP_COLUMN_INDEX: number = 1;
const SUPERGROUP_ALIASES_COLUMN_INDEX: number = 2;
const GROUPS_MAP_KEY: string = "GROUPS_MAP";

// Interface declared here because this is an internal object used only during the Supergroup loading process
declare interface Supergroup {
    name: string,
    subgroups: string[],
    aliases: string[],
};

// Maps a Supergroup name to its corresponding Supergroup object
// Only used internally within this module for loading
type SupergroupMap = { [supergroupName: string]: Supergroup };

export const GROUPS_MAP: GroupsMap = loadMapFromScriptProperties(GROUPS_MAP_KEY) as GroupsMap;


/**
 * A list of all the group names from GROUPS_MAP
 */
export const GROUP_NAMES: string[] = Object.keys(GROUPS_MAP) as string[];

/**
 * Loads groups and supergroups from the Onestop into script properties
 */
export function loadGroupsFromOnestopIntoScriptProperties(): AliasMap {
    const { groupsMap: groupsMap, groupsAliasMap: groupsAliasMap } = loadGroupsFromOnestop();
    const { supergroupsMap: supergroupsMap, supergroupsAliasMap: supergroupsAliasMap } = loadSupergroupsFromOnestop(groupsMap);
    const combinedGroupsMaps: GroupsMap = mergeGroupsMaps(groupsMap, supergroupsMap);
    const duplicateFreeGroupsMap: GroupsMap = removeDuplicatesFromGroupMaps(combinedGroupsMaps);
    const combinedAliasMaps: AliasMap = mergeAliasMaps(groupsAliasMap, supergroupsAliasMap);

    setScriptProperty(GROUPS_MAP_KEY, JSON.stringify(duplicateFreeGroupsMap));

    return combinedAliasMaps;
}

/**
 * Retrieves an array of normalized member names from an array of group names.
 * 
 * @param groupNames an array of group names (i.e. ministry names, domain names)
 * @returns array of member names
 */
export function getMembersFromGroups(groupNames: string[]): string[] {
    const dedupedGroupNames = Array.from(new Set(groupNames));
    return dedupedGroupNames.flatMap(groupName => GROUPS_MAP[groupName] || []);
}

function loadGroupsFromOnestop(): { groupsMap: GroupsMap, groupsAliasMap: AliasMap } {
    const cellValues: any[][] = getCellValues(GROUPS_TAB_NAME);
    const groupsMap: GroupsMap = {};
    let groupsAliasMap: AliasMap = {};

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];
        const groupName: string = rowValues[GROUP_NAME_COLUMN_INDEX];
        const groupMemberNames: string[] = getGroupMemberNames(rowValues);
        const groupAliases: string[] = getGroupAliases(rowValues);

        if(groupName === "") {
            // Skip empty entries
            continue;
        }

        if(groupsMap.hasOwnProperty(groupName)) {
            Logger.log(`WARN: Group ${groupName} has already been defined in the Groups table. Combining the two lists of members`);
            groupsMap[groupName] = groupsMap[groupName].concat(groupMemberNames);
        } else {
            groupsMap[groupName] = groupMemberNames;
        }

        groupsAliasMap = addGroupAliasesToMap(groupsAliasMap, groupAliases, groupMemberNames);
    }

    return { groupsMap: groupsMap, groupsAliasMap: groupsAliasMap };
}

function getGroupMemberNames(rowValues: any[]): string[] {
    const groupMemberNameList: string = rowValues[GROUP_MEMBER_NAMES_COLUMN_INDEX];
    return groupMemberNameList.split(COMMA_DELIMITER).map((name) => name.trim()).filter((name) => name !== "");
}

function getGroupAliases(rowValues: any[]): string[] {
    const groupAliasesList: string = rowValues[GROUP_ALIASES_COLUMN_INDEX];
    return groupAliasesList.split(COMMA_DELIMITER).map((alias) => alias.trim()).filter((alias) => alias !== "");
}

function addGroupAliasesToMap(groupsAliasMap: AliasMap, groupAliases: string[], groupMemberNames: string[]): AliasMap {
    const newGroupsAliasMap: AliasMap = { ...groupsAliasMap };

    for(const alias of groupAliases) {
        if(groupsAliasMap.hasOwnProperty(alias)) {
            Logger.log(`Warning: Duplicate alias ${alias} detected`);
            newGroupsAliasMap[alias] = newGroupsAliasMap[alias].concat(groupMemberNames);
        } else {
            newGroupsAliasMap[alias] = [...groupMemberNames];
        }
    }

    return newGroupsAliasMap;
}

function loadSupergroupsFromOnestop(loadedGroups: GroupsMap): { supergroupsMap: GroupsMap, supergroupsAliasMap: AliasMap } {
    const cellValues: any[][] = getCellValues(SUPERGROUPS_TAB_NAME);

    let loadedSupergroups: GroupsMap = {};
    let loadedSupergroupsAliases: AliasMap = {};
    const allSupergroups: SupergroupMap = parseSupergroups(cellValues);
    let supergroupStack: string[] = Object.keys(allSupergroups);

    // Loads alls Supergroups and their dependencies using DFS
    while(supergroupStack.length > 0) {
        const currentSupergroupName: string = supergroupStack.pop()!;
        const currentSupergroup: Supergroup = allSupergroups[currentSupergroupName];

        // Skips already loaded Supergroups
        if(loadedSupergroups.hasOwnProperty(currentSupergroupName)) {
            continue;
        }

        if(allSubgroupsHaveBeenLoaded(currentSupergroup, loadedGroups, loadedSupergroups, allSupergroups)) {
            // Loads a Supergroup if all its dependent subgroups have already been loaded
            const subgroupMembers: string[] = getAllMembersFromSubgroups(currentSupergroup.subgroups, loadedGroups, loadedSupergroups);
            loadedSupergroups[currentSupergroup.name] = subgroupMembers;
            loadedSupergroupsAliases = addGroupAliasesToMap(loadedSupergroupsAliases, currentSupergroup.aliases, subgroupMembers);
        } else {
            const toPushToStack: string[] = processSupergroup(currentSupergroup, allSupergroups, loadedGroups, loadedSupergroups);
            supergroupStack = supergroupStack.concat(toPushToStack);
        }
    }

    return { supergroupsMap: loadedSupergroups, supergroupsAliasMap: loadedSupergroupsAliases };
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

function isValidGroup(groupName: string, allSupergroups: SupergroupMap, loadedGroups: GroupsMap): boolean {
    return allSupergroups.hasOwnProperty(groupName) || loadedGroups.hasOwnProperty(groupName);
}

function isSuperGroup(groupName: string, allSupergroups: SupergroupMap): boolean {
    return allSupergroups.hasOwnProperty(groupName);
}

function constructSupergroup(rowValues: any[]): Supergroup {
    const supergroupName: string = rowValues[SUPERGROUP_NAME_COLUMN_INDEX];
    const subgroupNames: string[] = getSubgroupNames(rowValues);
    const supergroupAliases: string[] = getSupergroupGroupAliases(rowValues);
    
    return {
        name: supergroupName,
        subgroups: subgroupNames,
        aliases: supergroupAliases,
    };
}

function getSubgroupNames(rowValues: any[]): string[] {
    const subgroupNameList: string = rowValues[SUBGROUP_COLUMN_INDEX];
    return subgroupNameList.split(COMMA_DELIMITER).map((name) => name.trim()).filter((name) => name !== "");
}

function getSupergroupGroupAliases(rowValues: any[]): string[] {
    const supergroupAliasesList: string = rowValues[SUPERGROUP_ALIASES_COLUMN_INDEX];
    return supergroupAliasesList.split(COMMA_DELIMITER).map((alias) => alias.trim()).filter((alias) => alias !== "");
}

function allSubgroupsHaveBeenLoaded(supergroup: Supergroup, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap, allSupergroups: SupergroupMap): boolean {
    const subgroupNames: string[] = supergroup.subgroups;
    for(const subgroupName of subgroupNames) {
        // Checks if the current subgroup is valid and has not been loaded
        if(isValidGroup(subgroupName, allSupergroups, loadedGroups) && !loadedGroups.hasOwnProperty(subgroupName) && !loadedSupergroups.hasOwnProperty(subgroupName)) {
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

function processSupergroup(supergroup: Supergroup, allSupergroups: SupergroupMap, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): string[] {
    const supergroupStack: string[] = [];
    const currentSupergroupName: string = supergroup.name;

    // Push the current Supergoup as it needs to be reprocessed after all of its dependencies have been loaded
    supergroupStack.push(currentSupergroupName);

    // Push all dependencis that are Supergroups to the stack
    const subgroups: string[] = supergroup.subgroups;
    for(const subgroup of subgroups) {
        if(!isValidGroup(subgroup, allSupergroups, loadedGroups)) {
            // Skip invalid groups
            continue;
        } else if(isSuperGroup(subgroup, allSupergroups) && !loadedSupergroups.hasOwnProperty(currentSupergroupName)) {
            // Add subgroups that are Supergroups that have not yet been loaded
            supergroupStack.push(subgroup);
        }
    }

    return supergroupStack;
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
