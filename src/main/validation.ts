import { GROUPS_MAP } from "./groups";
import { ALIASES_MAP, MEMBER_MAP } from "./members";
import { removeFilters } from "./filter";
import { normalizePersonName } from "./people";

const NEW_LINE_DELIM: string = "\n";
const COLON_DELIM: string = ":";
const COMMA_DELIMITER: string = ",";
const STAFF_REGEX: RegExp = /\bstaff\b/gi;

export function isHelperCellValid(helperCellText: string): boolean {
    const helperLines: string[] = helperCellText.split(NEW_LINE_DELIM);
    return helperLines.every(isHelperLineValid);
}

function isHelperLineValid(helperLine: string): boolean {
    const helperList: string = removeRoleTextFromHelperLine(helperLine);
    const helpers: string[] = helperList.split(COMMA_DELIMITER);
    return helpers.every(isHelperTokenValid);
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

function normalizeHelper(helper: string): string {
    // todo: make the whole helper input lowercase; but need to make all the maps lowercase too then to make it work
    return helper.replace(STAFF_REGEX, '').trim();
}