import { mergeAliasMaps } from "./aliases";
import { PersonAliasClashError } from "./error/personAliasClashError";
import { normalizePersonName } from "./people";
import { loadMapFromScriptProperties, setScriptProperty } from "./propertiesService";
import { getCellValues } from "./scan";

const MEMBERS_TAB_NAME: string = "Members";
const COUPLES_TAB_NAME: string = "Couples";
const NAME_COLUMN_INDEX: number = 28;
const GENDER_COLUMN_INDEX: number = 4;
const MARRIED_COLUMN_INDEX: number = 6;
const PARENT_COLUMN_INDEX: number = 7;
const CLASS_COLUMN_INDEX: number = 8;
const ALTERNATE_NAMES_COLUMN_INDEX: number = 29;
const BASECAMP_ID_COLUMN_INDEX: number = 30;
const HUSBAND_COLUMN_INDEX: number = 0;
const WIFE_COLUMN_INDEX: number = 1;
const COUPLES_ALIASES_COLUMN_INDEX: number = 2;
const COMMA_DELIMITER: string = ",";
const MEMBER_MAP_KEY: string = "MEMBER_MAP";

export const MEMBER_MAP: MemberMap = loadMapFromScriptProperties(MEMBER_MAP_KEY) as MemberMap;

/**
 * Loads data from the Members and Couples tables on the Onestop into the script properties
 */
export function loadMembersFromOnestopIntoScriptProperties(): AliasMap {
    const { memberMap: memberMap, alternateNamesMap: alternateNamesMap } = loadMembersFromOnestop();
    const coupleAliases: AliasMap = loadCouplesFromOnestop();
    const combinedAliases: AliasMap = mergeAliasMaps(alternateNamesMap, coupleAliases);

    setScriptProperty(MEMBER_MAP_KEY, JSON.stringify(memberMap));

    return combinedAliases;
}

function loadMembersFromOnestop(): { memberMap: MemberMap, alternateNamesMap: AliasMap } {
    const cellValues: any[][] = getCellValues(MEMBERS_TAB_NAME);

    const memberMap: MemberMap = {};
    let alternateNamesMap: AliasMap = {};

    // Start at row 3 to skip the table header row
    for(let i = 3; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];
        const currentMember: Member = constructMember(rowValues);
        memberMap[currentMember.name] = currentMember;

        const alternateNames: string[] = getAliasList(rowValues, ALTERNATE_NAMES_COLUMN_INDEX);
        alternateNamesMap = addAlternateNamesToMap(alternateNamesMap, alternateNames, currentMember);
    }

    return { memberMap: memberMap, alternateNamesMap: alternateNamesMap };
}

function constructMember(rowValues: any): Member {
    return {
        name: normalizePersonName(rowValues[NAME_COLUMN_INDEX]),
        gender: getGender(rowValues[GENDER_COLUMN_INDEX]),
        married: rowValues[MARRIED_COLUMN_INDEX],
        parent: rowValues[PARENT_COLUMN_INDEX],
        class: rowValues[CLASS_COLUMN_INDEX],
        basecampId: rowValues[BASECAMP_ID_COLUMN_INDEX],
    };
}

function getGender(rowValue: any): string {
    return rowValue === "M" ? "Male" : "Female";
}

function getAliasList(rowValues: any, index: number): string[] {
    const aliasList: string = rowValues[index];
    return aliasList.split(COMMA_DELIMITER).map(alias => alias.trim()).filter(alias => alias !== "");
}

function addAlternateNamesToMap(alternateNamesMap: AliasMap, alternateNames: string[], currentMember: Member): AliasMap {
    // Maps a person's alternate name to their actual name
    for(const alternateName of alternateNames) {
        const normalizedAlternateName: string = alternateName.toLowerCase().trim();
        if(alternateNamesMap.hasOwnProperty(normalizedAlternateName)) {
            throw new PersonAliasClashError(`Multiple members have the alternate name ${normalizedAlternateName}`);
        } else {
            alternateNamesMap[normalizedAlternateName] = [currentMember.name];
        }
    }

    return alternateNamesMap;
}

function loadCouplesFromOnestop(): AliasMap {
    const cellValues: any[][] = getCellValues(COUPLES_TAB_NAME);
    const aliasMap: AliasMap = {};

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];

        const coupleAliasesList: string[] = getAliasList(rowValues, COUPLES_ALIASES_COLUMN_INDEX);
        const husband: string = normalizePersonName(rowValues[HUSBAND_COLUMN_INDEX]);
        const wife: string = normalizePersonName(rowValues[WIFE_COLUMN_INDEX]);
        coupleAliasesList.forEach(coupleAlias => aliasMap[coupleAlias.toLowerCase().trim()] = [husband, wife]);
    }

    return aliasMap;
}
