// Mock PropertiesService must be imported and set before the row module is imported
// and attempts to access the global PropertiesService object
import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;

import { generateIdForRow, getId, getMetadata, hasId } from "../src/main/row";
import { RowMissingIdError } from '../src/main/error/rowMissingIdError';
import { getRandomlyGeneratedMetadata, getRandomlyGeneratedRange, getRandomlyGeneratedRow, Mock } from './testUtils';

describe("getMetadata", () => {
    it("should return the Metadata object when a single Metadata object is present", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const rangeMock: Range = getRandomlyGeneratedRange();
        rangeMock.getDeveloperMetadata = jest.fn(() => [metadataMock]);

        const retrievedMetadata: Metadata = getMetadata(rangeMock);

        expect(retrievedMetadata).toBe(metadataMock);
    });

    it("should return the first Metadata object when multiple Metadata objects are present", () => {
        const firstMetadataMock: Metadata = getRandomlyGeneratedMetadata();
        const secondMetadataMock: Metadata = getRandomlyGeneratedMetadata();
        const thirdMetadataMock: Metadata = getRandomlyGeneratedMetadata();
        const rangeMock: Range = getRandomlyGeneratedRange();
        rangeMock.getDeveloperMetadata = jest.fn(() => [firstMetadataMock, secondMetadataMock, thirdMetadataMock]);

        const retrievedMetadata: Metadata = getMetadata(rangeMock);

        expect(retrievedMetadata).toBe(firstMetadataMock);
    });

    it("should generate and return a Metadata object when Metadata is not present", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const rangeMock: Range = getRandomlyGeneratedRange();
        const addDeveloperMetadataMock: Mock = jest.fn();
        rangeMock.addDeveloperMetadata = addDeveloperMetadataMock;
        // First call should not return a Metadata object and the second one should
        rangeMock.getDeveloperMetadata = jest.fn()
            .mockImplementationOnce(() => [])
            .mockImplementationOnce(() => [metadataMock]);

        const retrievedMetadata: Metadata = getMetadata(rangeMock);

        // Assert Metadata object was generaged with addDeveloperMetadata and that it was returned
        expect(addDeveloperMetadataMock).toHaveBeenCalledWith("rowId");
        expect(retrievedMetadata).toBe(metadataMock);
    });
});

describe("getId", () => {
    it("should return id when id is present", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => "0419f086-4f19-4ade-ac64-2edafefef23d");
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        const retrievedId: string = getId(row);

        expect(retrievedId).toBe("0419f086-4f19-4ade-ac64-2edafefef23d");
    });

    it("should throw RowMissingIdError when id is null", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => null);
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        expect(() => getId(row)).toThrow(RowMissingIdError);
    });

  it("should throw RowMissingIdError when id is empty", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => "");
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        expect(() => getId(row)).toThrow(RowMissingIdError);
    });
});

describe("generateIdForRow", () => {
    it("should generate and assign a new UUID for the row when called", () => {
        const newUUID: string = "aeb39e2f-04f6-42ca-b87b-514f4371b708";
        const getUuidMock: Mock = jest.fn(() => newUUID);
        // Overide the global Google Apps Script Utilities object
        global.Utilities = {getUuid: getUuidMock}
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const setValueMock: Mock = jest.fn();
        metadataMock.setValue = setValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        generateIdForRow(row);

        expect(getUuidMock).toHaveBeenCalledTimes(1);
        expect(setValueMock).toHaveBeenCalledWith(newUUID);
    });
});

describe("hasId", () => {
    it("should return true when the row has already been assigned an id", () => {
        const uuid: string = "51ab21eb-0e29-4173-8f37-b3e1f9d65c71";
        const getValueMock = jest.fn(() => uuid);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowHasId: boolean = hasId(row);

        expect(getValueMock).toHaveBeenCalledTimes(1);
        expect(rowHasId).toBe(true);
    });

    it("should return false when the metadata value is null", () => {
        const getValueMock = jest.fn(() => null);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowHasId: boolean = hasId(row);

        expect(getValueMock).toHaveBeenCalledTimes(1);
        expect(rowHasId).toBe(false);
    });
    
    it("should return false when the metadata value is string", () => {
        const getValueMock = jest.fn(() => "");
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowHasId: boolean = hasId(row);

        expect(getValueMock).toHaveBeenCalledTimes(1);
        expect(rowHasId).toBe(false);
    })
});

describe("saveRow", () => {

});

describe("hasBeenSaved", () => {

});

describe("hasChanged", () => {

});

describe("getRowBasecampMapping", () => {

});

describe("toString", () => {

});

describe("getBasecampTodoRequestsForRow", () => {

});

describe("getBasecampTodosForLeads", () => {

});

describe("getBasecampTodosForHelpers", () => {

});

describe("clearAllRowMetadata", () => {

});

describe("getRoleTodoIdMap", () => {

});
