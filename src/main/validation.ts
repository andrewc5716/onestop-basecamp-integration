import { GROUPS_MAP } from "./groups";
import { ALIASES_MAP, MEMBER_MAP } from "./members";
import { removeFilters } from "./filter";
import { normalizePersonName } from "./people";

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
    const leads: string[] = leadLine.split(COMMA_DELIMITER);

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
    const helperList: string = removeRoleTextFromHelperLine(helperLine);
    const helpers: string[] = helperList.split(COMMA_DELIMITER);

    const invalidHelperTokens: string[] = [];

    helpers.forEach((helperToken) => {
        if(!isHelperTokenValid(helperToken)) {
            invalidHelperTokens.push(helperToken.trim());
        }
    })

    return invalidHelperTokens;
}

function removeRoleTextFromHelperLine(helperLine: string): string {
    const colonIndex = helperLine.indexOf(COLON_DELIM);
    if(colonIndex !== -1) {
        return helperLine.substring(colonIndex + 1).trim();
    }
    return helperLine;
}

function isHelperTokenValid(helperTokenWithFilters: string): boolean {
    if(helperTokenWithFilters === "") {
        return true;
    }
    const { stringWithoutFilters: helperWithoutFilters } = removeFilters(helperTokenWithFilters);
    const normalizedHelper: string = normalizeHelper(helperWithoutFilters)

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

    if(leadToken === "") {
        return true;
    } else if(ALIASES_MAP.hasOwnProperty(leadToken)) {
        return true;
    } else if(MEMBER_MAP.hasOwnProperty(normalizePersonName(leadToken))) {
        return true;
    }
    return false;
}

function normalizeHelper(helper: string): string {
    // todo: make the whole helper input lowercase; but need to make all the maps lowercase too then to make it work
    return helper.replace(STAFF_REGEX, '').trim();
}