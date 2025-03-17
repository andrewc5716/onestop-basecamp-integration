import { TabNotFoundError } from "./error/tabNotFoundError";
import { getMetadata } from "./row";

// RegEx pattern used to identify daily tabs
const DAILY_TAB_REGEX_PATTERN: RegExp = /^(MON|TUE|WED|THU|FRI|SAT|SUN) ([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])$/;

// Column indices for event rows
const DATE_ROW_INDEX: number = 0;
const DATE_COL_INDEX: number = 0;
const START_TIME_COL_INDEX: number = 0;
const END_TIME_COL_INDEX: number = 1;
const DOMAIN_COL_INDEX: number = 2;
const WHO_COL_INDEX: number = 3;
const NUM_ATTENDEES_COL_INDEX: number = 4;
const WHAT_COL_INDEX: number = 5;
const WHERE_COL_INDEX: number = 6;
const IN_CHARGE_COL_INDEX: number = 7;
const HELPERS_COL_INDEX: number = 8;
const NOTES_COL_INDEX: number = 9;

// Number of minutes in an hour
const MIN_IN_HOUR: number = 60;

interface CellData {
    readonly value: any,
    readonly richTextValue: RichTextValue,
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
    const dailyActiveTabsTodayOrInFuture: Sheet[] = getActiveDailyTabsTodayOrInFuture(dailyActiveTabs);
    // Fetches all event rows from all of the daily active tabs
    const eventRows: Row[] = dailyActiveTabsTodayOrInFuture.flatMap((dailyActiveTab) => getRowsWithEvents(dailyActiveTab));
    
    Logger.log(`Found ${eventRows.length} active rows from the spreadsheet...`)
    return eventRows;
}

/**
 * Fetches all of the tabs of the active spreadsheet
 *
 * @returns an array of spreadsheet tabs
 */
function getAllSpreadsheetTabs(): Sheet[] {
    const spreadsheet: Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet.getSheets();
}

/**
 * Fetches all of the active, non-hidden, daily tabs from an array of spreadsheet tabs
 * 
 * @param spreadsheetTabs array of spreadsheet tabs to search through
 * @returns array of active daily tabs
 */
function getActiveDailyTabs(spreadsheetTabs: Sheet[]): Sheet[] {
    const dailyActiveTabs: Sheet[] = [];
    for(const tab of spreadsheetTabs) {
        if(isActiveDailyTab(tab)) {
            dailyActiveTabs.push(tab);
        }
    }

    return dailyActiveTabs;
}

function getActiveDailyTabsTodayOrInFuture(spreadsheetTabs: Sheet[]): Sheet[] {
    return spreadsheetTabs.filter((tab) => {
        const dataRange: Range = tab.getDataRange();
        const cellData: CellData[][] = getCellData(dataRange);
        const tabDate: Date = getDateOfDailyTab(cellData);

        const currentDate: Date = new Date();
        // Set the time of the today's date to the start of the day
        currentDate.setHours(0, 0, 0, 0);

        return tabDate.getTime() >= currentDate.getTime();
    });
}

/**
 * Fetches the rows from a spreadsheet tab that correspond to an actual event on the Onestop
 * 
 * @param spreadsheetTab spreadsheet tab to search through
 * @returns an array of Row objects
 */
function getRowsWithEvents(spreadsheetTab: Sheet): Row[] {
    const dataRange: Range = spreadsheetTab.getDataRange();
    const cellData: CellData[][] = getCellData(dataRange);
    const currentDate: Date = getDateOfDailyTab(cellData);

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
        cellData[i] = getColumnData(numCols, cellRichTextData[i], cellValues[i]);
    }

    return cellData;
}

/**
 * Helper function for the getCellData function that given a row, returns the column data for that particular row
 * 
 * @param numCols number of columns in the cell data matrix
 * @param cellRichTextData rich text data that is to be used to fetch the potential hyperlink urls for cells in this row
 * @param cellValues actual data values that is to be used to populate the cell data matrix
 */
function getColumnData(numCols: number, cellRichTextData: RichTextValue[], cellValues: any[]): CellData[] {
    const columnData: CellData[] = [];

    for(let j = 0; j < numCols; j++) {
        const newColumnData: CellData = {
            value: cellValues[j],
            richTextValue: cellRichTextData[j],
        };
        columnData.push(newColumnData);
    }

    return columnData;
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
 * Determines whether a given row has been crossed out (strikethrough) or not. A row is considered crossed out if the WHAT cell has been crossed out
 * 
 * @param rowData data for this row
 * @returns boolean representing whether the given row has been crossed out or not
 */
function isRowStrikethrough(rowData: CellData[]): boolean {
    const whatCell: CellData = rowData[WHAT_COL_INDEX];
    const whatCellRuns: RichTextValue[] = whatCell.richTextValue.getRuns();
    // Incrementally ands all of the strikethrough values together to determine if the entire cell has strikethrough
    return whatCellRuns.some((run) => run.getTextStyle().isStrikethrough());
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
        date: currentDate,
        metadata: getMetadata(rowRange),
        startTime: constructDate(currentDate, startTime),
        endTime: constructDate(currentDate, endTime),
        domain: rowData[DOMAIN_COL_INDEX].value,
        who: rowData[WHO_COL_INDEX].value,
        numAttendees: rowData[NUM_ATTENDEES_COL_INDEX].value,
        what: constructText(rowData[WHAT_COL_INDEX]),
        where: constructText(rowData[WHERE_COL_INDEX]),
        inCharge: constructText(rowData[IN_CHARGE_COL_INDEX]),
        helpers: constructText(rowData[HELPERS_COL_INDEX]),
        notes: constructText(rowData[NOTES_COL_INDEX]),
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

function constructText(cellData: CellData): Text {
    const runs: RichTextValue[] = cellData.richTextValue.getRuns();
    const tokens: TextData[] = runs.map((run) => ({
        value: run.getText(),
        hyperlink: run.getLinkUrl(),
        strikethrough: run.getTextStyle().isStrikethrough() ?? false,
    }));

    return {
        value: cellData.value,
        tokens: tokens,
    };
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

/**
 * Retrieves a tab by name from the spreadsheet. Throws a TabNotFoundError if the tab cannot be found
 * 
 * @param tabName the name of tab to fetch
 * @returns Sheet object representing the tab to retrieve
 */
function getTab(tabName: string): Sheet {
    const tabs: Sheet[] = getAllSpreadsheetTabs();
    for(const tab of tabs) {
        const currentTabName: string = tab.getName();
        if(currentTabName === tabName) {
            return tab;
        }
    }

    throw new TabNotFoundError(`No ${tabName} tab found`);
}

/**
 * Returns the cell values for a given Google Sheets tab
 * 
 * @param tabName the name of the tab
 * @returns values for the cells that contain data for the given sheet
 */
export function getCellValues(tabName: string): any[][] {
    const tab: Sheet = getTab(tabName);
    const dataRange: Range = tab.getDataRange();
    const cellValues: any[][] = dataRange.getValues();

    return cellValues;
}
