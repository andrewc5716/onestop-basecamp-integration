import { GROUPS_MAP } from "./groups";
import { MEMBER_MAP } from "./members";
import { removeFilters } from "./filter";
import { normalizePersonName } from "./people";
import { ALIASES_MAP } from "./aliases";
import { isDailyTab } from "./scan";

const NEW_LINE_DELIM: string = "\n";
const COLON_DELIM: string = ":";
const COMMA_DELIMITER: string = ",";
const STAFF_REGEX: RegExp = /\bstaff\b/gi;

// Constants for onChange functionality
const TRIGGER_HANDLER_FUNCTION_NAME: string = 'onSpreadsheetChange';
const CHANGE_TYPE_INSERT_ROW: string = 'INSERT_ROW';
const IN_CHARGE_COLUMN_LETTER: string = 'H';
const HELPERS_COLUMN_LETTER: string = 'I';
const VALIDATION_LEAD_COLUMN_INDEX: number = 12; // Column L (1-indexed)
const VALIDATION_HELPER_COLUMN_INDEX: number = 13; // Column M (1-indexed)
const VALIDATE_LEAD_FUNCTION_NAME: string = 'validateLeadCellText';
const VALIDATE_HELPER_FUNCTION_NAME: string = 'validateHelperCellText';

/**
 * Sets up the onChange trigger for the spreadsheet to automatically add validation 
 * formulas when new rows are added to daily tabs. Replaces any existing trigger with the same name.
 */
export function setupOnChangeTrigger(): void {
    const sheet: Spreadsheet = SpreadsheetApp.getActive();
    
    // Get all existing triggers and delete any with the same handler function name
    const triggers: Trigger[] = ScriptApp.getProjectTriggers();
    triggers.forEach((trigger: Trigger) => {
        if (trigger.getHandlerFunction() === TRIGGER_HANDLER_FUNCTION_NAME) {
            ScriptApp.deleteTrigger(trigger);
            Logger.log('Deleted existing onChange trigger');
        }
    });
    
    // Create new onChange trigger
    ScriptApp.newTrigger(TRIGGER_HANDLER_FUNCTION_NAME)
        .forSpreadsheet(sheet)
        .onChange()
        .create();
    
    Logger.log('onChange trigger has been created successfully');
}

/**
 * Handles spreadsheet change events, specifically when new rows are added to daily tabs.
 * Automatically adds validation formulas to columns L and M for new rows.
 * 
 * @param e The change event object from Google Sheets
 */
export function onSpreadsheetChange(e: SheetsOnChange): void {
    try {
        // Only process INSERT_ROW events
        if (e.changeType !== CHANGE_TYPE_INSERT_ROW) {
            return;
        }
        
        const sheet: Sheet = SpreadsheetApp.getActiveSheet();
        
        if (!isDailyTab(sheet)) {
            return;
        }
        
        Logger.log(`New row inserted in daily tab: ${sheet.getName()}`);
        processInsertedRows(e.source, sheet);
        
    } catch (error) {
        Logger.log(`Error in onSpreadsheetChange: ${error}`);
    }
}

/**
 * Processes inserted rows by getting the active range and adding validation formulas to each new row
 * 
 * @param spreadsheet The spreadsheet source from the change event
 * @param sheet The sheet where rows were inserted
 */
function processInsertedRows(spreadsheet: Spreadsheet, sheet: Sheet): void {
    const activeRange: Range | null = spreadsheet.getActiveRange();
    if (!activeRange) {
        Logger.log('No active range found, skipping validation formula addition');
        return;
    }
    
    const insertedRowStart: number = activeRange.getRow();
    const numInsertedRows: number = activeRange.getNumRows();
    
    for (let i = 0; i < numInsertedRows; i++) {
        const rowNumber: number = insertedRowStart + i;
        addValidationFormulas(sheet, rowNumber);
    }
}

/**
 * Adds validation formulas to columns L and M for a specific row
 * 
 * @param sheet The sheet to add formulas to
 * @param rowNumber The row number to add formulas to (1-indexed)
 */
function addValidationFormulas(sheet: Sheet, rowNumber: number): void {
    try {
        setupLeadValidationCell(sheet, rowNumber);
        setupHelperValidationCell(sheet, rowNumber);
    } catch (error) {
        Logger.log(`Error adding validation formulas to row ${rowNumber}: ${error}`);
    }
}

function setupLeadValidationCell(sheet: Sheet, rowNumber: number): void {
    const leadValidationCell = sheet.getRange(rowNumber, VALIDATION_LEAD_COLUMN_INDEX);
    leadValidationCell.setFormula(`=${VALIDATE_LEAD_FUNCTION_NAME}(${IN_CHARGE_COLUMN_LETTER}${rowNumber})`);
}

function setupHelperValidationCell(sheet: Sheet, rowNumber: number): void {
    const helperValidationCell = sheet.getRange(rowNumber, VALIDATION_HELPER_COLUMN_INDEX);
    helperValidationCell.setFormula(`=${VALIDATE_HELPER_FUNCTION_NAME}(${HELPERS_COLUMN_LETTER}${rowNumber})`);
}


export function validateLeadCellText(leadCellText: string): string {
    const helperLines: string[] = leadCellText.split(NEW_LINE_DELIM);

    let invalidLeadTokens: string[] = [];

    helperLines.forEach((helperLine) => {
        invalidLeadTokens = [...invalidLeadTokens, ...getInvalidLeadTokens(helperLine)]
    });

    if(invalidLeadTokens.length > 0) {
        return generateValidationMessage(invalidLeadTokens);

    } else {
        return "";
    }
}

export function validateHelperCellText(helperCellText: string): string {
    const helperLines: string[] = helperCellText.split(NEW_LINE_DELIM);

    let invalidHelperTokens: string[] = [];

    helperLines.forEach((helperLine) => {
        invalidHelperTokens = [...invalidHelperTokens, ...getInvalidHelperTokens(helperLine)]
    });

    if(invalidHelperTokens.length > 0) {
        return generateValidationMessage(invalidHelperTokens);

    } else {
        return "";
    }
}

function generateValidationMessage(invalidHelperTokens: string[]): string {
    return `Invalid identifier(s): ${invalidHelperTokens.join(', ')}`
}

function getInvalidLeadTokens(leadLine: string): string[] {
    const leadList: string = removeRoleText(leadLine);
    const leads: string[] = leadList.split(COMMA_DELIMITER);

    const invalidLeadTokens: string[] = [];

    leads.forEach((leadToken) => {
        const trimmedLeadToken = leadToken.trim()
        if(!isLeadTokenValid(trimmedLeadToken)) {
            invalidLeadTokens.push(trimmedLeadToken);
        }
    })

    return invalidLeadTokens;
}

function getInvalidHelperTokens(helperLine: string): string[] {
    const helperList: string = removeRoleText(helperLine);
    const helpers: string[] = helperList.split(COMMA_DELIMITER);

    const invalidHelperTokens: string[] = [];

    helpers.forEach((helperToken) => {
        if(!isHelperTokenValid(helperToken)) {
            invalidHelperTokens.push(helperToken.trim());
        }
    })

    return invalidHelperTokens;
}

function removeRoleText(line: string): string {
    const colonIndex = line.indexOf(COLON_DELIM);
    if(colonIndex !== -1) {
        return line.substring(colonIndex + 1).trim();
    }
    return line;
}

function isHelperTokenValid(helperTokenWithFilters: string): boolean {
    if(helperTokenWithFilters === "") {
        return true;
    }
    const { stringWithoutFilters: helperWithoutFilters } = removeFilters(helperTokenWithFilters);
    const normalizedHelper: string = normalizePersonName(helperWithoutFilters)

    if(GROUPS_MAP.hasOwnProperty(normalizedHelper)) {
        return true;
    } else if(ALIASES_MAP.hasOwnProperty(normalizedHelper)) {
        return true;
    } else if(MEMBER_MAP.hasOwnProperty(normalizePersonName(normalizedHelper))) {
        return true;
    }
    return false;
}

function isLeadTokenValid(leadToken: string): boolean {
    const normalizedLeadToken: string = normalizePersonName(leadToken);
    if(normalizedLeadToken === "") {
        return true;
    } else if(ALIASES_MAP.hasOwnProperty(normalizedLeadToken)) {
        return true;
    } else if(MEMBER_MAP.hasOwnProperty(normalizePersonName(normalizedLeadToken))) {
        return true;
    }
    return false;
}