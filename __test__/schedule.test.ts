import { Logger } from 'gasmask';
import randomstring from "randomstring";
import {getRandomlyGeneratedScheduleEntry} from "./testUtils";
import { createScheduleEntry, updateScheduleEntry, deleteScheduleEntry } from "../src/main/schedule";
import { sendBasecampPostRequest, sendBasecampPutRequest, getBasecampProjectUrl } from "../src/main/basecamp";

global.Logger = Logger;

jest.mock("../src/main/basecamp");

describe("createScheduleEntry", () => {
    it("should send a post request with the right url", () => {
        // Arrange
        const randomScheduleEntry = getRandomlyGeneratedScheduleEntry();
        const scheduleIdentifier: ScheduleIdentifier = {
            projectId: "TEST_PROJECT_ID",
            scheduleId: "TEST_SCHEDULE_ID"
        };

        const mockResponse = { id: randomstring.generate() };

        (sendBasecampPostRequest as jest.Mock).mockReturnValue(mockResponse);
        (getBasecampProjectUrl as jest.Mock).mockReturnValue("https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID")

        // Act
        createScheduleEntry(randomScheduleEntry, scheduleIdentifier);

        // Assert
        expect(sendBasecampPostRequest).toHaveBeenCalled();
        expect(sendBasecampPostRequest).toHaveBeenCalledWith(
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
        (sendBasecampPostRequest as jest.Mock).mockReturnValue(mockResponse);
        (getBasecampProjectUrl as jest.Mock).mockReturnValue("https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID")

        // Act
        const response = createScheduleEntry(randomScheduleEntry, scheduleIdentifier);
        console.log(response);
        
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
        (sendBasecampPutRequest as jest.Mock).mockReturnValue(mockResponse);
        (getBasecampProjectUrl as jest.Mock).mockReturnValue("https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID")

        // Act
        updateScheduleEntry(randomScheduleEntry, scheduleIdentifier);

        // Assert
        expect(sendBasecampPutRequest).toHaveBeenCalled();
        expect(sendBasecampPutRequest).toHaveBeenCalledWith(
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
        (sendBasecampPutRequest as jest.Mock).mockReturnValue(mockResponse);
        (getBasecampProjectUrl as jest.Mock).mockReturnValue("https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID")

        // Act
        deleteScheduleEntry(scheduleIdentifier);

        // Assert
        expect(sendBasecampPutRequest).toHaveBeenCalled();
        expect(sendBasecampPutRequest).toHaveBeenCalledWith(
            "https://3.basecamp.com/4474129/buckets/TEST_PROJECT_ID/recordings/TEST_SCHEDULE_ENTRY_ID/status/trashed.json",
            {}
        );
    });
});