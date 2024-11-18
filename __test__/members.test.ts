// Mock PropertiesService and SpreadsheetApp must be imported and set before imported modules require these global objects
import { Logger, PropertiesService, SpreadsheetApp } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;

import { getRandomlyGeneratedAliasMap, getRandomlyGeneratedAliasTable, getRandomlyGeneratedMemberMap, getRandomlyGeneratedMemberTable, getRandomlyGeneratedRange, getRandomlyGeneratedSheet, Mock } from './testUtils';

const NAME_COLUMN_INDEX: number = 0;
const GENDER_COLUMN_INDEX: number = 1;
const MARRIED_COLUMN_INDEX: number = 2;
const PARENT_COLUMN_INDEX: number = 3;
const CLASS_COLUMN_INDEX: number = 4;
const ALTERNATE_NAMES_COLUMN_INDEX: number = 5;

describe("MEMBER_MAP", () => {
    it("should return the member map from the script properties when it is present", () => {
        const memberMapMock: MemberMap = getRandomlyGeneratedMemberMap();

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => memberMapMock),
        }));
        
        // Import the MEMBER_MAP with the mocked propertiesService
        const { MEMBER_MAP } = require('../src/main/members');

        expect(MEMBER_MAP).toEqual(memberMapMock);
    });

    it("should return an empty map when there is no member map present in the script properties", () => {
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        // Import the MEMBER_MAP with the mocked propertiesService
        const { MEMBER_MAP } = require('../src/main/members');

        expect(MEMBER_MAP).toStrictEqual({});
    });
});

describe("ALIASES_MAP", () => {
    it("should return the aliases map from the script properties when it is present", () => {
        const aliasesMapMock: AliasMap = getRandomlyGeneratedAliasMap();

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => aliasesMapMock),
        }));
        
        // Import the MEMBER_MAP with the mocked propertiesService
        const { ALIASES_MAP } = require('../src/main/members');

        expect(ALIASES_MAP).toEqual(aliasesMapMock);
    });

    it("should return an empty map when there is no aliases map present in the script properties", () => {
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
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

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Doe";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John D";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "James Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "James,James B";
        membersDataValuesMock[3][NAME_COLUMN_INDEX] = "Mary Brown";
        membersDataValuesMock[3][ALTERNATE_NAMES_COLUMN_INDEX] = "Mary,Mary B";
        membersDataValuesMock[4][NAME_COLUMN_INDEX] = "Robert White";
        membersDataValuesMock[4][ALTERNATE_NAMES_COLUMN_INDEX] = "Robert,Robert W";
        membersDataValuesMock[5][NAME_COLUMN_INDEX] = "Emily White";
        membersDataValuesMock[5][ALTERNATE_NAMES_COLUMN_INDEX] = "Emily,Emily W";
        
        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(2);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        couplesDataValuesMock[1] = ["James Brown", "Mary Brown", "James/Mary,Browns"];
        couplesDataValuesMock[2] = ["Robert White", "Emily White", "Robert/Emily,Whites"];

        jest.mock("../src/main/scan", () => ({
            getTab: jest.fn()
            .mockReturnValueOnce(membersTableSheetMock)
            .mockReturnValueOnce(couplesTableSheetMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expectedMemberMap: MemberMap = {
            "John Doe": {name: "John Doe", gender: membersDataValuesMock[1][GENDER_COLUMN_INDEX], married: membersDataValuesMock[1][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[1][PARENT_COLUMN_INDEX], class: membersDataValuesMock[1][CLASS_COLUMN_INDEX]},
            "James Brown": {name: "James Brown", gender: membersDataValuesMock[2][GENDER_COLUMN_INDEX], married: membersDataValuesMock[2][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[2][PARENT_COLUMN_INDEX], class: membersDataValuesMock[2][CLASS_COLUMN_INDEX]},
            "Mary Brown": {name: "Mary Brown", gender: membersDataValuesMock[3][GENDER_COLUMN_INDEX], married: membersDataValuesMock[3][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[3][PARENT_COLUMN_INDEX], class: membersDataValuesMock[3][CLASS_COLUMN_INDEX]},
            "Robert White": {name: "Robert White", gender: membersDataValuesMock[4][GENDER_COLUMN_INDEX], married: membersDataValuesMock[4][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[4][PARENT_COLUMN_INDEX], class: membersDataValuesMock[4][CLASS_COLUMN_INDEX]},
            "Emily White": {name: "Emily White", gender: membersDataValuesMock[5][GENDER_COLUMN_INDEX], married: membersDataValuesMock[5][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[5][PARENT_COLUMN_INDEX], class: membersDataValuesMock[5][CLASS_COLUMN_INDEX]},
        };

        const expectedAliasMap: AliasMap = {
            "John": ["John Doe"],
            "John D": ["John Doe"],
            "James": ["James Brown"],
            "James B": ["James Brown"],
            "Mary": ["Mary Brown"],
            "Mary B": ["Mary Brown"],
            "Robert": ["Robert White"],
            "Robert W": ["Robert White"],
            "Emily": ["Emily White"],
            "Emily W": ["Emily White"],
            "James/Mary": ["James Brown", "Mary Brown"],
            "Browns": ["James Brown", "Mary Brown"],
            "Robert/Emily": ["Robert White", "Emily White"],
            "Whites": ["Robert White", "Emily White"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledTimes(2);
        expect(setScriptPropertyMock).toHaveBeenNthCalledWith(1, "MEMBER_MAP", JSON.stringify(expectedMemberMap));
        expect(setScriptPropertyMock).toHaveBeenNthCalledWith(2, "ALIASES_MAP", JSON.stringify(expectedAliasMap));
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

        jest.mock("../src/main/scan", () => ({
            getTab: jest.fn()
            .mockReturnValueOnce(membersTableSheetMock)
            .mockReturnValueOnce(couplesTableSheetMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
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

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Doe";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John D";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "James Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "James,James B";

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(0);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        jest.mock("../src/main/scan", () => ({
            getTab: jest.fn()
            .mockReturnValueOnce(membersTableSheetMock)
            .mockReturnValueOnce(couplesTableSheetMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expected: AliasMap = {
            "John": ["John Doe"],
            "John D": ["John Doe"],
            "James": ["James Brown"],
            "James B": ["James Brown"],
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

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Doe";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John D";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "John Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John B";

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(0);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        jest.mock("../src/main/scan", () => ({
            getTab: jest.fn()
            .mockReturnValueOnce(membersTableSheetMock)
            .mockReturnValueOnce(couplesTableSheetMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expected: AliasMap = {
            "John": ["John Doe", "John Brown"],
            "John D": ["John Doe"],
            "John B": ["John Brown"],
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

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Miller";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John M, JM";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "James Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "James,James B";
        membersDataValuesMock[3][NAME_COLUMN_INDEX] = "Mary Brown";
        membersDataValuesMock[3][ALTERNATE_NAMES_COLUMN_INDEX] = "Mary,Mary B";
        
        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(1);
        const couplesDataRangeMock: Range = getRandomlyGeneratedRange();
        couplesDataRangeMock.getValues = jest.fn(() => couplesDataValuesMock);
        const couplesTableSheetMock: Sheet = getRandomlyGeneratedSheet();
        couplesTableSheetMock.getName = jest.fn(() => "Couples");
        couplesTableSheetMock.getDataRange = jest.fn(() => couplesDataRangeMock);

        couplesDataValuesMock[1] = ["James Brown", "Mary Brown", "JM"];

        jest.mock("../src/main/scan", () => ({
            getTab: jest.fn()
            .mockReturnValueOnce(membersTableSheetMock)
            .mockReturnValueOnce(couplesTableSheetMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        loadMembersFromOnestopIntoScriptProperties();

        const expected: AliasMap = {
            "John": ["John Miller"],
            "John M": ["John Miller"],
            "JM": ["John Miller", "James Brown", "Mary Brown"],
            "James": ["James Brown"],
            "James B": ["James Brown"],
            "Mary": ["Mary Brown"],
            "Mary B": ["Mary Brown"]
        };
        expect(setScriptPropertyMock).toHaveBeenCalledWith("ALIASES_MAP", JSON.stringify(expected));
    });
});