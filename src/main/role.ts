/**
 * Gets a list of roles from a roleTodoMap
 * 
 * @param roleTodoMap a map associating an event's roles with todo objects
 */
function getOriginalEventRoles(roleTodoMap: RoleTodoMap): string[] {
    return Object.keys(roleTodoMap);
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
 * @param lastSavedRoleTodoMap a map associating an event's roles to existing todo objects, that is currently saved in the document properties
 * @returns an array of removed roles
 */
export function getRemovedRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoMap: RoleTodoMap): string[] {
    const currentRoles: string[] = getCurrentEventRoles(currentRoleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(lastSavedRoleTodoMap);
    return originalRoles.filter(role => !currentRoles.includes(role));
}

/**
 * Gets a list of existing roles by comparing the original and current roles
 * 
 * @param currentRoleRequestMap a map associating an event's roles with API request bodies
 * @param lastSavedRoleTodoMap a map associating an event's roles to existing todo objects, that is currently saved in the document properties
 * @returns an array of existing roles
 */
export function getExistingRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoMap: RoleTodoMap): string[] {
    const currentRoles: string[] = getCurrentEventRoles(currentRoleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(lastSavedRoleTodoMap);
    return currentRoles.filter(role => originalRoles.includes(role));
}

/**
 * Gets a list of new roles by comparing the original and current roles
 * 
 * @param currentRoleRequestMap a map associating an event's roles with API request bodies
 * @param lastSavedRoleTodoMap a map associating an event's roles to existing todo objects, that is currently saved in the document properties
 * @returns an array of new roles
 */
export function getNewRoles(currentRoleRequestMap: RoleRequestMap, lastSavedRoleTodoMap: RoleTodoMap): string[] {
    const currentRoles: string[] = getCurrentEventRoles(currentRoleRequestMap);
    const originalRoles: string[] = getOriginalEventRoles(lastSavedRoleTodoMap);
    return currentRoles.filter(role => !originalRoles.includes(role));
}