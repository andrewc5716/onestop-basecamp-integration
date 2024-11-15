// Mock PropertiesService and SpreadsheetApp must be imported and set before imported modules require these global objects
import { PropertiesService, SpreadsheetApp } from 'gasmask';
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;

import { getRandomlyGeneratedAliasMap, getRandomlyGeneratedAliasTable, getRandomlyGeneratedMemberMap, getRandomlyGeneratedMemberTable, getRandomlyGeneratedRange, getRandomlyGeneratedSheet, Mock } from './testUtils';
import { TabNotFoundError } from '../src/main/error/tabNotFoundError';

const NAME_COLUMN_INDEX: number = 0;
const GENDER_COLUMN_INDEX: number = 1;
const MARRIED_COLUMN_INDEX: number = 2;
const PARENT_COLUMN_INDEX: number = 3;
const CLASS_COLUMN_INDEX: number = 4;
const ALTERNATE_NAMES_COLUMN_INDEX: number = 5;

describe("MEMBER_MAP", () => {
    it("should return the member map from the script properties when it is present", () => {
        const memberMapMock: MemberMap = getRandomlyGeneratedMemberMap();

        jest.doMock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(() => JSON.stringify(memberMapMock)),
        }));
        
        // Import the MEMBER_MAP with the mocked propertiesService
        const { MEMBER_MAP } = require('../src/main/members');

        expect(MEMBER_MAP).toEqual(memberMapMock);
    });

    it("should return an empty map when there is no member map present in the script properties", () => {
        jest.doMock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(() => null),
        }));

        // Import the MEMBER_MAP with the mocked propertiesService
        const { MEMBER_MAP } = require('../src/main/members');

        expect(MEMBER_MAP).toStrictEqual({});
    });
});

describe("ALIASES_MAP", () => {
    it("should return the aliases map from the script properties when it is present", () => {
        const aliasesMapMock: AliasMap = getRandomlyGeneratedAliasMap();

        jest.doMock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(() => JSON.stringify(aliasesMapMock)),
        }));
        
        // Import the MEMBER_MAP with the mocked propertiesService
        const { ALIASES_MAP } = require('../src/main/members');

        expect(ALIASES_MAP).toEqual(aliasesMapMock);
    });

    it("should return an empty map when there is no aliases map present in the script properties", () => {
        jest.doMock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(() => null),
        }));

        // Import the MEMBER_MAP with the mocked propertiesService
        const { ALIASES_MAP } = require('../src/main/members');

        expect(ALIASES_MAP).toStrictEqual({});
    });
});

describe("loadMembersFromOnestopIntoScriptProperties", () => {
    it("should load the members and couples table from the onestop into the script properties when the members and couples table are present on the onestop", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(5, 1);
        const membersDataRangeMock: Range = getRandomlyGeneratedRange();
        membersDataRangeMock.getValues = jest.fn(() => membersDataValuesMock);
        const membersTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        membersTableSheetMock.getName = jest.fn(() => "Members");
        membersTableSheetMock.getDataRange = jest.fn(() => membersDataRangeMock);

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "memberName1";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "alias1,alias2";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "memberName2";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "alias3,alias4";
        membersDataValuesMock[3][NAME_COLUMN_INDEX] = "memberName3";
        membersDataValuesMock[3][ALTERNATE_NAMES_COLUMN_INDEX] = "alias5,alias6";
        membersDataValuesMock[4][NAME_COLUMN_INDEX] = "memberName4";
        membersDataValuesMock[4][ALTERNATE_NAMES_COLUMN_INDEX] = "alias7,alias8";
        membersDataValuesMock[5][NAME_COLUMN_INDEX] = "memberName5";
        membersDataValuesMock[5][ALTERNATE_NAMES_COLUMN_INDEX] = "alias9,alias10";
        
        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(2);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        couplesDataValuesMock[1] = ["memberName2", "memberName3", "coupleAlias1,coupleAlias2"];
        couplesDataValuesMock[2] = ["memberName4", "memberName5", "coupleAlias3,coupleAlias4"];

        const sheetsMock: Sheet[] = Array.from({length: 10}, getRandomlyGeneratedSheet);
        sheetsMock.push(membersTableSheetMock);
        sheetsMock.push(couplesTableSheetMock);
        jest.mock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => sheetsMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expectedMemberMap: MemberMap = {
            memberName1: {name: "memberName1", gender: membersDataValuesMock[1][GENDER_COLUMN_INDEX], married: membersDataValuesMock[1][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[1][PARENT_COLUMN_INDEX], class: membersDataValuesMock[1][CLASS_COLUMN_INDEX]},
            memberName2: {name: "memberName2", gender: membersDataValuesMock[2][GENDER_COLUMN_INDEX], married: membersDataValuesMock[2][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[2][PARENT_COLUMN_INDEX], class: membersDataValuesMock[2][CLASS_COLUMN_INDEX]},
            memberName3: {name: "memberName3", gender: membersDataValuesMock[3][GENDER_COLUMN_INDEX], married: membersDataValuesMock[3][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[3][PARENT_COLUMN_INDEX], class: membersDataValuesMock[3][CLASS_COLUMN_INDEX]},
            memberName4: {name: "memberName4", gender: membersDataValuesMock[4][GENDER_COLUMN_INDEX], married: membersDataValuesMock[4][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[4][PARENT_COLUMN_INDEX], class: membersDataValuesMock[4][CLASS_COLUMN_INDEX]},
            memberName5: {name: "memberName5", gender: membersDataValuesMock[5][GENDER_COLUMN_INDEX], married: membersDataValuesMock[5][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[5][PARENT_COLUMN_INDEX], class: membersDataValuesMock[5][CLASS_COLUMN_INDEX]},
        };

        const expectedAliasMap: AliasMap = {
            alias1: ["memberName1"],
            alias2: ["memberName1"],
            alias3: ["memberName2"],
            alias4: ["memberName2"],
            alias5: ["memberName3"],
            alias6: ["memberName3"],
            alias7: ["memberName4"],
            alias8: ["memberName4"],
            alias9: ["memberName5"],
            alias10: ["memberName5"],
            coupleAlias1: ["memberName2", "memberName3"],
            coupleAlias2: ["memberName2", "memberName3"],
            coupleAlias3: ["memberName4", "memberName5"],
            coupleAlias4: ["memberName4", "memberName5"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledTimes(2);
        expect(setScriptPropertyMock).toHaveBeenNthCalledWith(1, "MEMBER_MAP", JSON.stringify(expectedMemberMap));
        expect(setScriptPropertyMock).toHaveBeenNthCalledWith(2, "ALIASES_MAP", JSON.stringify(expectedAliasMap));
    });

    it("should throw a TabNotFoundError error when the Members tab does not exist on the onestop", () => {
        jest.doMock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => Array.from({length: 10}, getRandomlyGeneratedSheet)),
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');

        expect(() => loadMembersFromOnestopIntoScriptProperties()).toThrow(new TabNotFoundError("No Members tab found"));
    });

    it("should throw a TabNotFoundError error when the Couples tab does not exist on the onestop", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable();
        const membersDataRangeMock: Range = getRandomlyGeneratedRange();
        membersDataRangeMock.getValues = jest.fn(() => membersDataValuesMock);
        const membersTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        membersTableSheetMock.getName = jest.fn(() => "Members");
        membersTableSheetMock.getDataRange = jest.fn(() => membersDataRangeMock);

        const sheetsMock: Sheet[] = Array.from({length: 10}, getRandomlyGeneratedSheet);
        sheetsMock.push(membersTableSheetMock);
        jest.mock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => sheetsMock),
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');

        expect(() => loadMembersFromOnestopIntoScriptProperties()).toThrow(new TabNotFoundError("No Couples tab found"));
    });

    it("should load an empty object into script properties for the members map when the members table is empty", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(0);
        const membersDataRangeMock: Range = getRandomlyGeneratedRange();
        membersDataRangeMock.getValues = jest.fn(() => membersDataValuesMock);
        const membersTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        membersTableSheetMock.getName = jest.fn(() => "Members");
        membersTableSheetMock.getDataRange = jest.fn(() => membersDataRangeMock);

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(3);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        const sheetsMock: Sheet[] = Array.from({length: 10}, getRandomlyGeneratedSheet);
        sheetsMock.push(membersTableSheetMock);
        sheetsMock.push(couplesTableSheetMock);
        jest.mock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => sheetsMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        expect(setScriptPropertyMock).toHaveBeenCalledWith("MEMBER_MAP", "{}");
    });

    it("should load a object of just the member alternate names when the couples table is empty", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(2, 1);
        const membersDataRangeMock: Range = getRandomlyGeneratedRange();
        membersDataRangeMock.getValues = jest.fn(() => membersDataValuesMock);
        const membersTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        membersTableSheetMock.getName = jest.fn(() => "Members");
        membersTableSheetMock.getDataRange = jest.fn(() => membersDataRangeMock);

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "name1";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "alias1,alias2";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "name2";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "alias3,alias4";

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(0);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        const sheetsMock: Sheet[] = Array.from({length: 10}, getRandomlyGeneratedSheet);
        sheetsMock.push(membersTableSheetMock);
        sheetsMock.push(couplesTableSheetMock);
        jest.mock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => sheetsMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expected: AliasMap = {
            alias1: ["name1"],
            alias2: ["name1"],
            alias3: ["name2"],
            alias4: ["name2"],
        };
        expect(setScriptPropertyMock).toHaveBeenCalledWith("ALIASES_MAP", JSON.stringify(expected));
    });

    it("should map an alternate name to multiple people when multiple people share the same alternate name", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(2, 1);
        const membersDataRangeMock: Range = getRandomlyGeneratedRange();
        membersDataRangeMock.getValues = jest.fn(() => membersDataValuesMock);
        const membersTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        membersTableSheetMock.getName = jest.fn(() => "Members");
        membersTableSheetMock.getDataRange = jest.fn(() => membersDataRangeMock);

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "name1";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "alias1,alias2";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "name2";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "alias2,alias3";

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(0);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        const sheetsMock: Sheet[] = Array.from({length: 10}, getRandomlyGeneratedSheet);
        sheetsMock.push(membersTableSheetMock);
        sheetsMock.push(couplesTableSheetMock);
        jest.mock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => sheetsMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expected: AliasMap = {
            alias1: ["name1"],
            alias2: ["name1", "name2"],
            alias3: ["name2"],
        };
        expect(setScriptPropertyMock).toHaveBeenCalledWith("ALIASES_MAP", JSON.stringify(expected));
    });

    it("should map an alias to both a person and a couple when a person's alternate name is the same as a couple's alias", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(3, 1);
        const membersDataRangeMock: Range = getRandomlyGeneratedRange();
        membersDataRangeMock.getValues = jest.fn(() => membersDataValuesMock);
        const membersTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        membersTableSheetMock.getName = jest.fn(() => "Members");
        membersTableSheetMock.getDataRange = jest.fn(() => membersDataRangeMock);

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "memberName";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "alias1,alias2";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "husbandName";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "alias3,alias4";
        membersDataValuesMock[3][NAME_COLUMN_INDEX] = "wifeName";
        membersDataValuesMock[3][ALTERNATE_NAMES_COLUMN_INDEX] = "alias5,alias6";
        
        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(1);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        couplesDataValuesMock[1] = ["husbandName", "wifeName", "alias1"];

        const sheetsMock: Sheet[] = Array.from({length: 10}, getRandomlyGeneratedSheet);
        sheetsMock.push(membersTableSheetMock);
        sheetsMock.push(couplesTableSheetMock);
        jest.mock("../src/main/scan", () => ({
            getAllSpreadsheetTabs: jest.fn(() => sheetsMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            getScriptProperty: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expected: AliasMap = {
            alias1: ["memberName", "husbandName", "wifeName"],
            alias2: ["memberName"],
            alias3: ["husbandName"],
            alias4: ["husbandName"],
            alias5: ["wifeName"],
            alias6: ["wifeName"],
        };
        expect(setScriptPropertyMock).toHaveBeenCalledWith("ALIASES_MAP", JSON.stringify(expected));
    });
});