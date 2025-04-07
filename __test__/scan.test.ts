import { Logger, PropertiesService, SpreadsheetApp } from "gasmask";
global.Logger = Logger;
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;

import Spreadsheet from "gasmask/dist/SpreadsheetApp/Spreadsheet";
import { TabNotFoundError } from "../src/main/error/tabNotFoundError";
import { getRandomlyGeneratedCellValues, getRandomlyGeneratedMetadata, getRandomlyGeneratedRichTextValue, getRandomlyGeneratedRichTextValues, getRandomlyGeneratedTextStyle, RangeMock, SheetMock } from "./testUtils";

describe("getEventRowsFromSpreadsheet", () => {
    it("should skip rows with the WHAT column crossed out when the WHAT column text has strikethrough", () => {
        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tabMock: SheetMock = new SheetMock("TUE 2/11", false);
        const cellValuesMock: any[][] = getRandomlyGeneratedCellValues(2, 11);
        cellValuesMock[0][0] = new Date("2025-02-11T00:00:00Z");
        // Set the start and end time to pass validation
        cellValuesMock[1][0] = new Date("2025-02-11T07:00:00Z");
        cellValuesMock[1][1] = new Date("2025-02-11T08:00:00Z");
        const richTextValuesMock: RichTextValue[][] = getRandomlyGeneratedRichTextValues(2, 11);
        // Set the strikethrough for the WHAT column to true
        const whatColumnRichTextValueMock: RichTextValue = getRandomlyGeneratedRichTextValue();
        const whatColumnTextStyleMock: TextStyle = getRandomlyGeneratedTextStyle();
        jest.spyOn(whatColumnTextStyleMock, "isStrikethrough").mockReturnValue(true);
        jest.spyOn(whatColumnRichTextValueMock, "getRuns").mockReturnValue([whatColumnRichTextValueMock]);
        jest.spyOn(whatColumnRichTextValueMock, "getTextStyle").mockReturnValue(whatColumnTextStyleMock);
        richTextValuesMock[1][5] = whatColumnRichTextValueMock;
        const dataRangeMock: RangeMock = new RangeMock(cellValuesMock, {}, tabMock, richTextValuesMock);

        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);
        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tabMock]);
        jest.spyOn(tabMock, "getDataRange").mockReturnValue(dataRangeMock);
        jest.spyOn(dataRangeMock, "getValues").mockReturnValue(cellValuesMock);
        jest.spyOn(dataRangeMock, "getRichTextValues").mockReturnValue(richTextValuesMock);

        const { getEventRowsFromSpreadsheet } = require('../src/main/scan');

        const retrievedEventRows: Row[] = getEventRowsFromSpreadsheet();
        expect(retrievedEventRows.length).toBe(0);
    });

    it("should skip tabs that are in the past when old tabs are unhidden", () => {
        jest.useFakeTimers();

        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tabMock1: SheetMock = new SheetMock("SAT 3/15", false);
        const tabMock2: SheetMock = new SheetMock("SUN 3/16", false);
        const tabMock3: SheetMock = new SheetMock("MON 3/17", false);
        const cellValuesMock1: any[][] = getRandomlyGeneratedCellValues(2, 11);
        const cellValuesMock2: any[][] = getRandomlyGeneratedCellValues(2, 11);
        const cellValuesMock3: any[][] = getRandomlyGeneratedCellValues(2, 11);
        cellValuesMock1[0][0] = new Date("2025-03-15T00:00:00Z");
        cellValuesMock2[0][0] = new Date("2025-03-16T00:00:00Z");
        cellValuesMock3[0][0] = new Date("2025-03-17T00:00:00Z");
        // Set the start and end time to pass validation
        cellValuesMock1[1][0] = new Date("2025-03-15T07:00:00Z");
        cellValuesMock1[1][1] = new Date("2025-03-15T08:00:00Z");
        cellValuesMock2[1][0] = new Date("2025-03-16T07:00:00Z");
        cellValuesMock2[1][1] = new Date("2025-03-16T08:00:00Z");
        cellValuesMock3[1][0] = new Date("2025-03-17T07:00:00Z");
        cellValuesMock3[1][1] = new Date("2025-03-17T08:00:00Z");
        const richTextValuesMock1: RichTextValue[][] = getRandomlyGeneratedRichTextValues(2, 11);
        const richTextValuesMock2: RichTextValue[][] = getRandomlyGeneratedRichTextValues(2, 11);
        const richTextValuesMock3: RichTextValue[][] = getRandomlyGeneratedRichTextValues(2, 11);
        const whatColumnRichTextValueMock1: RichTextValue = getRandomlyGeneratedRichTextValue();
        const whatColumnRichTextValueMock2: RichTextValue = getRandomlyGeneratedRichTextValue();
        const whatColumnRichTextValueMock3: RichTextValue = getRandomlyGeneratedRichTextValue();
        const whatColumnTextStyleMock1: TextStyle = getRandomlyGeneratedTextStyle();
        const whatColumnTextStyleMock2: TextStyle = getRandomlyGeneratedTextStyle();
        const whatColumnTextStyleMock3: TextStyle = getRandomlyGeneratedTextStyle();
        jest.spyOn(whatColumnTextStyleMock1, "isStrikethrough").mockReturnValue(false);
        jest.spyOn(whatColumnRichTextValueMock1, "getRuns").mockReturnValue([whatColumnRichTextValueMock1]);
        jest.spyOn(whatColumnRichTextValueMock1, "getTextStyle").mockReturnValue(whatColumnTextStyleMock1);
        jest.spyOn(whatColumnTextStyleMock2, "isStrikethrough").mockReturnValue(false);
        jest.spyOn(whatColumnRichTextValueMock2, "getRuns").mockReturnValue([whatColumnRichTextValueMock2]);
        jest.spyOn(whatColumnRichTextValueMock2, "getTextStyle").mockReturnValue(whatColumnTextStyleMock2);
        jest.spyOn(whatColumnTextStyleMock3, "isStrikethrough").mockReturnValue(false);
        jest.spyOn(whatColumnRichTextValueMock3, "getRuns").mockReturnValue([whatColumnRichTextValueMock3]);
        jest.spyOn(whatColumnRichTextValueMock3, "getTextStyle").mockReturnValue(whatColumnTextStyleMock3);
        richTextValuesMock1[1][5] = whatColumnRichTextValueMock1;
        richTextValuesMock2[1][5] = whatColumnRichTextValueMock2;
        richTextValuesMock3[1][5] = whatColumnRichTextValueMock3;
        const dataRangeMock1: RangeMock = new RangeMock(cellValuesMock1, {}, tabMock1, richTextValuesMock1);
        const dataRangeMock2: RangeMock = new RangeMock(cellValuesMock2, {}, tabMock2, richTextValuesMock2);
        const dataRangeMock3: RangeMock = new RangeMock(cellValuesMock3, {}, tabMock3, richTextValuesMock3);

        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);
        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tabMock1, tabMock2, tabMock3]);
        jest.spyOn(tabMock1, "getDataRange").mockReturnValue(dataRangeMock1);
        jest.spyOn(tabMock2, "getDataRange").mockReturnValue(dataRangeMock2);
        jest.spyOn(tabMock3, "getDataRange").mockReturnValue(dataRangeMock3);
        jest.spyOn(dataRangeMock1, "getValues").mockReturnValue(cellValuesMock1);
        jest.spyOn(dataRangeMock2, "getValues").mockReturnValue(cellValuesMock2);
        jest.spyOn(dataRangeMock3, "getValues").mockReturnValue(cellValuesMock3);

        const mockCurrentDate = new Date("2025-03-16T12:30:20Z");
        jest.setSystemTime(mockCurrentDate);

        jest.mock("../src/main/row", () => ({
            getMetadata: jest.fn(() => getRandomlyGeneratedMetadata()),
        }));

        const { getEventRowsFromSpreadsheet } = require('../src/main/scan');

        const retrievedEventRows: Row[] = getEventRowsFromSpreadsheet();
        expect(retrievedEventRows.length).toBe(2);

        jest.useRealTimers();
    });

    it("should parse the tab when the top left date is malformed", () => {
        jest.useFakeTimers();

        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tabMock: SheetMock = new SheetMock("TUE 2/11", false);
        const cellValuesMock: any[][] = getRandomlyGeneratedCellValues(2, 11);
        // Set the start and end time to pass validation
        cellValuesMock[1][0] = new Date("2025-02-11T07:00:00Z");
        cellValuesMock[1][1] = new Date("2025-02-11T08:00:00Z");
        const richTextValuesMock: RichTextValue[][] = getRandomlyGeneratedRichTextValues(2, 11);
        // Set the strikethrough for the WHAT column to true
        const whatColumnRichTextValueMock: RichTextValue = getRandomlyGeneratedRichTextValue();
        const whatColumnTextStyleMock: TextStyle = getRandomlyGeneratedTextStyle();
        jest.spyOn(whatColumnTextStyleMock, "isStrikethrough").mockReturnValue(false);
        jest.spyOn(whatColumnRichTextValueMock, "getRuns").mockReturnValue([whatColumnRichTextValueMock]);
        jest.spyOn(whatColumnRichTextValueMock, "getTextStyle").mockReturnValue(whatColumnTextStyleMock);
        richTextValuesMock[1][5] = whatColumnRichTextValueMock;
        const dataRangeMock: RangeMock = new RangeMock(cellValuesMock, {}, tabMock, richTextValuesMock);

        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);
        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tabMock]);
        jest.spyOn(tabMock, "getDataRange").mockReturnValue(dataRangeMock);
        jest.spyOn(dataRangeMock, "getValues").mockReturnValue(cellValuesMock);
        jest.spyOn(dataRangeMock, "getRichTextValues").mockReturnValue(richTextValuesMock);

        const mockCurrentDate = new Date("2025-02-05T12:30:20Z");
        jest.setSystemTime(mockCurrentDate);

        jest.mock("../src/main/row", () => ({
            getMetadata: jest.fn(() => getRandomlyGeneratedMetadata()),
        }));

        const { getEventRowsFromSpreadsheet } = require('../src/main/scan');

        const retrievedEventRows: Row[] = getEventRowsFromSpreadsheet();
        expect(retrievedEventRows.length).toBe(1);
        const retrievedEventRow: Row = retrievedEventRows[0];
        expect(retrievedEventRow.date.getMonth()).toBe(1);
        expect(retrievedEventRow.date.getDate()).toBe(11);
        expect(retrievedEventRow.date.getFullYear()).toBe(2025);

        jest.useRealTimers();
    });

    it("should parse the tab with the correct year when the top left date is malformed and the tab is in the next year", () => {
        jest.useFakeTimers();

        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tabMock: SheetMock = new SheetMock("TUE 1/2", false);
        const cellValuesMock: any[][] = getRandomlyGeneratedCellValues(2, 11);
        // Set the start and end time to pass validation
        cellValuesMock[1][0] = new Date("2025-1-2T07:00:00Z");
        cellValuesMock[1][1] = new Date("2025-1-2T08:00:00Z");
        const richTextValuesMock: RichTextValue[][] = getRandomlyGeneratedRichTextValues(2, 11);
        // Set the strikethrough for the WHAT column to true
        const whatColumnRichTextValueMock: RichTextValue = getRandomlyGeneratedRichTextValue();
        const whatColumnTextStyleMock: TextStyle = getRandomlyGeneratedTextStyle();
        jest.spyOn(whatColumnTextStyleMock, "isStrikethrough").mockReturnValue(false);
        jest.spyOn(whatColumnRichTextValueMock, "getRuns").mockReturnValue([whatColumnRichTextValueMock]);
        jest.spyOn(whatColumnRichTextValueMock, "getTextStyle").mockReturnValue(whatColumnTextStyleMock);
        richTextValuesMock[1][5] = whatColumnRichTextValueMock;
        const dataRangeMock: RangeMock = new RangeMock(cellValuesMock, {}, tabMock, richTextValuesMock);

        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);
        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tabMock]);
        jest.spyOn(tabMock, "getDataRange").mockReturnValue(dataRangeMock);
        jest.spyOn(dataRangeMock, "getValues").mockReturnValue(cellValuesMock);
        jest.spyOn(dataRangeMock, "getRichTextValues").mockReturnValue(richTextValuesMock);

        const mockCurrentDate = new Date("2025-12-20T12:30:20Z");
        jest.setSystemTime(mockCurrentDate);

        jest.mock("../src/main/row", () => ({
            getMetadata: jest.fn(() => getRandomlyGeneratedMetadata()),
        }));

        const { getEventRowsFromSpreadsheet } = require('../src/main/scan');

        const retrievedEventRows: Row[] = getEventRowsFromSpreadsheet();
        expect(retrievedEventRows.length).toBe(1);
        const retrievedEventRow: Row = retrievedEventRows[0];
        expect(retrievedEventRow.date.getMonth()).toBe(0);
        expect(retrievedEventRow.date.getDate()).toBe(2);
        expect(retrievedEventRow.date.getFullYear()).toBe(2026);

        jest.useRealTimers();
    });
});

describe("getCellValues", () => {
    it("should throw a TabNotFound error when the tab does not exist on the spreadsheet", () => {
        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tab1: SheetMock = new SheetMock("Tab1");
        const tab2: SheetMock = new SheetMock("Tab2");
        const tab3: SheetMock = new SheetMock("Tab3");

        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tab1, tab2, tab3]);
        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);

        const { getCellValues } = require('../src/main/scan');

        expect(() => getCellValues("BadTabName")).toThrow(new TabNotFoundError("No BadTabName tab found"));
    });

    it("should return the cell values for the tab when the tab exists", () => {
        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tab1: SheetMock = new SheetMock("Tab1");
        const tab2: SheetMock = new SheetMock("TabName");
        const tab3: SheetMock = new SheetMock("Tab3");

        const cellValuesMock: any[][] = getRandomlyGeneratedCellValues();
        const dataRangeMock: RangeMock = new RangeMock(cellValuesMock, {}, tab2, [[]]);

        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tab1, tab2, tab3]);
        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);
        jest.spyOn(tab2, "getDataRange").mockReturnValue(dataRangeMock);
        jest.spyOn(dataRangeMock, "getValues").mockReturnValue(cellValuesMock);

        const { getCellValues } = require('../src/main/scan');
        
        const retrievedCellValues: Sheet = getCellValues("TabName");
        expect(retrievedCellValues).toStrictEqual(cellValuesMock);
    });
});