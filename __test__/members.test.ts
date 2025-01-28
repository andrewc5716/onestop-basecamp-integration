// Mock PropertiesService and SpreadsheetApp must be imported and set before imported modules require these global objects
import { Logger, PropertiesService, SpreadsheetApp } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;

import { getRandomlyGeneratedAliasTable, getRandomlyGeneratedMemberMap, getRandomlyGeneratedMemberTable, Mock } from './testUtils';
import { PersonAliasClashError } from '../src/main/error/personAliasClashError';

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

describe("loadMembersFromOnestopIntoScriptProperties", () => {
    it("should load the members and couples table from the onestop into the script properties when the members and couples table are present on the onestop", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(5, 1);
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
        couplesDataValuesMock[1] = ["James Brown", "Mary Brown", "James/Mary,Browns"];
        couplesDataValuesMock[2] = ["Robert White", "Emily White", "Robert/Emily,Whites"];

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(membersDataValuesMock)
            .mockReturnValueOnce(couplesDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        const receivedAliasMap: AliasMap = loadMembersFromOnestopIntoScriptProperties();

        const expectedMemberMap: MemberMap = {
            "john doe": {name: "john doe", gender: membersDataValuesMock[1][GENDER_COLUMN_INDEX], married: membersDataValuesMock[1][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[1][PARENT_COLUMN_INDEX], class: membersDataValuesMock[1][CLASS_COLUMN_INDEX]},
            "james brown": {name: "james brown", gender: membersDataValuesMock[2][GENDER_COLUMN_INDEX], married: membersDataValuesMock[2][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[2][PARENT_COLUMN_INDEX], class: membersDataValuesMock[2][CLASS_COLUMN_INDEX]},
            "mary brown": {name: "mary brown", gender: membersDataValuesMock[3][GENDER_COLUMN_INDEX], married: membersDataValuesMock[3][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[3][PARENT_COLUMN_INDEX], class: membersDataValuesMock[3][CLASS_COLUMN_INDEX]},
            "robert white": {name: "robert white", gender: membersDataValuesMock[4][GENDER_COLUMN_INDEX], married: membersDataValuesMock[4][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[4][PARENT_COLUMN_INDEX], class: membersDataValuesMock[4][CLASS_COLUMN_INDEX]},
            "emily white": {name: "emily white", gender: membersDataValuesMock[5][GENDER_COLUMN_INDEX], married: membersDataValuesMock[5][MARRIED_COLUMN_INDEX], parent: membersDataValuesMock[5][PARENT_COLUMN_INDEX], class: membersDataValuesMock[5][CLASS_COLUMN_INDEX]},
        };

        const expectedAliasMap: AliasMap = {
            "john": ["john doe"],
            "john d": ["john doe"],
            "james": ["james brown"],
            "james b": ["james brown"],
            "mary": ["mary brown"],
            "mary b": ["mary brown"],
            "robert": ["robert white"],
            "robert w": ["robert white"],
            "emily": ["emily white"],
            "emily w": ["emily white"],
            "james/mary": ["james brown", "mary brown"],
            "browns": ["james brown", "mary brown"],
            "robert/emily": ["robert white", "emily white"],
            "whites": ["robert white", "emily white"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalled();
        expect(setScriptPropertyMock).toHaveBeenNthCalledWith(1, "MEMBER_MAP", JSON.stringify(expectedMemberMap));
        expect(receivedAliasMap).toStrictEqual(expectedAliasMap);
    });

    it("should load an empty object into script properties for the members map when the members table is empty", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(0);
        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(3);

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(membersDataValuesMock)
            .mockReturnValueOnce(couplesDataValuesMock),
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
        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Doe";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John D";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "James Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "James,James B";

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(0);

        const expectedAliasMap: AliasMap = {
            "john": ["john doe"],
            "john d": ["john doe"],
            "james": ["james brown"],
            "james b": ["james brown"],
        };

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(membersDataValuesMock)
            .mockReturnValueOnce(couplesDataValuesMock),
        }));

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: jest.fn(),
        }));

        const mergeAliasMapsMock: Mock = jest.fn(() => expectedAliasMap);
        jest.mock("../src/main/aliases", () => ({
            mergeAliasMaps: mergeAliasMapsMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        const membersAliases: AliasMap = loadMembersFromOnestopIntoScriptProperties();

        expect(mergeAliasMapsMock).toHaveBeenCalledWith(expectedAliasMap, {});
        expect(membersAliases).toStrictEqual(expectedAliasMap);
    });

    it("should throw an error when multiple people share the same alternate name", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(2, 1);
        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Doe";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John D";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "John Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John B";

        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(0);

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(membersDataValuesMock)
            .mockReturnValueOnce(couplesDataValuesMock),
        }));

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: jest.fn(),
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        expect(() => loadMembersFromOnestopIntoScriptProperties()).toThrow(new PersonAliasClashError('Multiple members have the alternate name john'));
    });

    it("should map an alias to both a person and a couple when a person's alternate name is the same as a couple's alias", () => {
        const membersDataValuesMock: any[][] = getRandomlyGeneratedMemberTable(3, 1);

        membersDataValuesMock[1][NAME_COLUMN_INDEX] = "John Miller";
        membersDataValuesMock[1][ALTERNATE_NAMES_COLUMN_INDEX] = "John,John M, JM";
        membersDataValuesMock[2][NAME_COLUMN_INDEX] = "James Brown";
        membersDataValuesMock[2][ALTERNATE_NAMES_COLUMN_INDEX] = "James,James B";
        membersDataValuesMock[3][NAME_COLUMN_INDEX] = "Mary Brown";
        membersDataValuesMock[3][ALTERNATE_NAMES_COLUMN_INDEX] = "Mary,Mary B";
        
        const couplesDataValuesMock: any[][] = getRandomlyGeneratedAliasTable(1);
        couplesDataValuesMock[1] = ["James Brown", "Mary Brown", "JM"];

        const expectedMembersAliasMap: AliasMap = {
            "john": ["john miller"],
            "john m": ["john miller"],
            "jm": ["john miller"],
            "james": ["james brown"],
            "james b": ["james brown"],
            "mary": ["mary brown"],
            "mary b": ["mary brown"]
        };

        const expectedCouplesAliasMap: AliasMap = {
            "jm": ["james brown", "mary brown"],
        };

        const expectedAliasMap: AliasMap = {
            "john": ["john miller"],
            "john m": ["john miller"],
            "jm": ["john miller", "james brown", "mary brown"],
            "james": ["james brown"],
            "james b": ["james brown"],
            "mary": ["mary brown"],
            "mary b": ["mary brown"],
        };

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(membersDataValuesMock)
            .mockReturnValueOnce(couplesDataValuesMock),
        }));

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(),
            setScriptProperty: jest.fn(),
        }));

        const mergeAliasMapsMock: Mock = jest.fn(() => expectedAliasMap);
        jest.mock("../src/main/aliases", () => ({
            mergeAliasMaps: mergeAliasMapsMock,
        }));

        const { loadMembersFromOnestopIntoScriptProperties } = require('../src/main/members');
        const membersAliases: AliasMap = loadMembersFromOnestopIntoScriptProperties();

        expect(mergeAliasMapsMock).toHaveBeenCalledWith(expectedMembersAliasMap, expectedCouplesAliasMap);
        expect(membersAliases).toStrictEqual(expectedAliasMap);
    });
});
