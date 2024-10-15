export enum RoleStatus {
    REMOVED,
    EXISTING,
    NEW
}

/**
 * Gets a list of roles from a roleTodoIdMap
 * 
 * @param roleTodoIdMap a map associating an event's roles with todo ids
 */
function getOriginalEventRoles(roleTodoIdMap: RoleTodoIdMap): string[] {
    return Object.keys(roleTodoIdMap);
}

/**
 * Gets a list of roles from a roleRequestMap map

 * @param roleRequestMap a map associating role titles with BasecampTodoRequest objects
 */
function getCurrentEventRoles(currentRoleRequestMap: RoleRequestMap): string[] {
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
        case RoleStatus.REMOVED:
            return originalRoles.filter(role => !currentRoles.includes(role));

        case RoleStatus.EXISTING:
            return currentRoles.filter(role => originalRoles.includes(role));
        
        case RoleStatus.NEW:
            return currentRoles.filter(role => !originalRoles.includes(role));
    }
}