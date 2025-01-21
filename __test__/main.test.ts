import { Logger } from 'gasmask';
global.Logger = Logger;

import randomstring from "randomstring";
import { getRandomlyGeneratedRoleRequestMap, getRandomlyGeneratedRoleTodoIdMap, getRandomlyGeneratedRow, getRandomlyGeneratedRowBasecampMapping, getRandomlyGeneratedScheduleEntry, getRandomlyGeneratedScheduleEntryIdentifier, getRandomlyGeneratedScheduleIdentifier, Mock } from "./testUtils";

describe("importOnestopToBasecamp", () => {
    it("should create new Todos and Schedule Entries when a row is new", () => {
        const rowMock1: Row = getRandomlyGeneratedRow();
        const roleRequestMapMock1: RoleRequestMap = getRandomlyGeneratedRoleRequestMap();
        const roleTodoIdMapMock1: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const scheduleEntryRequestMock1: BasecampScheduleEntryRequest = getRandomlyGeneratedScheduleEntry();
        const scheduleEntryIdMock1: string = randomstring.generate();
        const rowIdMock1: string = randomstring.generate();
        const rowMock2: Row = getRandomlyGeneratedRow();
        const roleRequestMapMock2: RoleRequestMap = getRandomlyGeneratedRoleRequestMap();
        const roleTodoIdMapMock2: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const scheduleEntryRequestMock2: BasecampScheduleEntryRequest = getRandomlyGeneratedScheduleEntry();
        const scheduleEntryIdMock2: string = randomstring.generate();
        const rowIdMock2: string = randomstring.generate();
        const documentPropertiesMock: DocumentProperties = {
            [rowIdMock1]: getRandomlyGeneratedRowBasecampMapping(),
            [rowIdMock2]: getRandomlyGeneratedRowBasecampMapping(),
        };
        const scheduleIdentifierMock: ScheduleIdentifier = getRandomlyGeneratedScheduleIdentifier();

        const getEventRowsFromSpreadsheetMock: Mock = jest.fn(() => [rowMock1, rowMock2]);

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: getEventRowsFromSpreadsheetMock,
        }));

        const hasIdMock: Mock = jest.fn()
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);
        const getBasecampTodoRequestsForRowMock: Mock = jest.fn()
            .mockReturnValueOnce(roleRequestMapMock1)
            .mockReturnValueOnce(roleRequestMapMock2);
        const getScheduleEntryRequestForRowMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryRequestMock1)
            .mockReturnValueOnce(scheduleEntryRequestMock2);
        const generateIdForRowMock: Mock = jest.fn();
        const saveRowMock: Mock = jest.fn();
        const getIdMock: Mock = jest.fn()
            .mockReturnValueOnce(rowIdMock1)
            .mockReturnValueOnce(rowIdMock2);

        jest.mock("../src/main/row", () => ({
            hasId: hasIdMock,
            getBasecampTodoRequestsForRow: getBasecampTodoRequestsForRowMock,
            getScheduleEntryRequestForRow: getScheduleEntryRequestForRowMock,
            generateIdForRow: generateIdForRowMock,
            saveRow: saveRowMock,
            getId: getIdMock,
        }));

        const createNewTodosMock: Mock = jest.fn()
            .mockReturnValueOnce(roleTodoIdMapMock1)
            .mockReturnValueOnce(roleTodoIdMapMock2);

        jest.mock("../src/main/todos", () => ({
            createNewTodos: createNewTodosMock,
        }));

        const createScheduleEntryMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdMock1)
            .mockReturnValueOnce(scheduleEntryIdMock2);
        const getDefaultScheduleIdentifierMock: Mock = jest.fn(() => scheduleIdentifierMock);

        jest.mock("../src/main/schedule", () => ({
            createScheduleEntry: createScheduleEntryMock,
            getDefaultScheduleIdentifier: getDefaultScheduleIdentifierMock,
        }));

        const getAllDocumentPropertiesMock: Mock = jest.fn(() => documentPropertiesMock);

        jest.mock("../src/main/propertiesService", () => ({
            getAllDocumentProperties: getAllDocumentPropertiesMock,
        }));

        const { importOnestopToBasecamp } = require("../src/main/main");
        importOnestopToBasecamp();

        expect(getEventRowsFromSpreadsheetMock).toHaveBeenCalledTimes(1);

        // Asserts for new first row
        expect(createNewTodosMock).toHaveBeenNthCalledWith(1, roleRequestMapMock1);
        expect(createScheduleEntryMock).toHaveBeenNthCalledWith(1, scheduleEntryRequestMock1, scheduleIdentifierMock);
        expect(generateIdForRowMock).toHaveBeenNthCalledWith(1, rowMock1);
        expect(saveRowMock).toHaveBeenNthCalledWith(1, rowMock1, roleTodoIdMapMock1, scheduleEntryIdMock1);
    
        // Asserts for new second row
        expect(createNewTodosMock).toHaveBeenNthCalledWith(2, roleRequestMapMock2);
        expect(createScheduleEntryMock).toHaveBeenNthCalledWith(2, scheduleEntryRequestMock2, scheduleIdentifierMock);
        expect(generateIdForRowMock).toHaveBeenNthCalledWith(2, rowMock2);
        expect(saveRowMock).toHaveBeenNthCalledWith(2, rowMock2, roleTodoIdMapMock2, scheduleEntryIdMock2);
    });

    it("should skip existing rows when the row has not changed", () => {
        const rowMock1: Row = getRandomlyGeneratedRow();
        const scheduleEntryIdMock1: string = randomstring.generate();
        const rowIdMock1: string = randomstring.generate();
        const rowMock2: Row = getRandomlyGeneratedRow();
        const scheduleEntryIdMock2: string = randomstring.generate();
        const rowIdMock2: string = randomstring.generate();
        const documentPropertiesMock: DocumentProperties = {
            [rowIdMock1]: getRandomlyGeneratedRowBasecampMapping(),
            [rowIdMock2]: getRandomlyGeneratedRowBasecampMapping(),
        };

        const getEventRowsFromSpreadsheetMock: Mock = jest.fn(() => [rowMock1, rowMock2]);

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: getEventRowsFromSpreadsheetMock,
        }));

        const hasIdMock: Mock = jest.fn()
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);
        const hasChangedMock: Mock = jest.fn(() => false);
        const getIdMock: Mock = jest.fn()
            .mockReturnValueOnce(rowIdMock1)
            .mockReturnValueOnce(rowIdMock2);

        jest.mock("../src/main/row", () => ({
            hasId: hasIdMock,
            hasChanged: hasChangedMock,
            getId: getIdMock,
        }));

        const deleteObsoleteTodosMock: Mock = jest.fn();
        const createTodosForNewRolesMock: Mock = jest.fn();
        const updateTodosForExistingRolesMock: Mock = jest.fn();

        jest.mock("../src/main/todos", () => ({
            deleteObsoleteTodos: deleteObsoleteTodosMock,
            createTodosForNewRoles: createTodosForNewRolesMock,
            updateTodosForExistingRoles: updateTodosForExistingRolesMock,
        }));

        const createScheduleEntryMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdMock1)
            .mockReturnValueOnce(scheduleEntryIdMock2);
        const updateScheduleEntryMock: Mock = jest.fn();

        jest.mock("../src/main/schedule", () => ({
            updateScheduleEntry: updateScheduleEntryMock,
        }));

        const getAllDocumentPropertiesMock: Mock = jest.fn(() => documentPropertiesMock);

        jest.mock("../src/main/propertiesService", () => ({
            getAllDocumentProperties: getAllDocumentPropertiesMock,
        }));

        const { importOnestopToBasecamp } = require("../src/main/main");
        importOnestopToBasecamp();

        expect(getEventRowsFromSpreadsheetMock).toHaveBeenCalledTimes(1);

        // Asserts for non-changed first row
        expect(hasChangedMock).toHaveBeenNthCalledWith(1, rowMock1);
    
        // Asserts for non-changed second row
        expect(hasChangedMock).toHaveBeenNthCalledWith(2, rowMock2);

        // Asserts for existing row
        expect(deleteObsoleteTodosMock).toHaveBeenCalledTimes(0);
        expect(createTodosForNewRolesMock).toHaveBeenCalledTimes(0);
        expect(updateTodosForExistingRolesMock).toHaveBeenCalledTimes(0);
        expect(updateScheduleEntryMock).toHaveBeenCalledTimes(0);
    });

    it("should update existing Todos and Schedule Entries when a row is not new", () => {
        const rowMock1: Row = getRandomlyGeneratedRow();
        const roleRequestMapMock1: RoleRequestMap = getRandomlyGeneratedRoleRequestMap();
        const scheduleEntryRequestMock1: BasecampScheduleEntryRequest = getRandomlyGeneratedScheduleEntry();
        const scheduleEntryIdMock1: string = randomstring.generate();
        const scheduleEntryIdentifierMock1: ScheduleEntryIdentifier = getRandomlyGeneratedScheduleEntryIdentifier();
        const rowIdMock1: string = randomstring.generate();
        const rowMock2: Row = getRandomlyGeneratedRow();
        const lastSavedRoleTodoIdMapMock1: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const newRoleTodoIdMapMock1: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const existingRoleTodoIdMapMock1: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const updatedRoleTodoIdMapMock1: RoleTodoIdMap = {...existingRoleTodoIdMapMock1, ...newRoleTodoIdMapMock1};
        const roleRequestMapMock2: RoleRequestMap = getRandomlyGeneratedRoleRequestMap();
        const scheduleEntryRequestMock2: BasecampScheduleEntryRequest = getRandomlyGeneratedScheduleEntry();
        const scheduleEntryIdMock2: string = randomstring.generate();
        const scheduleEntryIdentifierMock2: ScheduleEntryIdentifier = getRandomlyGeneratedScheduleEntryIdentifier();
        const rowIdMock2: string = randomstring.generate();
        const lastSavedRoleTodoIdMapMock2: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const newRoleTodoIdMapMock2: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const existingRoleTodoIdMapMock2: RoleTodoIdMap = getRandomlyGeneratedRoleTodoIdMap();
        const updatedRoleTodoIdMapMock2: RoleTodoIdMap = {...existingRoleTodoIdMapMock2, ...newRoleTodoIdMapMock2};
        const documentPropertiesMock: DocumentProperties = {
            [rowIdMock1]: getRandomlyGeneratedRowBasecampMapping(),
            [rowIdMock2]: getRandomlyGeneratedRowBasecampMapping(),
        };

        const getEventRowsFromSpreadsheetMock: Mock = jest.fn(() => [rowMock1, rowMock2]);

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: getEventRowsFromSpreadsheetMock,
        }));

        const hasIdMock: Mock = jest.fn()
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);
        const hasChangedMock: Mock = jest.fn(() => true);
        const getBasecampTodoRequestsForRowMock: Mock = jest.fn()
            .mockReturnValueOnce(roleRequestMapMock1)
            .mockReturnValueOnce(roleRequestMapMock2);
        const getScheduleEntryRequestForRowMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryRequestMock1)
            .mockReturnValueOnce(scheduleEntryRequestMock2);
        const generateIdForRowMock: Mock = jest.fn();
        const saveRowMock: Mock = jest.fn();
        const getIdMock: Mock = jest.fn()
            .mockReturnValueOnce(rowIdMock1)
            .mockReturnValueOnce(rowIdMock2);
        const getRoleTodoIdMapMock: Mock = jest.fn()
            .mockReturnValueOnce(lastSavedRoleTodoIdMapMock1)
            .mockReturnValueOnce(lastSavedRoleTodoIdMapMock2);
        const getSavedScheduleEntryIdMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdMock1)
            .mockReturnValueOnce(scheduleEntryIdMock2);

        jest.mock("../src/main/row", () => ({
            hasId: hasIdMock,
            hasChanged: hasChangedMock,
            getBasecampTodoRequestsForRow: getBasecampTodoRequestsForRowMock,
            getScheduleEntryRequestForRow: getScheduleEntryRequestForRowMock,
            saveRow: saveRowMock,
            getId: getIdMock,
            getRoleTodoIdMap: getRoleTodoIdMapMock,
            getSavedScheduleEntryId: getSavedScheduleEntryIdMock,
        }));

        const deleteObsoleteTodosMock: Mock = jest.fn();
        const createTodosForNewRolesMock: Mock = jest.fn()
            .mockReturnValueOnce(newRoleTodoIdMapMock1)
            .mockReturnValueOnce(newRoleTodoIdMapMock2);
        const updateTodosForExistingRolesMock: Mock = jest.fn()
            .mockReturnValueOnce(existingRoleTodoIdMapMock1)
            .mockReturnValueOnce(existingRoleTodoIdMapMock2);

        jest.mock("../src/main/todos", () => ({
            deleteObsoleteTodos: deleteObsoleteTodosMock,
            createTodosForNewRoles: createTodosForNewRolesMock,
            updateTodosForExistingRoles: updateTodosForExistingRolesMock,
        }));

        const createScheduleEntryMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdMock1)
            .mockReturnValueOnce(scheduleEntryIdMock2);
        const getScheduleEntryIdentifierMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdentifierMock1)
            .mockReturnValueOnce(scheduleEntryIdentifierMock2);
        const updateScheduleEntryMock: Mock = jest.fn();

        jest.mock("../src/main/schedule", () => ({
            getScheduleEntryIdentifier: getScheduleEntryIdentifierMock,
            updateScheduleEntry: updateScheduleEntryMock,
        }));

        const getAllDocumentPropertiesMock: Mock = jest.fn(() => documentPropertiesMock);
        const deleteDocumentPropertyMock: Mock = jest.fn();

        jest.mock("../src/main/propertiesService", () => ({
            getAllDocumentProperties: getAllDocumentPropertiesMock,
        }));

        const { importOnestopToBasecamp } = require("../src/main/main");
        importOnestopToBasecamp();

        expect(getEventRowsFromSpreadsheetMock).toHaveBeenCalledTimes(1);

        // Asserts for changed first row
        expect(hasChangedMock).toHaveBeenNthCalledWith(1, rowMock1);
        expect(deleteObsoleteTodosMock).toHaveBeenNthCalledWith(1, roleRequestMapMock1, lastSavedRoleTodoIdMapMock1);
        expect(createTodosForNewRolesMock).toHaveBeenNthCalledWith(1, roleRequestMapMock1, lastSavedRoleTodoIdMapMock1);
        expect(updateTodosForExistingRolesMock).toHaveBeenNthCalledWith(1, roleRequestMapMock1, lastSavedRoleTodoIdMapMock1);
        expect(updateScheduleEntryMock).toHaveBeenNthCalledWith(1, scheduleEntryRequestMock1, scheduleEntryIdentifierMock1);
        expect(saveRowMock).toHaveBeenNthCalledWith(1, rowMock1, updatedRoleTodoIdMapMock1, scheduleEntryIdMock1);
    
        // Asserts for changed second row
        expect(hasChangedMock).toHaveBeenNthCalledWith(2, rowMock2);
        expect(deleteObsoleteTodosMock).toHaveBeenNthCalledWith(2, roleRequestMapMock2, lastSavedRoleTodoIdMapMock2);
        expect(createTodosForNewRolesMock).toHaveBeenNthCalledWith(2, roleRequestMapMock2, lastSavedRoleTodoIdMapMock2);
        expect(updateTodosForExistingRolesMock).toHaveBeenNthCalledWith(2, roleRequestMapMock2, lastSavedRoleTodoIdMapMock2);
        expect(updateScheduleEntryMock).toHaveBeenNthCalledWith(2, scheduleEntryRequestMock2, scheduleEntryIdentifierMock2);
        expect(saveRowMock).toHaveBeenNthCalledWith(2, rowMock2, updatedRoleTodoIdMapMock2, scheduleEntryIdMock2);
    });

    it("should delete old Todos when a row is deleted", () => {
        const rowIdMock1: string = randomstring.generate();
        const rowBasecampMappingMock1: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        const rowIdMock2: string = randomstring.generate();
        const rowBasecampMappingMock2: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        const documentPropertiesMock: DocumentProperties = {
            [rowIdMock1]: rowBasecampMappingMock1,
            [rowIdMock2]: rowBasecampMappingMock2,
        };

        const getEventRowsFromSpreadsheetMock: Mock = jest.fn(() => []);

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: getEventRowsFromSpreadsheetMock,
        }));

        const deleteTodosMock: Mock = jest.fn();

        jest.mock("../src/main/todos", () => ({
            deleteTodos: deleteTodosMock,
        }));

        const deleteScheduleEntryMock: Mock = jest.fn();

        jest.mock("../src/main/schedule", () => ({
            deleteScheduleEntry: deleteScheduleEntryMock,
        }));

        const getAllDocumentPropertiesMock: Mock = jest.fn(() => documentPropertiesMock);
        const deleteDocumentPropertyMock: Mock = jest.fn();

        jest.mock("../src/main/propertiesService", () => ({
            getAllDocumentProperties: getAllDocumentPropertiesMock,
            deleteDocumentProperty: deleteDocumentPropertyMock,
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { importOnestopToBasecamp } = require("../src/main/main");
        importOnestopToBasecamp();

        expect(getEventRowsFromSpreadsheetMock).toHaveBeenCalledTimes(1);
        expect(deleteTodosMock).toHaveBeenNthCalledWith(1, Object.values(rowBasecampMappingMock1.roleTodoIdMap));
        expect(deleteDocumentPropertyMock).toHaveBeenNthCalledWith(1, rowIdMock1);
        expect(deleteTodosMock).toHaveBeenNthCalledWith(2, Object.values(rowBasecampMappingMock2.roleTodoIdMap));
        expect(deleteDocumentPropertyMock).toHaveBeenNthCalledWith(2, rowIdMock2);
    });

    it("should delete Schedule Entries when a row is deleted and the Schedule Entry is in the future", () => {
        const rowIdMock1: string = randomstring.generate();
        const rowBasecampMappingMock1: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        rowBasecampMappingMock1.tabInfo.date = new Date(Date.now() + 100000);
        const scheduleEntryIdentifierMock1: ScheduleEntryIdentifier = getRandomlyGeneratedScheduleEntryIdentifier();
        const rowIdMock2: string = randomstring.generate();
        const rowBasecampMappingMock2: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        rowBasecampMappingMock2.tabInfo.date = new Date(Date.now() + 100000);
        const scheduleEntryIdentifierMock2: ScheduleEntryIdentifier = getRandomlyGeneratedScheduleEntryIdentifier();
        const documentPropertiesMock: DocumentProperties = {
            [rowIdMock1]: rowBasecampMappingMock1,
            [rowIdMock2]: rowBasecampMappingMock2,
        };

        const getEventRowsFromSpreadsheetMock: Mock = jest.fn(() => []);

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: getEventRowsFromSpreadsheetMock,
        }));

        const deleteTodosMock: Mock = jest.fn();

        jest.mock("../src/main/todos", () => ({
            deleteTodos: deleteTodosMock,
        }));

        const getScheduleEntryIdentifierMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdentifierMock1)
            .mockReturnValueOnce(scheduleEntryIdentifierMock2);
        const deleteScheduleEntryMock: Mock = jest.fn();

        jest.mock("../src/main/schedule", () => ({
            getScheduleEntryIdentifier: getScheduleEntryIdentifierMock,
            deleteScheduleEntry: deleteScheduleEntryMock,
        }));

        const getAllDocumentPropertiesMock: Mock = jest.fn(() => documentPropertiesMock);
        const deleteDocumentPropertyMock: Mock = jest.fn();

        jest.mock("../src/main/propertiesService", () => ({
            getAllDocumentProperties: getAllDocumentPropertiesMock,
            deleteDocumentProperty: deleteDocumentPropertyMock,
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { importOnestopToBasecamp } = require("../src/main/main");
        importOnestopToBasecamp();

        expect(getEventRowsFromSpreadsheetMock).toHaveBeenCalledTimes(1);
        expect(deleteTodosMock).toHaveBeenNthCalledWith(1, Object.values(rowBasecampMappingMock1.roleTodoIdMap));
        expect(deleteScheduleEntryMock).toHaveBeenNthCalledWith(1, scheduleEntryIdentifierMock1);
        expect(deleteDocumentPropertyMock).toHaveBeenNthCalledWith(1, rowIdMock1);
        expect(deleteTodosMock).toHaveBeenNthCalledWith(2, Object.values(rowBasecampMappingMock2.roleTodoIdMap));
        expect(deleteScheduleEntryMock).toHaveBeenNthCalledWith(2, scheduleEntryIdentifierMock2);
        expect(deleteDocumentPropertyMock).toHaveBeenNthCalledWith(2, rowIdMock2);
    });

    it("should not delete Schedule Entries when a row is deleted and the Schedule Entry is in the past", () => {
        const rowIdMock1: string = randomstring.generate();
        const rowBasecampMappingMock1: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        rowBasecampMappingMock1.tabInfo.date = new Date(Date.now() - 100000);
        const scheduleEntryIdentifierMock1: ScheduleEntryIdentifier = getRandomlyGeneratedScheduleEntryIdentifier();
        const rowIdMock2: string = randomstring.generate();
        const rowBasecampMappingMock2: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        rowBasecampMappingMock2.tabInfo.date = new Date(Date.now() - 100000);
        const scheduleEntryIdentifierMock2: ScheduleEntryIdentifier = getRandomlyGeneratedScheduleEntryIdentifier();
        const documentPropertiesMock: DocumentProperties = {
            [rowIdMock1]: rowBasecampMappingMock1,
            [rowIdMock2]: rowBasecampMappingMock2,
        };

        const getEventRowsFromSpreadsheetMock: Mock = jest.fn(() => []);

        jest.mock("../src/main/scan", () => ({
            getEventRowsFromSpreadsheet: getEventRowsFromSpreadsheetMock,
        }));

        const deleteTodosMock: Mock = jest.fn();

        jest.mock("../src/main/todos", () => ({
            deleteTodos: deleteTodosMock,
        }));

        const getScheduleEntryIdentifierMock: Mock = jest.fn()
            .mockReturnValueOnce(scheduleEntryIdentifierMock1)
            .mockReturnValueOnce(scheduleEntryIdentifierMock2);
        const deleteScheduleEntryMock: Mock = jest.fn();

        jest.mock("../src/main/schedule", () => ({
            getScheduleEntryIdentifier: getScheduleEntryIdentifierMock,
            deleteScheduleEntry: deleteScheduleEntryMock,
        }));

        const getAllDocumentPropertiesMock: Mock = jest.fn(() => documentPropertiesMock);
        const deleteDocumentPropertyMock: Mock = jest.fn();

        jest.mock("../src/main/propertiesService", () => ({
            getAllDocumentProperties: getAllDocumentPropertiesMock,
            deleteDocumentProperty: deleteDocumentPropertyMock,
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { importOnestopToBasecamp } = require("../src/main/main");
        importOnestopToBasecamp();

        expect(getEventRowsFromSpreadsheetMock).toHaveBeenCalledTimes(1);
        expect(deleteTodosMock).toHaveBeenNthCalledWith(1, Object.values(rowBasecampMappingMock1.roleTodoIdMap));
        expect(deleteDocumentPropertyMock).toHaveBeenNthCalledWith(1, rowIdMock1);
        expect(deleteTodosMock).toHaveBeenNthCalledWith(2, Object.values(rowBasecampMappingMock2.roleTodoIdMap));
        expect(deleteDocumentPropertyMock).toHaveBeenNthCalledWith(2, rowIdMock2);
        expect(deleteScheduleEntryMock).toHaveBeenCalledTimes(0);
    });
});
