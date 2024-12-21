import { Logger } from 'gasmask';
import randomstring from "randomstring";
import { getRandomlyGeneratedScheduleEntry, Mock } from "./testUtils";

global.Logger = Logger;

describe("createScheduleEntry", () => {
    it("should send a post request with the right url", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntry();
        const scheduleIdentifier: ScheduleIdentifier = {
            projectId: "TEST_PROJECT_ID",
            scheduleId: "TEST_SCHEDULE_ID"
        };

        const mockResponse = { id: randomstring.generate() };

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

    it("should return the created schedule entry id", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntry();
        const scheduleIdentifier: ScheduleIdentifier = {
            projectId: randomstring.generate(),
            scheduleId: randomstring.generate()
        };
        const mockResponse = { id: "12345" };
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
        expect(response).toEqual("12345");
    });
});

describe("updateScheduleEntry", () => {
    it("should send a put request with the right url", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntry();
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
