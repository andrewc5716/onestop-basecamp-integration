import { PropertiesService, SpreadsheetApp } from "gasmask";
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;

import Spreadsheet from "gasmask/dist/SpreadsheetApp/Spreadsheet";
import { TabNotFoundError } from "../src/main/error/tabNotFoundError";
import Sheet from "gasmask/dist/SpreadsheetApp/Sheet";
import { getRandomlyGeneratedCellValues, getRandomlyGeneratedRange } from "./testUtils";
import { Range as GasMaskRange } from "gasmask/dist/SpreadsheetApp";
import Range from "gasmask/dist/SpreadsheetApp/Range";

describe("getCellValues", () => {
    it("should throw a TabNotFound error when the tab does not exist on the spreadsheet", () => {
        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tab1: Sheet = new Sheet("Tab1");
        const tab2: Sheet = new Sheet("Tab2");
        const tab3: Sheet = new Sheet("Tab3");

        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tab1, tab2, tab3]);
        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);

        const { getCellValues } = require('../src/main/scan');

        expect(() => getCellValues("BadTabName")).toThrow(new TabNotFoundError("No BadTabName tab found"));
    });

    it("should return the cell values for the tab when the tab exists", () => {
        const spreadsheetMock: Spreadsheet = new Spreadsheet("mock spreadsheet");
        const tab1: Sheet = new Sheet("Tab1");
        const tab2: Sheet = new Sheet("TabName");
        const tab3: Sheet = new Sheet("Tab3");

        const cellValuesMock: any[][] = getRandomlyGeneratedCellValues();
        const dataRangeMock: Range = new GasMaskRange(cellValuesMock, {}, tab2);

        jest.spyOn(spreadsheetMock, "getSheets").mockReturnValue([tab1, tab2, tab3]);
        jest.spyOn(SpreadsheetApp, "getActiveSpreadsheet").mockReturnValue(spreadsheetMock);
        jest.spyOn(tab2, "getDataRange").mockReturnValue(dataRangeMock);
        jest.spyOn(dataRangeMock, "getValues").mockReturnValue(cellValuesMock);

        const { getCellValues } = require('../src/main/scan');
        
        const retrievedCellValues: Sheet = getCellValues("TabName");
        expect(retrievedCellValues).toStrictEqual(cellValuesMock);
    });
});