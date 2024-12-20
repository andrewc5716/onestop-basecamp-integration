// Mock PropertiesService must be imported and set before the row module is imported
// and attempts to access the global PropertiesService object
import { Logger, PropertiesService } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;

import { generateIdForRow, getId, getMetadata, hasId } from "../src/main/row";
import { RowMissingIdError } from '../src/main/error/rowMissingIdError';
import { getRandomlyGeneratedMember, getRandomlyGeneratedMetadata, getRandomlyGeneratedRange, getRandomlyGeneratedRow, Mock } from './testUtils';
import randomstring from "randomstring";

describe("getMetadata", () => {
    it("should return the Metadata object when a single Metadata object is present", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const rangeMock: Range = getRandomlyGeneratedRange();
        rangeMock.getDeveloperMetadata = jest.fn(() => [metadataMock]);

        const retrievedMetadata: Metadata = getMetadata(rangeMock);

        expect(retrievedMetadata).toBe(metadataMock);
    });

    it("should return the first Metadata object when multiple Metadata objects are present", () => {
        const firstMetadataMock: Metadata = getRandomlyGeneratedMetadata();
        const secondMetadataMock: Metadata = getRandomlyGeneratedMetadata();
        const thirdMetadataMock: Metadata = getRandomlyGeneratedMetadata();
        const rangeMock: Range = getRandomlyGeneratedRange();
        rangeMock.getDeveloperMetadata = jest.fn(() => [firstMetadataMock, secondMetadataMock, thirdMetadataMock]);

        const retrievedMetadata: Metadata = getMetadata(rangeMock);

        expect(retrievedMetadata).toBe(firstMetadataMock);
    });

    it("should generate and return a Metadata object when Metadata is not present", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const rangeMock: Range = getRandomlyGeneratedRange();
        const addDeveloperMetadataMock: Mock = jest.fn();
        rangeMock.addDeveloperMetadata = addDeveloperMetadataMock;
        // First call should not return a Metadata object and the second one should
        rangeMock.getDeveloperMetadata = jest.fn()
            .mockImplementationOnce(() => [])
            .mockImplementationOnce(() => [metadataMock]);

        const retrievedMetadata: Metadata = getMetadata(rangeMock);

        // Assert Metadata object was generaged with addDeveloperMetadata and that it was returned
        expect(addDeveloperMetadataMock).toHaveBeenCalledWith("rowId");
        expect(retrievedMetadata).toBe(metadataMock);
    });
});

describe("getId", () => {
    it("should return id when id is present", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => "0419f086-4f19-4ade-ac64-2edafefef23d");
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        const retrievedId: string = getId(row);

        expect(retrievedId).toBe("0419f086-4f19-4ade-ac64-2edafefef23d");
    });

    it("should throw RowMissingIdError when id is null", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => null);
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        expect(() => getId(row)).toThrow(RowMissingIdError);
    });

  it("should throw RowMissingIdError when id is empty", () => {
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => "");
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        expect(() => getId(row)).toThrow(RowMissingIdError);
    });
});

describe("generateIdForRow", () => {
    it("should generate and assign a new UUID for the row when called", () => {
        const newUUID: string = "aeb39e2f-04f6-42ca-b87b-514f4371b708";
        const getUuidMock: Mock = jest.fn(() => newUUID);
        // Overide the global Google Apps Script Utilities object
        global.Utilities = {getUuid: getUuidMock}
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const setValueMock: Mock = jest.fn();
        metadataMock.setValue = setValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metadataMock;

        generateIdForRow(row);

        expect(getUuidMock).toHaveBeenCalledTimes(1);
        expect(setValueMock).toHaveBeenCalledWith(newUUID);
    });
});


describe('getAttendeesFromRow', () => {

    it('should return ministry members instead of all domain members when ministry is populated', () => {

        interface Row {
            [key: string]: any;
        }
        const row: Row = { domain: "INT'L", who: 'IGSM' };

        const MOCK_GROUPS_MAP = {
            IGSM: ['Jack Zhang', 'Angel Zhang'],
        };

        const MOCK_MEMBER_MAP = {
            "Jack Zhang": {"gender": "Male"},
            "Angel Zhang": {"gender": "Female"}
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } 
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['Jack Zhang', 'Angel Zhang']);
    });

    it('should return all specified domain members when no ministry names are present', () => {

        interface Row {
            [key: string]: any;
        }

        const row: Row = { domain: "INT'L", who: "" };

        // Mocked GROUPS_MAP
        const MOCK_GROUPS_MAP = {
            "INT'L": ['Brian Lin', 'James Lee', 'Jack Zhang', 'Angel Zhang'],
        };

        // Mocked MEMBER MAP
        const MOCK_MEMBER_MAP = {
            "Brian Lin": {"gender": "Male"},
            "James Lee": {"gender": "Male"},
            "Jack Zhang": {"gender": "Male"},
            "Angel Zhang": {"gender": "Female"}
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } 
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['Brian Lin', 'James Lee', 'Jack Zhang', 'Angel Zhang']);
    });

    it('should not throw an error when both ministry and domain names are missing', () => {

        interface Row {
            [key: string]: any;
        }

        const row: Row = { domain: '', who: '' };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {};

                } else if (key === "GROUPS_MAP") {
                    return {};
                } 
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        expect(() => getAttendeesFromRow(row)).not.toThrow();
    });

    it('should apply any filters present in the ministry column', () => {
        interface Row {
            [key: string]: any;
        }

        const row: Row = { domain: "INT'L", who: "IGSM, Bros" };

        const MOCK_GROUPS_MAP = {
            IGSM: ['Jack Zhang', 'Angel Zhang'],
        };

        const MOCK_MEMBER_MAP = {
            "Jack Zhang": {"gender": "Male"},
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } 
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['Jack Zhang']);
    });

    it('should apply any filters present in the domain column', () => {
        interface Row {
            [key: string]: any;
        }

        const row: Row = { domain: "COLLEGE, Sis", who: "" };

        const MOCK_GROUPS_MAP = {
            COLLEGE: ['Andrew Chan', 'Janice Chan', 'Josh Wong', 'Isaac Otero', 'Kevin Lai', 'Joyce Lai', 'Brian Lin', 'James Lee'],
        };

        const MOCK_MEMBER_MAP = {
            "Janice Chan": {"gender": "Female"},
            "Joyce Lai": {"gender": "Female"},
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } 
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['Janice Chan', 'Joyce Lai']);
    });

    it('should filter the domain using filters from the ministry column if there are no ministry groups present in the ministry column', () => {
        interface Row {
            [key: string]: any;
        }

        const row: Row = { domain: "CHURCHWIDE", who: "Sis" };

        // Mocked GROUPS_MAP
        const MOCK_GROUPS_MAP = {
            CHURCHWIDE: ['Andrew Chan', 'Janice Chan', 'Josh Wong', 'Isaac Otero', 'Kevin Lai', 'Joyce Lai', 'Brian Lin', 'James Lee', 'Brian Lin', 'James Lee', 'Jack Zhang', 'Angel Zhang'],
        };

        // Mocked MEMBER MAP
        const MOCK_MEMBER_MAP = {
            "Janice Chan": {"gender": "Female"},
            "Joyce Lai": {"gender": "Female"},
            "Angel Zhang": {"gender": "Female"}
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } 
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['Janice Chan', 'Joyce Lai', 'Angel Zhang']);
    });
    

    it('should return attendees from the In Charge and Helpers columns when Domain is Rotation', () => {
        interface Row {
            [key: string]: any;
        }

        const row: Row = { domain: "ROTATION", who: "Rotation", inCharge: { value: "Kevin Lai" } as Text, helpers: { value: "Josh Wong, Isaac Otero" } as Text };

        const MOCK_GROUPS_MAP = {
            ROTATION: undefined,
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {};

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;

                } else if(key === "ALIASES_MAP") {
                    return {};
                }
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['Kevin Lai', 'Josh Wong', 'Isaac Otero']);
    });
});


describe("hasId", () => {
    it("should return true when the row has already been assigned an id", () => {
        const uuid: string = "51ab21eb-0e29-4173-8f37-b3e1f9d65c71";
        const getValueMock = jest.fn(() => uuid);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowHasId: boolean = hasId(row);

        expect(getValueMock).toHaveBeenCalledTimes(1);
        expect(rowHasId).toBe(true);
    });

    it("should return false when the metadata value is null", () => {
        const getValueMock = jest.fn(() => null);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowHasId: boolean = hasId(row);

        expect(getValueMock).toHaveBeenCalledTimes(1);
        expect(rowHasId).toBe(false);
    });
    
    it("should return false when the metadata value is string", () => {
        const getValueMock = jest.fn(() => "");
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowHasId: boolean = hasId(row);

        expect(getValueMock).toHaveBeenCalledTimes(1);
        expect(rowHasId).toBe(false);
    })
});

describe("saveRow", () => {

});

describe("hasBeenSaved", () => {

});

describe("hasChanged", () => {

});

describe("getRowBasecampMapping", () => {

});

describe("toString", () => {

});

describe("getBasecampTodoRequestsForRow", () => {

});

describe("getBasecampTodosForLeads", () => {

});

describe("getBasecampTodosForHelpers", () => {

});

describe("getHelperGroups", () => {
    it("should return an empty array when the row has not helpers value specified", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual([]);
    });

    it("should return a HelperGroup corresponding to each role when there are multiple roles", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: John Doe, Jane Smith\nTech: Alice Johnson, Bob Brown";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "John Doe": randomstring.generate(),
            "Jane Smith": randomstring.generate(),
            "Alice Johnson": randomstring.generate(),
            "Bob Brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["John Doe"], peopleToBasecampIdMap["Jane Smith"]] },
            { role: "Tech", helperIds: [peopleToBasecampIdMap["Alice Johnson"], peopleToBasecampIdMap["Bob Brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand groups into their members when a group is included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Jane Smith, Alice Johnson, UCSD";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "John Doe": randomstring.generate(),
            "Jane Smith": randomstring.generate(),
            "Alice Johnson": randomstring.generate(),
            "Bob Brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Bob Brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["Jane Smith"], peopleToBasecampIdMap["Alice Johnson"], peopleToBasecampIdMap["John Doe"], peopleToBasecampIdMap["Bob Brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand aliases into their members when an alias is included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: John/Jane, Alice Johnson, Bob Brown";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "John Doe": randomstring.generate(),
            "Jane Smith": randomstring.generate(),
            "Alice Johnson": randomstring.generate(),
            "Bob Brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: { "John/Jane": ["John Doe", "Jane Smith"] },
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Bob Brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["John Doe"], peopleToBasecampIdMap["Jane Smith"], peopleToBasecampIdMap["Alice Johnson"], peopleToBasecampIdMap["Bob Brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand groups and apply individual filters when a filter is only applied to a specific helper", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Bob Brown, Alice Johnson, UCSD Bros";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "John Doe": randomstring.generate(),
            "Jane Smith": randomstring.generate(),
            "Alice Johnson": randomstring.generate(),
            "Bob Brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Jane Smith"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["Bob Brown"], peopleToBasecampIdMap["Alice Johnson"], peopleToBasecampIdMap["John Doe"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should remove any duplicate names when helpers are specified more than once", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Bob Brown, Alice Johnson, Bob Brown, UCSD";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "John Doe": randomstring.generate(),
            "Jane Smith": randomstring.generate(),
            "Alice Johnson": randomstring.generate(),
            "Bob Brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Alice Johnson"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["Bob Brown"], peopleToBasecampIdMap["Alice Johnson"], peopleToBasecampIdMap["John Doe"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should return the group members when there is no role specified", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "John Doe, Jane Smith, Alice Johnson, Bob Brown";
        rowMock.helpers = { value: helpersValueMock, hyperlink: null };

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "John Doe": randomstring.generate(),
            "Jane Smith": randomstring.generate(),
            "Alice Johnson": randomstring.generate(),
            "Bob Brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: undefined, helperIds: [peopleToBasecampIdMap["John Doe"], peopleToBasecampIdMap["Jane Smith"], peopleToBasecampIdMap["Alice Johnson"], peopleToBasecampIdMap["Bob Brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });
});

describe("clearAllRowMetadata", () => {

});

describe("getRoleTodoIdMap", () => {

});
