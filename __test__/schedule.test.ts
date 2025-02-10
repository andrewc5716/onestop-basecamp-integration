import { Logger, PropertiesService } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;
import randomstring from "randomstring";
import { getRandomBoolean, getRandomlyGeneratedRoleTodoMap, getRandomlyGeneratedRow, getRandomlyGeneratedScheduleEntryRequest, Mock } from "./testUtils";
import { getBasecampScheduleEntryRequest } from '../src/main/schedule';

describe("createScheduleEntry", () => {
    it("should send a post request with the right url", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntryRequest();
        const scheduleIdentifier: ScheduleIdentifier = {
            projectId: "TEST_PROJECT_ID",
            scheduleId: "TEST_SCHEDULE_ID"
        };

        const mockResponse = { id: randomstring.generate(), app_url: randomstring.generate() };

        const sendBasecampPostRequestMock: Mock = jest.fn(() => mockResponse);
        const getBasecampProjectUrlMock: Mock = jest.fn(() => "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID");
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPostRequest: sendBasecampPostRequestMock,
            getBasecampProjectUrl: getBasecampProjectUrlMock,
        }));

        // Act
        const { createScheduleEntry } = require("../src/main/schedule");
        createScheduleEntry(randomScheduleEntry, scheduleIdentifier);

        // Assert
        expect(sendBasecampPostRequestMock).toHaveBeenCalled();
        expect(sendBasecampPostRequestMock).toHaveBeenCalledWith(
            "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID/schedules/TEST_SCHEDULE_ID/entries.json",
            randomScheduleEntry
        );
    });

    it("should return BasecampScheduleEntry with id and url", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntryRequest();
        const scheduleIdentifier: ScheduleIdentifier = {
            projectId: randomstring.generate(),
            scheduleId: randomstring.generate()
        };
        const mockUrl: string = randomstring.generate();
        const mockResponse = { id: "12345", app_url: mockUrl };
        const sendBasecampPostRequestMock: Mock = jest.fn(() => mockResponse);
        const getBasecampProjectUrlMock: Mock = jest.fn(() => "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID");
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPostRequest: sendBasecampPostRequestMock,
            getBasecampProjectUrl: getBasecampProjectUrlMock,
        }));

        // Act
        const { createScheduleEntry } = require("../src/main/schedule");
        const response = createScheduleEntry(randomScheduleEntry, scheduleIdentifier);
        
        // Assert
        expect(response).toEqual({ id: "12345", url: mockUrl });
    });
});

describe("updateScheduleEntry", () => {
    it("should send a put request with the right url", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntryRequest();
        const scheduleIdentifier: ScheduleEntryIdentifier = {
            projectId: "TEST_PROJECT_ID",
            scheduleEntryId: "TEST_SCHEDULE_ENTRY_ID"
        };

        const mockResponse = { id: randomstring.generate() };
        const sendBasecampPutRequestMock: Mock = jest.fn(() => mockResponse);
        const getBasecampProjectUrlMock: Mock = jest.fn(() => "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID");
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPutRequest: sendBasecampPutRequestMock,
            getBasecampProjectUrl: getBasecampProjectUrlMock,
        }));

        // Act
        const { updateScheduleEntry } = require("../src/main/schedule");
        updateScheduleEntry(randomScheduleEntry, scheduleIdentifier);

        // Assert
        expect(sendBasecampPutRequestMock).toHaveBeenCalled();
        expect(sendBasecampPutRequestMock).toHaveBeenCalledWith(
            "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID/schedule_entries/TEST_SCHEDULE_ENTRY_ID.json",
            randomScheduleEntry
        );
    });
});

describe("deleteScheduleEntry", () => {
    it("should send a put request with the right url", () => {
        // Arrange
        const scheduleIdentifier: ScheduleEntryIdentifier = {
            projectId: "TEST_PROJECT_ID",
            scheduleEntryId: "TEST_SCHEDULE_ENTRY_ID"
        };

        const mockResponse = { id: randomstring.generate() };
        const sendBasecampPutRequestMock: Mock = jest.fn(() => mockResponse);
        const getBasecampProjectUrlMock: Mock = jest.fn(() => "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID");
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPutRequest: sendBasecampPutRequestMock,
            getBasecampProjectUrl: getBasecampProjectUrlMock,
        }));

        // Act
        const { deleteScheduleEntry } = require("../src/main/schedule");
        deleteScheduleEntry(scheduleIdentifier);

        // Assert
        expect(sendBasecampPutRequestMock).toHaveBeenCalled();
        expect(sendBasecampPutRequestMock).toHaveBeenCalledWith(
            "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID/recordings/TEST_SCHEDULE_ENTRY_ID/status/trashed.json",
            {}
        );
    });
});

describe("getBasecampScheduleEntryRequest", () => {
    it("should construct a BasecampScheduleEntryRequest object when provided with the required data", () => {
        const summary: string = randomstring.generate();
        const startsAt: string = randomstring.generate();
        const endsAt: string = randomstring.generate();
        const description: string = randomstring.generate();
        const participantIds: string[] = Array.from({length: 5}, () => randomstring.generate());
        const allDay: boolean = getRandomBoolean();
        const notify: boolean = getRandomBoolean();

        const expectedBasecampScheduleEntryRequest: BasecampScheduleEntryRequest = {
            summary: summary,
            starts_at: startsAt,
            ends_at: endsAt,
            description: description,
            participant_ids: participantIds,
            all_day: allDay,
            notify: notify,
        };

        const receivedBasecampScheduleEntryRequest: BasecampScheduleEntryRequest = getBasecampScheduleEntryRequest(summary, startsAt, endsAt, description, participantIds, allDay, notify);

        expect(receivedBasecampScheduleEntryRequest).toStrictEqual(expectedBasecampScheduleEntryRequest);
    });
});

describe("getDefaultScheduleIdentifier", () => {
    it("should return the default schedule identifier object when called", () => {
        const basecampProjectIdMock: string = randomstring.generate();
        const basecampScheduleIdMock: string = randomstring.generate();

        jest.mock("../config/environmentVariables", () => ({
            BASECAMP_PROJECT_ID: basecampProjectIdMock,
            BASECAMP_SCHEDULE_ID: basecampScheduleIdMock,
        }));

        const expectedScheduleIdentifier: ScheduleIdentifier = {
            projectId: basecampProjectIdMock,
            scheduleId: basecampScheduleIdMock,
        };

        const { getDefaultScheduleIdentifier } = require("../src/main/schedule");
        const recevedScheduleIdentifier: ScheduleIdentifier = getDefaultScheduleIdentifier();

        expect(recevedScheduleIdentifier).toStrictEqual(expectedScheduleIdentifier);
    });
});

describe("getScheduleEntryIdentifier", () => {
    it("should construct and return schedule identifier object when called", () => {
        const basecampProjectIdMock: string = randomstring.generate();
        const scheduleEntryIdMock: string = randomstring.generate();

        jest.mock("../config/environmentVariables", () => ({
            BASECAMP_PROJECT_ID: basecampProjectIdMock,
        }));

        const expectedScheduleEntryIdentifier: ScheduleEntryIdentifier = {
            projectId: basecampProjectIdMock,
            scheduleEntryId: scheduleEntryIdMock,
        };

        const { getScheduleEntryIdentifier } = require("../src/main/schedule");
        const receivedScheduleEntryIdentifier: ScheduleIdentifier = getScheduleEntryIdentifier(scheduleEntryIdMock);

        expect(receivedScheduleEntryIdentifier).toStrictEqual(expectedScheduleEntryIdentifier);
    });
});

describe("createScheduleEntryForRow", () => {
    it("should create a schedule entry for the row when there are no exceptions thrown", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const roleTodoMapMock: RoleTodoMap = getRandomlyGeneratedRoleTodoMap();
        const scheduleEntryIdMock: string = randomstring.generate();
        const scheduleEntryUrlMock: string = randomstring.generate();

        jest.mock("../src/main/row", () => ({
            getScheduleEntryRequestForRow: jest.fn(() => getRandomlyGeneratedScheduleEntryRequest()),
        }));

        const sendBasecampPostRequestMock: Mock = jest.fn().mockReturnValue({ id: scheduleEntryIdMock, app_url: scheduleEntryUrlMock });
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPostRequest: sendBasecampPostRequestMock,
            getBasecampProjectUrl: jest.fn(() => randomstring.generate()),
        }));

        const { createScheduleEntryForRow } = require("../src/main/schedule");

        const receivedScheduleEntry: BasecampScheduleEntry = createScheduleEntryForRow(rowMock, roleTodoMapMock);
        const expectedBasecampScheduleEntry: BasecampScheduleEntry = {
            id: scheduleEntryIdMock,
            url: scheduleEntryUrlMock
        };

        expect(sendBasecampPostRequestMock).toHaveBeenCalled();
        expect(receivedScheduleEntry).toStrictEqual(expectedBasecampScheduleEntry);
    });

    it("should return undefined when there is an error creating the schedule entry", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const roleTodoMapMock: RoleTodoMap = getRandomlyGeneratedRoleTodoMap();

        jest.mock("../src/main/row", () => ({
            getScheduleEntryRequestForRow: jest.fn(() => getRandomlyGeneratedScheduleEntryRequest()),
        }));

        const sendBasecampPostRequestMock: Mock = jest.fn().mockImplementation(() => {
            throw new Error("Test error");
        });
        jest.mock("../src/main/basecamp", () => ({
            sendBasecampPostRequest: sendBasecampPostRequestMock,
            getBasecampProjectUrl: jest.fn(() => randomstring.generate()),
        }));

        const { createScheduleEntryForRow } = require("../src/main/schedule");

        const receivedScheduleEntryId: string = createScheduleEntryForRow(rowMock, roleTodoMapMock);

        expect(sendBasecampPostRequestMock).toHaveBeenCalled();
        expect(receivedScheduleEntryId).toBe(undefined);
    });
});
