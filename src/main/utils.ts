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
