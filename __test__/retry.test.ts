import { Logger, UrlFetchApp } from "gasmask";
global.Logger = Logger;
global.UrlFetchApp = UrlFetchApp;
import { fetchWithRetry } from "../src/main/retry";
import randomstring from "randomstring";
import { Mock } from "./testUtils";
import { RetryError } from "../src/main/error/retryError";

type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

describe("fetchWithRetry", () => {
    it("should return a response when the fetch is successful", () => {
        const urlMock: string = randomstring.generate();
        const optionsMock: URLFetchRequestOptions = { method: "get" };
        const responseMock: HTTPResponse = { test: "test" } as any;

        const sleepMock: Mock = jest.fn();
        global.Utilities = { sleep: sleepMock };

        jest.spyOn(UrlFetchApp, "fetch").mockReturnValue(responseMock as any);

        const result: HTTPResponse = fetchWithRetry(urlMock, optionsMock);

        expect(result).toEqual(responseMock);
    });

    it("should return a response when maxRetries is set to 0", () => {
        const urlMock: string = randomstring.generate();
        const optionsMock: URLFetchRequestOptions = { method: "get" };
        const responseMock: HTTPResponse = { test: "test" } as any;

        const sleepMock: Mock = jest.fn();
        global.Utilities = { sleep: sleepMock };

        jest.spyOn(UrlFetchApp, "fetch").mockReturnValue(responseMock as any);

        const result: HTTPResponse = fetchWithRetry(urlMock, optionsMock, 0);

        expect(result).toEqual(responseMock);
    });

    it("should retry the fetch when the HTTP request fails", () => {
        const urlMock: string = randomstring.generate();
        const optionsMock: URLFetchRequestOptions = { method: "get" };
        const responseMock: HTTPResponse = { test: "test" } as any;

        const sleepMock: Mock = jest.fn();
        global.Utilities = { sleep: sleepMock };

        jest.spyOn(UrlFetchApp, "fetch")
            .mockImplementationOnce(() => {
                throw new Error("HTTP request failed")
            })
            .mockReturnValue(responseMock as any);

        const result: HTTPResponse = fetchWithRetry(urlMock, optionsMock);

        expect(result).toEqual(responseMock);
    });

    it("should throw a RetryError when the maximum number of retries is reached", () => {
        const urlMock: string = randomstring.generate();
        const optionsMock: URLFetchRequestOptions = { method: "get" };
        const responseMock: HTTPResponse = { test: "test" } as any;

        const sleepMock: Mock = jest.fn();
        global.Utilities = { sleep: sleepMock };

        jest.spyOn(UrlFetchApp, "fetch").mockImplementation(() => {
            throw new Error("HTTP request failed")
        });

        expect(()=> fetchWithRetry(urlMock, optionsMock)).toThrow(RetryError);
    });
});