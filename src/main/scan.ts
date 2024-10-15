import { getMetadata } from "./row";

type TextStyle = GoogleAppsScript.Spreadsheet.TextStyle;
type RichTextValue = GoogleAppsScript.Spreadsheet.RichTextValue;

// RegEx pattern used to identify daily tabs
const DAILY_TAB_REGEX_PATTERN: RegExp = /^(MON|TUE|WED|THU|FRI|SAT|SUN) ([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])$/;

// Column indices for event rows
const DATE_ROW_INDEX: number = 0;
const DATE_COL_INDEX: number = 0;
const START_TIME_COL_INDEX: number = 0;
const END_TIME_COL_INDEX: number = 1;
const WHO_COL_INDEX: number = 2;
const NUM_ATTENDEES_COL_INDEX: number = 3;
const WHAT_COL_INDEX: number = 4;
const WHERE_COL_INDEX: number = 5;
const IN_CHARGE_COL_INDEX: number = 6;
const HELPERS_COL_INDEX: number = 7;
const FOOD_LEAD_COL_INDEX: number = 8;
const CHILDCARE_COL_INDEX: number = 9;
const NOTES_COL_INDEX: number = 10;

// Number of minutes in an hour
const MIN_IN_HOUR: number = 60;

interface CellData {
    readonly value: any,
    readonly linkUrl: string | null,
    readonly strikethrough: boolean
}

/**
 * Retrieves all event rows from the spreadsheet
 * 
 * @returns an array of event rows from all of the daily active tabs of the spreadsheet
 */
export function getEventRowsFromSpreadsheet(): Row[] {
    Logger.log("Getting event rows from spreadsheet...\n");
    
    const tabs: Sheet[] = getAllSpreadsheetTabs();
    const dailyActiveTabs: Sheet[] = getActiveDailyTabs(tabs);
    // Fetches all event rows from all of the daily active tabs
    const eventRows: Row[] = dailyActiveTabs.flatMap((dailyActiveTab) => getRowsWithEvents(dailyActiveTab));
    
    Logger.log(`Found ${eventRows.length} active rows from the spreadsheet...`)
    return eventRows;
}

/**
 * Fetches all of the tabs of the active spreadsheet
 *
 * @returns an array of spreadsheet tabs
 */
export function getAllSpreadsheetTabs(): Sheet[] {
    const spreadsheet: Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet.getSheets();
}

/**
 * Fetches all of the active, non-hidden, daily tabs from an array of spreadsheet tabs
 * 
 * @param spreadsheetTabs array of spreadsheet tabs to search through
 * @returns array of active daily tabs
 */
export function getActiveDailyTabs(spreadsheetTabs: Sheet[]): Sheet[] {
    const dailyActiveTabs: Sheet[] = [];
    for(const tab of spreadsheetTabs) {
        if(isActiveDailyTab(tab)) {
            dailyActiveTabs.push(tab);
        }
    }

    return dailyActiveTabs;
}

/**
 * Fetches the rows from a spreadsheet tab that correspond to an actual event on the Onestop
 * 
 * @param spreadsheetTab spreadsheet tab to search through
 * @returns an array of Row objects
 */
export function getRowsWithEvents(spreadsheetTab: Sheet): Row[] {
    const dataRange: Range = spreadsheetTab.getDataRange();
    const cellData = getCellData(dataRange);
    const currentDate = getDateOfDailyTab(cellData);

    const rows: Row[] = [];
    for(let i = 0; i < cellData.length; i++) {
        const rowData: CellData[] = cellData[i];
        if (isValidEventRow(rowData)) {
            // Google sheets is 1 indexed
            const rowIndex = i + 1;
            // Need to grab Range of entire row because GAS only allows setting metadata on an entire row
            // This is also only possible with the A1 notation api for some reason
            const rowRange: Range = spreadsheetTab.getRange(rowIndex + ":" + rowIndex);
            const currentRow: Row = constructRow(rowRange, rowData, currentDate);
            rows.push(currentRow);
        }
    }

    return rows;
}

/**
 * Checks if a given tab is not hidden and is a daily tab. If it is, add it to the dailyActiveTabs output array
 * 
 * @param tab the tab to check
 * @returns boolean representing the tab is an active and daily tab
 */
function isActiveDailyTab(tab: Sheet): boolean {
    return !isTabHidden(tab) && isDailyTab(tab);
}

/**
 * Checks if a given tab is hidden
 * 
 * @param tab the tab to check
 * @returns boolean representing whether the tab is hidden or not
 */
function isTabHidden(tab: Sheet): boolean {
    return tab.isSheetHidden();
}

/**
 * Checks if a given tab is a daily tab using RegEx. The tab name must meet the general pattern of DDD M/dd (ex. TUE 8/13) to be considered a daily tab
 * 
 * @param tab the tab to check
 * @returns boolean representing whether the tab is a daily tab or not
 */
function isDailyTab(tab: Sheet): boolean {
    const tabName: string = tab.getName();
    const matchResult: RegExpMatchArray | null = tabName.match(DAILY_TAB_REGEX_PATTERN);
    // null indicates that the tab name did not match the regex pattern for the daily tab
    return matchResult !== null;
}

/**
 * Fetches all of the cell data for a given range of cells on a spreadsheet
 * 
 * @param dataRange the range of cells to fetch data for
 * @returns matrix of CellData objects
 */
function getCellData(dataRange: Range): CellData[][] {
    const cellData: CellData[][] = [];
    const cellValues: any[][] = dataRange.getValues();
    const cellRichTextData: RichTextValue[][] = dataRange.getRichTextValues() as RichTextValue[][];

    const numRows = dataRange.getNumRows();
    const numCols = dataRange.getNumColumns();

    for(let i = 0; i < numRows; i++) {
        cellData[i] = [];
        populateColumnData(i, cellData, numCols, cellRichTextData, cellValues);
    }

    return cellData;
}

/**
 * Helper function for the getCellData function that given a row, populates the column data for that particular row
 * 
 * @param currentRow the current row index being processed
 * @param cellData output matrix where the column data is to be populated
 * @param numCols number of columns in the cell data matrix
 * @param cellRichTextData rich text data that is to be used to fetch the potential hyperlink urls for cells in this row
 * @param cellValues actual data values that is to be used to populate the cell data matrix
 */
function populateColumnData(currentRow: number, cellData: CellData[][], numCols: number, cellRichTextData: RichTextValue[][], cellValues: any[][]) {
    for(let j = 0; j < numCols; j++) {
        const textStyle: TextStyle = cellRichTextData[currentRow][j].getTextStyle();
        cellData[currentRow][j] = {
            value: cellValues[currentRow][j],
            linkUrl: cellRichTextData[currentRow][j].getLinkUrl(),
            strikethrough: getCellStrikethrough(textStyle)
        }
    }
}

/**
 * Returns whether a cell has strikethrough set
 * 
 * @param textStyle style object for a particular cell
 * @returns the strikethrough value of the cell if it is not null, otherwise defaults to false
 */
function getCellStrikethrough(textStyle: TextStyle): boolean {
    return textStyle.isStrikethrough() !== null ? textStyle.isStrikethrough() as boolean : false;
}

/**
 * Retrieves the date for a particular daily tab. For a daily tab, the date is located in the top left cell. Because Google Sheets stores 
 * our Date values in local time and the Google Apps Script API attempts to readjust these Date values assuming they are in UTC, we must 
 * re-add the UTC offset in order get back to local time (PDT)
 * 
 * @param cellData cell data for this particular tab
 * @returns Date object containing the date information for this daily tab
 */
function getDateOfDailyTab(cellData: CellData[][]): Date {
    const date: Date = cellData[DATE_ROW_INDEX][DATE_COL_INDEX].value;
    const utcHoursOffset = getUTCHoursOffset(date);
    date.setHours(date.getHours() + utcHoursOffset);

    return date;
}

/**
 * Determines if a given row is a valid event row. A row is considered a valid event row if the first two columns contain Date objects
 * and and the what column is not empty and the row has not been crossed out (strikethrough)
 * 
 * @param rowData data for this row
 * @returns boolean representing whether the given row is a valid event row
 */
function isValidEventRow(rowData: CellData[]): boolean {
    return rowData[START_TIME_COL_INDEX].value instanceof Date && rowData[END_TIME_COL_INDEX].value instanceof Date 
    && rowData[WHAT_COL_INDEX].value != "" && !isRowStrikethrough(rowData);
}

/**
 * Determines whether a given row has been crossed out (strikethrough) or not. A row is considered crossed out if all cells in the row that have
 * text have their strikethrough property set to true. The first Date objects in the first two columns are ignored as their strikethrough values
 * are always set as false according to the Google Apps Script api
 * 
 * @param rowData data for this row
 * @returns boolean representing whether the given row has been crossed out or not
 */
function isRowStrikethrough(rowData: CellData[]): boolean {
    // Filters out all cells without any values
    // Need to skip the time columns because their strikethrough values are incorrectly returned by the TextStyle object
    const nonEmptyCells: CellData[] = rowData.filter((cellData, index) => cellData.value !== "" && index > END_TIME_COL_INDEX);

    // Extracts only the strikethrough values from the CellData objects
    const strikethroughValues = nonEmptyCells.map((cellData) => cellData.strikethrough);

    // Incrementally ands all of the strikethrough values together
    return strikethroughValues.reduce((curr, next) => curr && next, true);
}

/**
 * Given the data for a row, construct and return a corresponding Row object
 * 
 * @param rowRange reference to the Range for this row so Metadata can be added at a later time if necessary
 * @param rowData the data for the row
 * @param currentDate Date object containing the current date
 * @returns Row object that holds all of the data for the given row
 */
function constructRow(rowRange: Range, rowData: CellData[], currentDate: Date): Row {
    const startTime: Date = rowData[START_TIME_COL_INDEX].value;
    const endTime: Date = rowData[END_TIME_COL_INDEX].value;

    return {
        metadata: getMetadata(rowRange),
        startTime: constructDate(currentDate, startTime),
        endTime: constructDate(currentDate, endTime),
        who: rowData[WHO_COL_INDEX].value,
        numAttendees: rowData[NUM_ATTENDEES_COL_INDEX].value,
        what: {value: rowData[WHAT_COL_INDEX].value, hyperlink: rowData[WHAT_COL_INDEX].linkUrl},
        where: {value: rowData[WHERE_COL_INDEX].value, hyperlink: rowData[WHERE_COL_INDEX].linkUrl},
        inCharge: {value: rowData[IN_CHARGE_COL_INDEX].value, hyperlink: rowData[IN_CHARGE_COL_INDEX].linkUrl},
        helpers: {value: rowData[HELPERS_COL_INDEX].value, hyperlink: rowData[HELPERS_COL_INDEX].linkUrl},
        foodLead: {value: rowData[FOOD_LEAD_COL_INDEX].value, hyperlink: rowData[FOOD_LEAD_COL_INDEX].linkUrl},
        childcare: {value: rowData[CHILDCARE_COL_INDEX].value, hyperlink: rowData[CHILDCARE_COL_INDEX].linkUrl},
        notes: {value: rowData[NOTES_COL_INDEX].value, hyperlink: rowData[NOTES_COL_INDEX].linkUrl}
    };
}

/**
 * Given two Date objects representing the current date and the current time, returns a Date object that combines the two.
 * The resulting Date object should have both the current date and time set appropriately
 * 
 * @param currentDate Date object containing the current date
 * @param currentTime Date object containing the current time
 * @returns Date object containing the current date and time
 */
function constructDate(currentDate: Date, currentTime: Date): Date {
    const timezoneOffset: number = getUTCHoursOffset(currentTime);
    const combinedDate = new Date();

    // First set the time in case adding the timezoneOffset causes the date to rollover
    combinedDate.setHours(currentTime.getHours() + timezoneOffset);
    combinedDate.setMinutes(currentTime.getMinutes());
    combinedDate.setSeconds(currentTime.getSeconds());
    combinedDate.setMilliseconds(currentTime.getMilliseconds());

    // Date must be set after the hours are set in case adding the timezoneOffset causes the date to rollover and increment
    combinedDate.setMonth(currentDate.getMonth());
    combinedDate.setDate(currentDate.getDate());
    combinedDate.setFullYear(currentDate.getFullYear());

    return combinedDate;
}

/**
 * Retrieves the offset from UTC time in hours
 * 
 * @param date Date object to retrieve the offset from UTC time from
 * @returns offset from UTC time in hours
 */
function getUTCHoursOffset(date: Date): number {
    return date.getTimezoneOffset() / MIN_IN_HOUR;
}
