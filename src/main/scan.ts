type Range = GoogleAppsScript.Spreadsheet.Range;
type TextStyle = GoogleAppsScript.Spreadsheet.TextStyle;
type RichTextValue = GoogleAppsScript.Spreadsheet.RichTextValue;

const dailyTabPattern: RegExp = /^(MON|TUE|WED|THU|FRI|SAT|SUN) ([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])$/;
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
const MIN_IN_HOUR: number = 60;

interface CellData {
    readonly value: any,
    readonly linkUrl: string | null,
    readonly strikethrough: boolean
}

export function getAllSpreadsheetTabs(): Sheet[] {
    const spreadsheet: Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet.getSheets();
}

export function getActiveDailyTabs(spreadsheetTabs: Sheet[]): Sheet[] {
    const dailyActiveTabs: Sheet[] = [];
    for(const tab of spreadsheetTabs) {
        addDailyActiveTabs(tab, dailyActiveTabs);
    }

    return dailyActiveTabs;
}

export function getRowsToProcess(spreadsheetTab: Sheet): Row[] {
    const dataRange: Range = spreadsheetTab.getDataRange();
    const cellData = getCellData(dataRange);
    const currentDate = getDate(cellData);

    const rows: Row[] = [];
    for(let i = 0; i < cellData.length; i++) {
        const rowData: CellData[] = cellData[i];
        processRow(rowData, rows, currentDate);
    }

    return rows;
}

function addDailyActiveTabs(tab: Sheet, dailyActiveTabs: Sheet[]): void {
    if(!isTabHidden(tab) && isDailyTab(tab)) {
        dailyActiveTabs.push(tab);
    }
}

function isTabHidden(tab: Sheet): boolean {
    return tab.isSheetHidden();
}

function isDailyTab(tab: Sheet): boolean {
    const tabName: string = tab.getName();
    const matchResult: RegExpMatchArray | null = tabName.match(dailyTabPattern);
    // null indicates that the tab name did not match the regex pattern for the daily tab
    return matchResult !== null;
}

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

function getCellStrikethrough(textStyle: TextStyle): boolean {
    return textStyle.isStrikethrough() !== null ? textStyle.isStrikethrough() as boolean : false;
}

function getDate(cellData: CellData[][]): Date {
    const date: Date = cellData[DATE_ROW_INDEX][DATE_COL_INDEX].value;
    const utcHoursOffset = getUTCHoursOffset(date);
    date.setHours(date.getHours() + utcHoursOffset);

    return date;
}

function processRow(rowData: CellData[], rows: Row[], currentDate: Date): void {
    if (isValidRow(rowData)) {
        const currentRow: Row = constructRow(rowData, currentDate);
        rows.push(currentRow);
    }
}

function isValidRow(rowData: CellData[]): boolean {
    return rowData[START_TIME_COL_INDEX].value instanceof Date && rowData[END_TIME_COL_INDEX].value instanceof Date && !isRowStrikethrough(rowData);
}

function isRowStrikethrough(rowData: CellData[]): boolean {
    // Need to skip the time columns because their strikethrough values are incorrectly returned by the TextStyle object
    const nonEmptyCells: CellData[] = rowData.filter((cellData, index) => cellData.value !== "" && index > END_TIME_COL_INDEX);
    const strikethroughValues = nonEmptyCells.map((cellData) => cellData.strikethrough);
    return strikethroughValues.reduce((curr, next) => curr && next, true);
}

function constructRow(rowData: CellData[], currentDate: Date): Row {
    const startTime: Date = rowData[START_TIME_COL_INDEX].value;
    const endTime: Date = rowData[END_TIME_COL_INDEX].value;

    return {
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

function constructDate(currentDate: Date, currentTime: Date): Date {
    const timezoneOffset: number = getUTCHoursOffset(currentTime);
    const combinedDate = new Date();
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

function getUTCHoursOffset(date: Date): number {
    return date.getTimezoneOffset() / MIN_IN_HOUR;
}
