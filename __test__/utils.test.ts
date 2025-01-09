import { getRandomlyGeneratedRow, Mock } from "./testUtils";

describe("deleteAllRowMetadata", () => {
    it("should delete all row metadata when called", () => {
        const rowMock1: Row = getRandomlyGeneratedRow();
        const rowMock2: Row = getRandomlyGeneratedRow();

        const metadataRemoveMock1: Mock = jest.fn();
        const metadataRemoveMock2: Mock = jest.fn();

        rowMock1.metadata.remove = metadataRemoveMock1;
        rowMock2.metadata.remove = metadataRemoveMock2;

        const eventRowsMock: Row[] = [rowMock1, rowMock2];

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: jest.fn(() => eventRowsMock),
        }));

        jest.mock("../src/main/propertiesService", () => ({
            deleteAllDocumentProperties: jest.fn(),
        }));

        const { deleteAllRowMetadata } = require("../src/main/utils");

        deleteAllRowMetadata();

        expect(metadataRemoveMock1).toHaveBeenCalledTimes(1);
        expect(metadataRemoveMock2).toHaveBeenCalledTimes(1);
    });
});

describe("deleteAllRowMetadataAndDocumentProperties", () => {
    it("should delete all row metadata and document properties when called", () => {
        const rowMock1: Row = getRandomlyGeneratedRow();
        const rowMock2: Row = getRandomlyGeneratedRow();

        const metadataRemoveMock1: Mock = jest.fn();
        const metadataRemoveMock2: Mock = jest.fn();

        rowMock1.metadata.remove = metadataRemoveMock1;
        rowMock2.metadata.remove = metadataRemoveMock2;

        const eventRowsMock: Row[] = [rowMock1, rowMock2];

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: jest.fn(() => eventRowsMock),
        }));

        const deleteAllDocumentPropertiesMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            deleteAllDocumentProperties: deleteAllDocumentPropertiesMock,
        }));

        const { deleteAllRowMetadataAndDocumentProperties } = require("../src/main/utils");

        deleteAllRowMetadataAndDocumentProperties();

        expect(metadataRemoveMock1).toHaveBeenCalledTimes(1);
        expect(metadataRemoveMock2).toHaveBeenCalledTimes(1);
        expect(deleteAllDocumentPropertiesMock).toHaveBeenCalledTimes(1);
    });
});
