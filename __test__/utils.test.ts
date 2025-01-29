import { getRandomlyGeneratedAliasMap, getRandomlyGeneratedRow, Mock } from "./testUtils";

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
            loadMapFromScriptProperties: jest.fn(() => ({})),
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
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { deleteAllRowMetadataAndDocumentProperties } = require("../src/main/utils");

        deleteAllRowMetadataAndDocumentProperties();

        expect(metadataRemoveMock1).toHaveBeenCalledTimes(1);
        expect(metadataRemoveMock2).toHaveBeenCalledTimes(1);
        expect(deleteAllDocumentPropertiesMock).toHaveBeenCalledTimes(1);
    });
});

describe("loadMembersAndGroupsFromOnestopIntoScriptProperties", () => {
    it("should load members and groups and aliases into script properties when called", () => {
        const membersAliasMapMock: AliasMap = getRandomlyGeneratedAliasMap();
        const groupAliasMapMock: AliasMap = getRandomlyGeneratedAliasMap();
        const combinedAliasMapsMock: AliasMap = {...membersAliasMapMock, ...groupAliasMapMock};

        jest.mock("../src/main/members", () => ({
            loadMembersFromOnestopIntoScriptProperties: jest.fn(() => membersAliasMapMock),
        }));

        jest.mock("../src/main/groups", () => ({
            loadGroupsFromOnestopIntoScriptProperties: jest.fn(() => groupAliasMapMock),
        }));

        const mergeAliasMapsMock: Mock = jest.fn(() => combinedAliasMapsMock);
        const saveAliasMapMock: Mock = jest.fn();
        jest.mock("../src/main/aliases", () => ({
            mergeAliasMaps: mergeAliasMapsMock,
            saveAliasMap: saveAliasMapMock,
        }));

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { loadMembersAndGroupsFromOnestopIntoScriptProperties } = require("../src/main/utils");
        loadMembersAndGroupsFromOnestopIntoScriptProperties();

        expect(mergeAliasMapsMock).toHaveBeenCalledWith(membersAliasMapMock, groupAliasMapMock);
        expect(saveAliasMapMock).toHaveBeenCalledWith(combinedAliasMapsMock);
    });
});
