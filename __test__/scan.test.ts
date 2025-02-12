import { Logger, PropertiesService, SpreadsheetApp } from "gasmask";
global.Logger = Logger;
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;

import Spreadsheet from "gasmask/dist/SpreadsheetApp/Spreadsheet";
import { TabNotFoundError } from "../src/main/error/tabNotFoundError";
import { getRandomlyGeneratedCellValues, getRandomlyGeneratedRichTextValue, getRandomlyGeneratedRichTextValues, getRandomlyGeneratedTextStyle, RangeMock, SheetMock } from "./testUtils";

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