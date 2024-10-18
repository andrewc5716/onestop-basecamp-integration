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
 * Gets a list of obsolete roles by comparing the original and current roles
 * 
 * @param currentRoleRequestMap a map associating an event's roles with API request bodies
 * @param lastSavedRoleTodoIdMap a map associating an event's roles to existing todo IDs, that is currently saved in the document properties
 * @returns an array of removed roles
 */
export function getRemovedRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoIdMap: RoleTodoIdMap): string[] {
    const currentRoles: string[] = getCurrentEventRoles(currentRoleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(lastSavedRoleTodoIdMap);
    return originalRoles.filter(role => !currentRoles.includes(role));
}

/**
 * Gets a list of existing roles by comparing the original and current roles
 * 
 * @param currentRoleRequestMap a map associating an event's roles with API request bodies
 * @param lastSavedRoleTodoIdMap a map associating an event's roles to existing todo IDs, that is currently saved in the document properties
 * @returns an array of existing roles
 */
export function getExistingRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoIdMap: RoleTodoIdMap): string[] {
    const currentRoles: string[] = getCurrentEventRoles(currentRoleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(lastSavedRoleTodoIdMap);
    return currentRoles.filter(role => originalRoles.includes(role));
}

/**
 * Gets a list of new roles by comparing the original and current roles
 * 
 * @param currentRoleRequestMap a map associating an event's roles with API request bodies
 * @param lastSavedRoleTodoIdMap a map associating an event's roles to existing todo IDs, that is currently saved in the document properties
 * @returns an array of new roles
 */
export function getNewRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoIdMap: RoleTodoIdMap): string[] {
    const currentRoles: string[] = getCurrentEventRoles(currentRoleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(lastSavedRoleTodoIdMap);
    return currentRoles.filter(role => !originalRoles.includes(role));
}