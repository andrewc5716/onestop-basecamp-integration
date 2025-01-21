// Utilities module that provides some helpful functions for developing/debugging Google Apps Script

import { mergeAliasMaps, saveAliasMap } from "./aliases";
import { loadGroupsFromOnestopIntoScriptProperties } from "./groups";
import { loadMembersFromOnestopIntoScriptProperties } from "./members";
import { deleteAllDocumentProperties } from "./propertiesService";
import { getEventRowsFromSpreadsheet } from "./scan";

export function deleteAllRowMetadata(): void {
    const eventRows: Row[] = getEventRowsFromSpreadsheet();
    for(const eventRow of eventRows) {
        eventRow.metadata.remove();
    }
}

export function deleteAllRowMetadataAndDocumentProperties(): void {
    deleteAllRowMetadata();
    deleteAllDocumentProperties();
}

export function loadDataFromOnestopIntoScriptProperties(): void {
    const membersAliasMap: AliasMap = loadMembersFromOnestopIntoScriptProperties();
    const groupAliasMap: AliasMap = loadGroupsFromOnestopIntoScriptProperties();
    const combinedAliasMaps: AliasMap = mergeAliasMaps(membersAliasMap, groupAliasMap);
    saveAliasMap(combinedAliasMaps);
}
