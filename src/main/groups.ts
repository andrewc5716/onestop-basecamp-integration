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

    Logger.log(JSON.stringify(duplicateFreeGroupsMap));
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

        groupsMap[groupName] = groupMemberNames;
    }

    return groupsMap;
}

function getGroupMemberNames(rowValues: any[]): string[] {
    const groupMemberNameList: string = rowValues[GROUP_MEMBER_NAMES_COLUMN_INDEX];
    return groupMemberNameList.split(COMMA_DELIMITER).map((name) => name.trim()).filter((name) => name !== "");
}

function loadSupergroupsFromOnestop(loadedGroups: GroupsMap): GroupsMap {
    const cellValues: any[][] = getCellValues(SUPERGROUPS_TAB_NAME);

    const { loadedSupergroups: loadedSupergroups, missingDependentSubgroups: missingDependentSubgroups } = parseAndLoadSupergroups(cellValues, loadedGroups);

    if(missingDependentSubgroups.length === cellValues.length - 1) {
        Logger.log("Warning: None of the supergroups were loaded");

        return loadedSupergroups;
    }

    const { loadedSupergroups: reprocessedSupergroups, unableToLoad: unableToLoad } = reprocessSupergroups(missingDependentSubgroups, loadedGroups, loadedSupergroups);

    if(unableToLoad.length > 0) {
        Logger.log(`Warning: Unable to load the following ${unableToLoad.length} Supergroups because all of their dependent subgroups have not been loaded ${unableToLoad.map((supergroup) => `${supergroup.name}: ${supergroup.subgroups}`)}`);
    }

    const allLoadedSupergroups: GroupsMap = mergeGroupsMaps(loadedSupergroups, reprocessedSupergroups);

    return allLoadedSupergroups;
}

function parseAndLoadSupergroups(cellValues: any[][], loadedGroups: GroupsMap, ): { loadedSupergroups: GroupsMap, missingDependentSubgroups: Supergroup[] } {
    const loadedSupergroups: GroupsMap = {};
    const missingDependentSubgroups: Supergroup[] = [];

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];
        const supergroup: Supergroup = constructSupergroup(rowValues);

        if(supergroup.name === "") {
            // Skip empty entries
            continue;
        }

        if(allSubgroupsHaveBeenLoaded(supergroup, loadedGroups, loadedSupergroups)) {
            // Load all member names of the Supergroup
            loadedSupergroups[supergroup.name] = loadGroupMemberNames(supergroup, loadedGroups, loadedSupergroups);
        } else {
            // Add to the reprocess queued to be reprocessed once its' dependencies have been loaded
            missingDependentSubgroups.push(supergroup);
        }
    }

    return { loadedSupergroups: loadedSupergroups, missingDependentSubgroups: missingDependentSubgroups };
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
    return subgroupNameList.split(COMMA_DELIMITER).map((name) => name.trim());
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

function loadGroupMemberNames(supergroup: Supergroup, loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): string[] {
    let groupMembers: string[] = [];
    const subgroups: string[] = supergroup.subgroups;
    for(const subgroup of subgroups) {
        if(loadedGroups.hasOwnProperty(subgroup)) {
            groupMembers = groupMembers.concat(loadedGroups[subgroup]);
        } else if(loadedSupergroups.hasOwnProperty(subgroup)) {
            groupMembers = groupMembers.concat(loadedSupergroups[subgroup]);
        } else {
            Logger.log(`Cannot find group members for Supergroup ${supergroup.name} and subgroup ${subgroup}`);
        }
    }

    return groupMembers;
}

function reprocessSupergroups(missingDependentSubgroups: Supergroup[], loadedGroups: GroupsMap, loadedSupergroups: GroupsMap): { loadedSupergroups: GroupsMap, unableToLoad: Supergroup[] } {
    let reprocessQueue: Supergroup[] = missingDependentSubgroups;
    let reprocessQueueStartLength: number;
    let allReprocessedSupergroups: GroupsMap = {};
    let allLoadedSupergroups: GroupsMap = {...loadedSupergroups};

    do {
        reprocessQueueStartLength = reprocessQueue.length;

        const { reprocessedSupergroups: reprocessedSupergroups, needsToBeReprocessed: needToBeReprocessed } = handleReprocessQueue(reprocessQueue, allLoadedSupergroups, allReprocessedSupergroups, loadedGroups);
        allReprocessedSupergroups = {...allReprocessedSupergroups, ...reprocessedSupergroups};
        
        reprocessQueue = needToBeReprocessed;

    } while(reprocessQueue.length > 0 && reprocessQueue.length < reprocessQueueStartLength);

    return { loadedSupergroups: allReprocessedSupergroups, unableToLoad: reprocessQueue };
}

function handleReprocessQueue(reprocessQueue: Supergroup[], previouslyLoadedSupergroups: GroupsMap, previouslyReprocessedSupergroups: GroupsMap, loadedGroups: GroupsMap): { reprocessedSupergroups: GroupsMap, needsToBeReprocessed: Supergroup[] }  {
    const loadedSupergroups: GroupsMap = {...previouslyLoadedSupergroups, ...previouslyReprocessedSupergroups};
    const reprocessedSupergroups: GroupsMap = {};
        
    const needToBeReprocessed: Supergroup[] = [];
    // Go through reprocess queue
    for(let i = 0; i < reprocessQueue.length; i++) {
        const currentSupergroup: Supergroup = reprocessQueue[i];
        if(allSubgroupsHaveBeenLoaded(currentSupergroup, loadedGroups, loadedSupergroups)) {
            reprocessedSupergroups[currentSupergroup.name] = loadGroupMemberNames(currentSupergroup, loadedGroups, loadedSupergroups);
        } else {
            needToBeReprocessed.push(currentSupergroup);
        }
    }

    return { reprocessedSupergroups: reprocessedSupergroups, needsToBeReprocessed: needToBeReprocessed };
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
