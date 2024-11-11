import { TabNotFoundError } from "./error/tabNotFoundError";
import { getScriptProperty, setScriptProperty } from "./propertiesService";
import { getAllSpreadsheetTabs } from "./scan";

const MEMBERS_TAB_NAME: string = "Members";
const COUPLES_TAB_NAME: string = "Couples";
const NAME_COLUMN_INDEX: number = 0;
const GENDER_COLUMN_INDEX: number = 1;
const MARRIED_COLUMN_INDEX: number = 2;
const PARENT_COLUMN_INDEX: number = 3;
const CLASS_COLUMN_INDEX: number = 4;
const ALTERNATE_NAMES_COLUMN_INDEX: number = 5;
const HUSBAND_COLUMN_INDEX: number = 0;
const WIFE_COLUMN_INDEX: number = 1;
const COUPLES_ALIASES_COLUMN_INDEX: number = 2;
const COMMA_DELIMITER: string = ",";
const MEMBER_MAP_KEY: string = "MEMBER_MAP";
const ALIASES_MAP_KEY: string = "ALIASES_MAP";


export const MEMBER_MAP: MemberMap = loadMapFromScriptProperties(MEMBER_MAP_KEY) as MemberMap;
export const ALIASES_MAP: AliasMap = loadMapFromScriptProperties(ALIASES_MAP_KEY) as AliasMap;

export function loadMembersFromOnestopIntoScriptProperties(): void {
    const { memberMap: memberMap, alternateNamesMap: alternateNamesMap } = loadMembersFromOnestop();
    const coupleAliases: AliasMap = loadCouplesFromOnestop();
    const combinedAliases: AliasMap = mergeAliasMaps(alternateNamesMap, coupleAliases);

    setScriptProperty(MEMBER_MAP_KEY, JSON.stringify(memberMap));
    setScriptProperty(ALIASES_MAP_KEY, JSON.stringify(combinedAliases));
}

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

function loadMembersFromOnestop(): { memberMap: MemberMap, alternateNamesMap: AliasMap } {
    const membersTab: Sheet = getTab(MEMBERS_TAB_NAME);
    const dataRange: Range = membersTab.getDataRange();
    const cellValues: any[][] = dataRange.getValues();

    const memberMap: MemberMap = {};
    const alternateNamesMap: AliasMap = {};

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];
        const currentMember: Member = constructMember(rowValues);
        memberMap[currentMember.name] = currentMember;

        const alternateNames: string[] = getAliasList(rowValues, ALTERNATE_NAMES_COLUMN_INDEX);
        // Maps a person's alternate name to their actual name
        alternateNames.forEach(alternateName => {
            if(alternateNamesMap.hasOwnProperty(alternateName)) {
                alternateNamesMap[alternateName].push(currentMember.name);
            } else {
                alternateNamesMap[alternateName] = [currentMember.name];
            }
        });
    }

    return { memberMap: memberMap, alternateNamesMap: alternateNamesMap };
}

function constructMember(rowValues: any): Member {
    return {
        name: rowValues[NAME_COLUMN_INDEX],
        gender: rowValues[GENDER_COLUMN_INDEX],
        parent: rowValues[PARENT_COLUMN_INDEX],
        married: rowValues[MARRIED_COLUMN_INDEX],
        class: rowValues[CLASS_COLUMN_INDEX]
    };
}

function getAliasList(rowValues: any, index: number): string[] {
    const aliasList: string = rowValues[index];
    return aliasList.split(COMMA_DELIMITER).map(alias => alias.trim());
}

function loadCouplesFromOnestop(): AliasMap {
    const couplesTab: Sheet = getTab(COUPLES_TAB_NAME);
    const dataRange: Range = couplesTab.getDataRange();
    const cellValues: any[][] = dataRange.getValues();

    const aliasMap: AliasMap = {};

    // Start at row 1 to skip the table header row
    for(let i = 1; i < cellValues.length; i++) {
        const rowValues: any[] = cellValues[i];

        const coupleAliasesList: string[] = getAliasList(rowValues, COUPLES_ALIASES_COLUMN_INDEX);
        const husband: string = rowValues[HUSBAND_COLUMN_INDEX];
        const wife: string = rowValues[WIFE_COLUMN_INDEX];
        coupleAliasesList.forEach(coupleAlias => aliasMap[coupleAlias] = [husband, wife]);
    }

    return aliasMap;
}

function mergeAliasMaps(firstAliasMap: AliasMap, secondAliasMap: AliasMap): AliasMap {
    const finalAliasMap: AliasMap = firstAliasMap;

    const aliases: string[] = Object.keys(secondAliasMap);
    for(const alias of aliases) {
        if(finalAliasMap.hasOwnProperty(alias)) {
            finalAliasMap[alias].concat(secondAliasMap[alias]);
        } else {
            finalAliasMap[alias] = secondAliasMap[alias];
        }
    }

    return finalAliasMap;
}

function loadMapFromScriptProperties(key: string): Object {
    const map: string | null = getScriptProperty(key);
    return map ? JSON.parse(map) : {};
}
