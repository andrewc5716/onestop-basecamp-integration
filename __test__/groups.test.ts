import { Logger } from "gasmask";
global.Logger = Logger;

import { getRandomlyGeneratedGroupsMap, getRandomlyGeneratedGroupsTable, getRandomlyGeneratedSupergroupsTable, Mock } from "./testUtils";

const GROUP_NAME_COLUMN_INDEX: number = 0;
const GROUP_MEMBERS_COLUMN_INDEX: number = 1;
const SUPERGROUP_NAME_COLUMN_INDEX: number = 0;
const SUPERGROUP_SUBGROUP_COLUMN_INDEX: number = 1;
const SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX: number = 3;

describe("GROUPS_MAP", () => {
    it("should return the groups map from the script properties when it is present", () => {
        const groupsMapMock: GroupsMap = getRandomlyGeneratedGroupsMap();

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => groupsMapMock),
        }));
        
        // Import the GROUPS_MAP with the mocked propertiesService
        const { GROUPS_MAP } = require('../src/main/groups');

        expect(GROUPS_MAP).toEqual(groupsMapMock);
    });

    it("should return an empty map when there is no groups map present in the script properties", () => {
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        // Import the GROUPS_MAP with the mocked propertiesService
        const { GROUPS_MAP } = require('../src/main/groups');

        expect(GROUPS_MAP).toStrictEqual({});
    });
});

describe("loadGroupsFromOnestopIntoScriptProperties", () => {
    it("should load a mapping of group name to a list of group members when the Groups table is present and not empty", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(3);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(0);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "IGSM";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "IUSM";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            igsm: ["john doe", "jane smith"],
            a2k: ["alice johnson", "bob brown"],
            iusm: ["charlie davis", "emily clark"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should load an empty object into script properties when the Groups table is empty", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(0);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(0);

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", "{}");
    });

    it("should load an empty list for a group's members when no members are specified", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(1);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(0);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "IGSM";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            igsm: []
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should combine multiple entries of the same group when a group is accidentally defined more than once in the Groups table", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(3);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(0);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "IGSM";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "IGSM";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark, Jane Smith";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            igsm: ["john doe", "jane smith", "charlie davis", "emily clark"],
            a2k: ["alice johnson", "bob brown"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should load all Supergroups into script properties when there are no dependencies on groups that have not been loaded yet", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "SDSU";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "College";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, SDSU";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            sdsu: ["charlie davis", "emily clark"],
            a2k: ["frank miller", "grace wilson"],
            community: ["frank miller", "grace wilson"],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown"],
            college: ["john doe", "jane smith", "alice johnson", "bob brown", "charlie davis", "emily clark"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should skip loading a subgroup when the subgroup has not been defined", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(2);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "Everyone";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, Community, International";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            a2k: ["frank miller", "grace wilson"],
            community: ["frank miller", "grace wilson"],
            ucsd: ["john doe", "jane smith"],
            everyone: ["john doe", "jane smith", "frank miller", "grace wilson"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should skip empty Supergroup table rows when Google Sheets returns more rows than the table because of extra data on the spreadsheet", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            a2k: ["frank miller", "grace wilson"],
            community: ["frank miller", "grace wilson"],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should load all Supergroups into script properties when there are dependencies on groups that have not been loaded yet", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "SDSU";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "College";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, SDSU";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            sdsu: ["charlie davis", "emily clark"],
            a2k: ["frank miller", "grace wilson"],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown"],
            college: ["john doe", "jane smith", "alice johnson", "bob brown", "charlie davis", "emily clark"],
            community: ["frank miller", "grace wilson"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should merge the menmbers of a Supergroup and a group when a Supergroup and a group have the same name (should never happen)", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "SDSU";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "SDSU";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "College";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, SDSU";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            sdsu: ["charlie davis", "emily clark"],
            a2k: ["frank miller", "grace wilson", "charlie davis", "emily clark"],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown"],
            college: ["john doe", "jane smith", "alice johnson", "bob brown", "charlie davis", "emily clark"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should load an empty list for a Supergroup when the Supergroup does not have any subgroups defined", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "SDSU";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "College";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            sdsu: ["charlie davis", "emily clark"],
            a2k: ["frank miller", "grace wilson"],
            community: ["frank miller", "grace wilson"],
            college: [],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should remove duplicate members when members are part of multiple subgroups within the same Supergroup", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith, Charlie Davis";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "IUSM";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "IGSM";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "Everyone";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, International";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "International";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "IUSM, IGSM";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith", "charlie davis"],
            hg2: ["alice johnson", "bob brown"],
            iusm: ["charlie davis", "emily clark"],
            igsm: ["frank miller", "grace wilson"],
            international: ["charlie davis", "emily clark", "frank miller", "grace wilson"],
            ucsd: ["john doe", "jane smith", "charlie davis", "alice johnson", "bob brown"],
            everyone: ["john doe", "jane smith", "charlie davis", "alice johnson", "bob brown", "emily clark", "frank miller", "grace wilson"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should load additional supergroup members when a supergroup has additional members", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "SDSU";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "Robert Brown";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "College";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, SDSU";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "William Johnson, Olivia Wilson";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "Sophia Martinez, Emma Anderson, Casey Morgan";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            sdsu: ["charlie davis", "emily clark"],
            a2k: ["frank miller", "grace wilson"],
            community: ["frank miller", "grace wilson", "sophia martinez", "emma anderson", "casey morgan"],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown", "robert brown"],
            college: ["john doe", "jane smith", "alice johnson", "bob brown", "robert brown", "charlie davis", "emily clark", "william johnson", "olivia wilson"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });

    it("should remove duplicate members when members are part of the additional members for a supergroup and one of its subgroups", () => {
        const groupsDataValuesMock: any[][] = getRandomlyGeneratedGroupsTable(4);
        const supergroupsDataValuesMock: any[][] = getRandomlyGeneratedSupergroupsTable(3);

        groupsDataValuesMock[1][GROUP_NAME_COLUMN_INDEX] = "HG1";
        groupsDataValuesMock[1][GROUP_MEMBERS_COLUMN_INDEX] = "John Doe, Jane Smith";
        groupsDataValuesMock[2][GROUP_NAME_COLUMN_INDEX] = "HG2";
        groupsDataValuesMock[2][GROUP_MEMBERS_COLUMN_INDEX] = "Alice Johnson, Bob Brown";
        groupsDataValuesMock[3][GROUP_NAME_COLUMN_INDEX] = "SDSU";
        groupsDataValuesMock[3][GROUP_MEMBERS_COLUMN_INDEX] = "Charlie Davis, Emily Clark";
        groupsDataValuesMock[4][GROUP_NAME_COLUMN_INDEX] = "A2K";
        groupsDataValuesMock[4][GROUP_MEMBERS_COLUMN_INDEX] = "Frank Miller, Grace Wilson";

        supergroupsDataValuesMock[1][SUPERGROUP_NAME_COLUMN_INDEX] = "UCSD";
        supergroupsDataValuesMock[1][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "HG1, HG2";
        supergroupsDataValuesMock[1][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "Robert Brown";
        supergroupsDataValuesMock[2][SUPERGROUP_NAME_COLUMN_INDEX] = "College";
        supergroupsDataValuesMock[2][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "UCSD, SDSU";
        supergroupsDataValuesMock[2][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "Robert Brown";
        supergroupsDataValuesMock[3][SUPERGROUP_NAME_COLUMN_INDEX] = "Community";
        supergroupsDataValuesMock[3][SUPERGROUP_SUBGROUP_COLUMN_INDEX] = "A2K";
        supergroupsDataValuesMock[3][SUPERGROUP_ADDITIONAL_MEMBERS_COLUMN_INDEX] = "";

        jest.mock("../src/main/scan", () => ({
            getCellValues: jest.fn()
            .mockReturnValueOnce(groupsDataValuesMock)
            .mockReturnValueOnce(supergroupsDataValuesMock),
        }));

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { loadGroupsFromOnestopIntoScriptProperties } = require('../src/main/groups');
        loadGroupsFromOnestopIntoScriptProperties();

        const expectedMap: GroupsMap = {
            hg1: ["john doe", "jane smith"],
            hg2: ["alice johnson", "bob brown"],
            sdsu: ["charlie davis", "emily clark"],
            a2k: ["frank miller", "grace wilson"],
            community: ["frank miller", "grace wilson"],
            ucsd: ["john doe", "jane smith", "alice johnson", "bob brown", "robert brown"],
            college: ["john doe", "jane smith", "alice johnson", "bob brown", "robert brown", "charlie davis", "emily clark"],
        };

        expect(setScriptPropertyMock).toHaveBeenCalledWith("GROUPS_MAP", JSON.stringify(expectedMap));
    });
});

// Mocked GROUPS_MAP
const MOCK_GROUPS_MAP = {
    sdsu: ['josh wong', 'isaac otero', 'kevin lai', 'joyce lai'],
    iusm: ['brian lin', 'james lee'],
    igsm: ['jack zhang', 'angel zhang'],
    "int'l": ['brian lin', 'james lee', 'jack zhang', 'angel zhang']
};

describe('getMembersFromGroups', () => {
    it('should return a flat array of members for given group names', () => {
        const groupNames = ['sdsu', 'iusm'];

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn(() => MOCK_GROUPS_MAP)
        }));

        const { getMembersFromGroups } = require("../src/main/groups");

        const result = getMembersFromGroups(groupNames);
        expect(result).toEqual(['josh wong', 'isaac otero', 'kevin lai', 'joyce lai', 'brian lin', 'james lee']);
    });

    it('should return an empty array when no groups are provided', () => {
        const groupNames: string[] = [];

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn(() => MOCK_GROUPS_MAP)
        }));

        const { getMembersFromGroups } = require("../src/main/groups");

        const result = getMembersFromGroups(groupNames);
        expect(result).toEqual([]);
    });

    it('should skip groups not found in GROUPS_MAP', () => {
        const groupNames = ['igsm', 'kaleo'];

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn(() => MOCK_GROUPS_MAP)
        }));

        const { getMembersFromGroups } = require("../src/main/groups");

        const result = getMembersFromGroups(groupNames);
        expect(result).toEqual(['jack zhang', 'angel zhang']);
    });

    it('should handle duplicate group names', () => {
        const groupNames = ['iusm', 'iusm'];

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn(() => MOCK_GROUPS_MAP)
        }));

        const { getMembersFromGroups } = require("../src/main/groups");

        const result = getMembersFromGroups(groupNames);
        expect(result).toEqual(['brian lin', 'james lee']);
    });

    it('should return an empty array if no group names match', () => {
        const groupNames = ['kaleo', 'impact'];

        // Mock GROUPS_MAP in your test environment if needed
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn(() => MOCK_GROUPS_MAP)
        }));

        const { getMembersFromGroups } = require("../src/main/groups");

        const result = getMembersFromGroups(groupNames);
        expect(result).toEqual([]);
    });
});
