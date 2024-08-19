type Range = GoogleAppsScript.Spreadsheet.Range;
type TextStyle = GoogleAppsScript.Spreadsheet.TextStyle;
type RichTextValue = GoogleAppsScript.Spreadsheet.RichTextValue;
const dailyTabPattern = /^(MON|TUE|WED|THU|FRI|SAT|SUN) ([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])$/;

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
        const tabName = tab.getName();

        if(!isTabHidden(tab) && isDailyTab(tabName)) {
            dailyActiveTabs.push(tab);
        }
    }

    return dailyActiveTabs;
}

export function getRowsToProcess(spreadsheetTab: Sheet): Row[] {
    const dataRange: Range = spreadsheetTab.getDataRange();
    const cellData = getCellData(dataRange);

    const rows: Row[] = [];
    for(let i = 0; i < cellData.length; i++) {
        const rowData: CellData[] = cellData[i];
        if (isValidEvent(rowData)) {
            const currentRow: Row = constructRow(rowData);
            rows.push(currentRow);
        }
    }

    return rows;
}

function isTabHidden(tab: Sheet): boolean {
    return tab.isSheetHidden();
}

function isDailyTab(tabName: string): boolean {
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
        for(let j = 0; j < numCols; j++) {
            const textStyle: TextStyle = cellRichTextData[i][j].getTextStyle();
            cellData[i][j] = {
                value: cellValues[i][j],
                linkUrl: cellRichTextData[i][j].getLinkUrl(),
                strikethrough: textStyle.isStrikethrough() !== null ? textStyle.isStrikethrough() as boolean : false,
            }
        }
    }

    return cellData;
}

function isValidEvent(rowData: CellData[]): boolean {
    // Strikethrough check only happens on the first cell in the row
    return rowData[0].value instanceof Date && rowData[1].value instanceof Date && !isStrikethrough(rowData);
}

function isStrikethrough(rowData: CellData[]): boolean {
    const strikethroughValues = rowData.map((cellData) => cellData.value !== "" && cellData.strikethrough);
    return strikethroughValues.reduce((curr, next) => curr || next, false);
}

function constructRow(rowData: CellData[]): Row {
    return {
        startTime: rowData[0].value,
        endTime: rowData[1].value,
        who: rowData[2].value,
        numAttendees: rowData[3].value,
        what: {value: rowData[4].value, hyperlink: rowData[4].linkUrl},
        where: {value: rowData[5].value, hyperlink: rowData[5].linkUrl},
        inCharge: {value: rowData[6].value, hyperlink: rowData[6].linkUrl},
        helpers: {value: rowData[7].value, hyperlink: rowData[7].linkUrl},
        foodLead: {value: rowData[8].value, hyperlink: rowData[8].linkUrl},
        childcare: {value: rowData[9].value, hyperlink: rowData[9].linkUrl},
        notes: {value: rowData[10].value, hyperlink: rowData[10].linkUrl}
    };
}
