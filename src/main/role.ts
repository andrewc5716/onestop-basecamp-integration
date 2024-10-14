import { RowBasecampMappingMissingError } from "./error/rowBasecampMappingMissingError";
import { getRowBasecampMapping } from "./row";

export enum RoleStatus {
    OBSOLETE,
    SURVIVING,
    NEW
}

/**
 * Gets the roleTodoIdMap object from the RowBasecampMapping object.
 * Used for downstream processing
 * 
 * @param row a list of all the current roles associated with the row including the lead role. This may be identical to the original roles
 * @returns a map that associates role titles with basecamp todo ids
 */
export function getRoleTodoIdMap(row: Row) {
    const savedRowBasecampMapping: RowBasecampMapping | null = getRowBasecampMapping(row);
    if(savedRowBasecampMapping == null) {
        throw new RowBasecampMappingMissingError("The rowBasecampMapping object is null! Unable to proceed with updating the todo!");
    }
    return savedRowBasecampMapping.roleTodoIdMap
}

/**
 * Gets a list of roles from a roleTodoIdMap
 * 
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 */
export function getOriginalEventRoles(roleTodoIdMap: RoleTodoIdMap): string[] {
    return Object.keys(roleTodoIdMap);
}

/**
 * Gets a list of roles from a roleRequestMap map

 * @param roleRequestMap a map associating role titles with BasecampTodoRequest objects
 */
export function getCurrentEventRoles(currentRoleRequestMap: RoleRequestMap): string[] {
    return Object.keys(currentRoleRequestMap);
}

/**
 * Gets a list of roles (i.e. obsolete, new, surviving) by comparing the original and current roles together
 * 
 * @param roleRequestMap a map associating an event's roles with api request bodies
 * @param currentRoleTodoIdMap a map associating an event's roles to existing todo ids, that is currently saved in the document properties
 * @returns an array of obsolete roles
 */
export function getRoles(roleRequestMap: RoleRequestMap, currentRoleTodoIdMap: RoleTodoIdMap, roleStatus: RoleStatus): string[] {
    const currentRoles: string[] = getCurrentEventRoles(roleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(currentRoleTodoIdMap);

    switch(roleStatus) {
        case RoleStatus.OBSOLETE:
            return originalRoles.filter(role => !currentRoles.includes(role));

        case RoleStatus.SURVIVING:
            return currentRoles.filter(role => originalRoles.includes(role));
        
        case RoleStatus.NEW:
            return currentRoles.filter(role => !originalRoles.includes(role));
    }
}