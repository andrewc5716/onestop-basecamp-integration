import { GROUPS_MAP } from "./groups";
import { MEMBER_MAP } from "./members";
import { removeFilters } from "./filter";
import { normalizePersonName } from "./people";
import { ALIASES_MAP } from "./aliases";

const NEW_LINE_DELIM: string = "\n";
const COLON_DELIM: string = ":";
const COMMA_DELIMITER: string = ",";
const STAFF_REGEX: RegExp = /\bstaff\b/gi;

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