// Mock PropertiesService must be imported and set before the row module is imported
// and attempts to access the global PropertiesService object
import { Logger, PropertiesService } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;

import { generateIdForRow, getId, getMetadata, getSavedScheduleEntryId, hasId, saveRow } from "../src/main/row";
import { RowMissingIdError } from '../src/main/error/rowMissingIdError';
import { getRandomlyGeneratedByteArray, getRandomlyGeneratedMember, getRandomlyGeneratedMetadata, getRandomlyGeneratedRange, getRandomlyGeneratedRoleTodoMap, getRandomlyGeneratedRow, getRandomlyGeneratedRowBasecampMapping, getRandomlyGeneratedText, Mock } from './testUtils';
import randomstring from "randomstring";
import { RowBasecampMappingMissingError } from '../src/main/error/rowBasecampMappingMissingError';
import { normalizePersonName } from '../src/main/people';

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
        global.Utilities = {getUuid: getUuidMock};
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
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "INT'L";
        row.who = "IGSM";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "";

        const MOCK_GROUPS_MAP = {
            igsm: ['jack zhang', 'angel zhang'],
        };

        const MOCK_MEMBER_MAP = {
            "jack zhang": {"gender": "Male"},
            "angel zhang": {"gender": "Female"}
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

        expect(result).toEqual(['jack zhang', 'angel zhang']);
    });

    it('should return all specified domain members when no ministry names are present', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "INT'L";
        row.who = "";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "";

        // Mocked GROUPS_MAP
        const MOCK_GROUPS_MAP = {
            "int'l": ['brian lin', 'james lee', 'jack zhang', 'angel zhang'],
        };

        // Mocked MEMBER MAP
        const MOCK_MEMBER_MAP = {
            "brian lin": {"gender": "Male"},
            "james lee": {"gender": "Male"},
            "jack zhang": {"gender": "Male"},
            "angel zhang": {"gender": "Female"}
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

        expect(result).toEqual(['brian lin', 'james lee', 'jack zhang', 'angel zhang']);
    });

    it('should not throw an error when both ministry and domain names are missing', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = '';
        row.who = '';
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "";

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
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "INT'L";
        row.who = "IGSM, Bros";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "";

        const MOCK_GROUPS_MAP = {
            igsm: ['jack zhang', 'angel zhang'],
        };

        const MOCK_MEMBER_MAP = {
            "jack zhang": {"gender": "Male"},
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

        expect(result).toEqual(['jack zhang']);
    });

    it('should apply any filters present in the domain column', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "COLLEGE, Sis";
        row.who = "";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "";

        const MOCK_GROUPS_MAP = {
            college: ['andrew chan', 'janice chan', 'josh wong', 'isaac otero', 'kevin lai', 'joyce lai', 'brian lin', 'james lee'],
        };

        const MOCK_MEMBER_MAP = {
            "janice chan": {"gender": "Female"},
            "joyce lai": {"gender": "Female"},
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

        expect(result).toEqual(['janice chan', 'joyce lai']);
    });

    it('should filter the domain using filters from the ministry column if there are no ministry groups present in the ministry column', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "CHURCHWIDE";
        row.who = "Sis";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "";

        // Mocked GROUPS_MAP
        const MOCK_GROUPS_MAP = {
            churchwide: ['andrew chan', 'janice chan', 'josh wong', 'isaac otero', 'kevin lai', 'joyce lai', 'brian lin', 'james lee', 'brian lin', 'james lee', 'jack zhang', 'angel zhang'],
        };

        // Mocked MEMBER MAP
        const MOCK_MEMBER_MAP = {
            "janice chan": {"gender": "Female"},
            "joyce lai": {"gender": "Female"},
            "angel zhang": {"gender": "Female"}
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;

                } else if(key === "ALIASES_MAP") {
                    return {};
                }
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['janice chan', 'joyce lai', 'angel zhang']);
    });
    

    it('should return attendees from the In Charge and Helpers columns when Domain is Rotation', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "ROTATION";
        row.who = "Rotation";
        row.inCharge = getRandomlyGeneratedText(1);
        row.inCharge.value = "kevin lai";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "josh wong, isaac otero";

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

        expect(result).toEqual(['josh wong', 'isaac otero', 'kevin lai']);
    });

    it('should return ministry members and helpers when ministry is populated', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "int'l";
        row.who = "igsm";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "john doe";

        const MOCK_GROUPS_MAP = {
            igsm: ['jack zhang', 'angel zhang'],
        };

        const MOCK_MEMBER_MAP = {
            "jack zhang": {"gender": "Male"},
            "angel zhang": {"gender": "Female"},
            "john doe": {"gender": "Male"}
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } else {
                    return {};
                }
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['john doe', 'jack zhang', 'angel zhang']);
    });

    it('should return all specified domain members and helpers when no ministry names are present', () => {
        const row: Row = getRandomlyGeneratedRow();
        row.domain = "int'l";
        row.who = "";
        row.helpers = getRandomlyGeneratedText(1);
        row.helpers.value = "john doe";

        // Mocked GROUPS_MAP
        const MOCK_GROUPS_MAP = {
            "int'l": ['brian lin', 'james lee', 'jack zhang', 'angel zhang'],
        };

        // Mocked MEMBER MAP
        const MOCK_MEMBER_MAP = {
            "brian lin": {"gender": "Male"},
            "james lee": {"gender": "Male"},
            "jack zhang": {"gender": "Male"},
            "angel zhang": {"gender": "Female"},
            "john doe": {"gender": "Male"},
        };

        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return MOCK_MEMBER_MAP;

                } else if (key === "GROUPS_MAP") {
                    return MOCK_GROUPS_MAP;
                } else {
                    return {};
                }
            }),
        }));

        const { getAttendeesFromRow } = require("../src/main/row");

        const result = getAttendeesFromRow(row);

        expect(result).toEqual(['john doe', 'brian lin', 'james lee', 'jack zhang', 'angel zhang']);
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
    it("should throw a RowMissingIdError when the row does not have an id", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        metadataMock.getValue = jest.fn(() => null);
        rowMock.metadata = metadataMock;

        const roleTodoMapMock: RoleTodoMap = getRandomlyGeneratedRoleTodoMap();
        const scheduleEntryIdMock: string = randomstring.generate();

        expect(() => saveRow(rowMock, roleTodoMapMock, scheduleEntryIdMock)).toThrow(RowMissingIdError);
    });

    it("should save the row to the document properties when called", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const metadataMock: Metadata = getRandomlyGeneratedMetadata();
        const roleTodoMapMock: RoleTodoMap = getRandomlyGeneratedRoleTodoMap();
        const scheduleEntryIdMock: string = randomstring.generate();

        const rowIdMock: string = randomstring.generate();
        metadataMock.getValue = jest.fn(() => rowIdMock);
        rowMock.metadata = metadataMock;

        const rowHashBytesMock: Uint8Array = getRandomlyGeneratedByteArray();
        const computeDigestMock: Mock = jest.fn(() => rowHashBytesMock);
        global.Utilities = {
            computeDigest: computeDigestMock,
            DigestAlgorithm: { SHA_256: 0 },
        };

        const setDocumentPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            setDocumentProperty: setDocumentPropertyMock,
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { saveRow } = require("../src/main/row");

        saveRow(rowMock, roleTodoMapMock, scheduleEntryIdMock);

        expect(setDocumentPropertyMock).toHaveBeenCalledWith(rowIdMock, expect.any(String));
    });
});

describe("hasBeenSaved", () => {

});

describe("hasChanged", () => {

});

describe("getRowBasecampMapping", () => {

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
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual([]);
    });

    it("should return a HelperGroup corresponding to each role when there are multiple roles", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: John Doe, Jane Smith\nTech: Alice Johnson, Bob Brown";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const memberMapMock: MemberMap = {};
        memberMapMock["john doe"] = getRandomlyGeneratedMember();
        memberMapMock["john doe"].gender = "Male";
        memberMapMock["jane smith"] = getRandomlyGeneratedMember();
        memberMapMock["jane smith"].gender = "Female";
        memberMapMock["alice johnson"] = getRandomlyGeneratedMember();
        memberMapMock["alice johnson"].gender = "Female";
        memberMapMock["bob brown"] = getRandomlyGeneratedMember();
        memberMapMock["bob brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "john doe": randomstring.generate(),
            "jane smith": randomstring.generate(),
            "alice johnson": randomstring.generate(),
            "bob brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["john doe"], peopleToBasecampIdMap["jane smith"]] },
            { role: "Tech", helperIds: [peopleToBasecampIdMap["alice johnson"], peopleToBasecampIdMap["bob brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand groups into their members when a group is included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Jane Smith, Alice Johnson, UCSD";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const memberMapMock: MemberMap = {};
        memberMapMock["john doe"] = getRandomlyGeneratedMember();
        memberMapMock["john doe"].gender = "Male";
        memberMapMock["jane smith"] = getRandomlyGeneratedMember();
        memberMapMock["jane smith"].gender = "Female";
        memberMapMock["alice johnson"] = getRandomlyGeneratedMember();
        memberMapMock["alice johnson"].gender = "Female";
        memberMapMock["bob brown"] = getRandomlyGeneratedMember();
        memberMapMock["bob brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "john doe": randomstring.generate(),
            "jane smith": randomstring.generate(),
            "alice johnson": randomstring.generate(),
            "bob brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "ucsd": ["john doe", "bob brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["jane smith"], peopleToBasecampIdMap["alice johnson"], peopleToBasecampIdMap["john doe"], peopleToBasecampIdMap["bob brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand aliases into their members when an alias is included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: John/Jane, Alice Johnson, Bob Brown";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const memberMapMock: MemberMap = {};
        memberMapMock["john doe"] = getRandomlyGeneratedMember();
        memberMapMock["john doe"].gender = "Male";
        memberMapMock["jane smith"] = getRandomlyGeneratedMember();
        memberMapMock["jane smith"].gender = "Female";
        memberMapMock["alice johnson"] = getRandomlyGeneratedMember();
        memberMapMock["alice johnson"].gender = "Female";
        memberMapMock["bob brown"] = getRandomlyGeneratedMember();
        memberMapMock["bob brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "john doe": "johndoeid",
            "jane smith": "jsid",
            "alice johnson": "ajid",
            "bob brown": "bbid",
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        jest.mock("../src/main/aliases", () => ({
            ALIASES_MAP: { "john/jane": ["john doe", "jane smith"] },
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "ucsd": ["john doe", "bob brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["john doe"], peopleToBasecampIdMap["jane smith"], peopleToBasecampIdMap["alice johnson"], peopleToBasecampIdMap["bob brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand groups and apply individual filters when a filter is only applied to a specific helper", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Bob Brown, Alice Johnson, UCSD Bros";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const memberMapMock: MemberMap = {};
        memberMapMock["john doe"] = getRandomlyGeneratedMember();
        memberMapMock["john doe"].gender = "Male";
        memberMapMock["jane smith"] = getRandomlyGeneratedMember();
        memberMapMock["jane smith"].gender = "Female";
        memberMapMock["alice johnson"] = getRandomlyGeneratedMember();
        memberMapMock["alice johnson"].gender = "Female";
        memberMapMock["bob brown"] = getRandomlyGeneratedMember();
        memberMapMock["bob brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "john doe": randomstring.generate(),
            "jane smith": randomstring.generate(),
            "alice johnson": randomstring.generate(),
            "bob brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "ucsd": ["john doe", "jane smith"] },
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["bob brown"], peopleToBasecampIdMap["alice johnson"], peopleToBasecampIdMap["john doe"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should remove any duplicate names when helpers are specified more than once", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Bob Brown, Alice Johnson, Bob Brown, UCSD";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const memberMapMock: MemberMap = {};
        memberMapMock["john doe"] = getRandomlyGeneratedMember();
        memberMapMock["john doe"].gender = "Male";
        memberMapMock["jane smith"] = getRandomlyGeneratedMember();
        memberMapMock["jane smith"].gender = "Female";
        memberMapMock["alice johnson"] = getRandomlyGeneratedMember();
        memberMapMock["alice johnson"].gender = "Female";
        memberMapMock["bob brown"] = getRandomlyGeneratedMember();
        memberMapMock["bob brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "john doe": randomstring.generate(),
            "jane smith": randomstring.generate(),
            "alice johnson": randomstring.generate(),
            "bob brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "ucsd": ["john doe", "alice johnson"] },
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: [peopleToBasecampIdMap["bob brown"], peopleToBasecampIdMap["alice johnson"], peopleToBasecampIdMap["john doe"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should return the group members when there is no role specified", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "John Doe, Jane Smith, Alice Johnson, Bob Brown";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = helpersValueMock;

        const memberMapMock: MemberMap = {};
        memberMapMock["john doe"] = getRandomlyGeneratedMember();
        memberMapMock["john doe"].gender = "Male";
        memberMapMock["jane smith"] = getRandomlyGeneratedMember();
        memberMapMock["jane smith"].gender = "Female";
        memberMapMock["alice johnson"] = getRandomlyGeneratedMember();
        memberMapMock["alice johnson"].gender = "Female";
        memberMapMock["bob brown"] = getRandomlyGeneratedMember();
        memberMapMock["bob brown"].gender = "Male";

        const peopleToBasecampIdMap: { [name: string]: string } = {
            "john doe": randomstring.generate(),
            "jane smith": randomstring.generate(),
            "alice johnson": randomstring.generate(),
            "bob brown": randomstring.generate(),
        };

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => peopleToBasecampIdMap.hasOwnProperty(personName) ? peopleToBasecampIdMap[personName] : randomstring.generate()),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: undefined, helperIds: [peopleToBasecampIdMap["john doe"], peopleToBasecampIdMap["jane smith"], peopleToBasecampIdMap["alice johnson"], peopleToBasecampIdMap["bob brown"]] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });
});

describe("clearAllRowMetadata", () => {

});

describe("getRoleTodoMap", () => {

});

describe("getSavedScheduleEntryId", () => {
    it("should throw a RowMissingIdError when the row does not have an id", () => {
        const getValueMock = jest.fn(() => null);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        expect(() => getSavedScheduleEntryId(row)).toThrow(RowMissingIdError);
    });

    it("should throw a RowBasecampMappingMissingError when the row does not have a Basecamp mapping", () => {
        const rowIdMock: string = randomstring.generate();
        const getValueMock = jest.fn(() => rowIdMock);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        jest.mock('../src/main/propertiesService', () => ({
            getDocumentProperty: jest.fn(() => null),
        }));

        const { getSavedScheduleEntryId } = require("../src/main/row");

        expect(() => getSavedScheduleEntryId(row)).toThrow(new RowBasecampMappingMissingError("The rowBasecampMapping object is null!"));
    });

    it("should return the saved schedule entry id when the row has a basecamp mapping", () => {
        const rowIdMock: string = randomstring.generate();
        const getValueMock = jest.fn(() => rowIdMock);
        const metataMock: Metadata = getRandomlyGeneratedMetadata();
        metataMock.getValue = getValueMock;
        const row: Row = getRandomlyGeneratedRow();
        row.metadata = metataMock;

        const rowBasecampMappingMock: RowBasecampMapping = getRandomlyGeneratedRowBasecampMapping();
        jest.mock('../src/main/propertiesService', () => ({
            getDocumentProperty: jest.fn(() => JSON.stringify(rowBasecampMappingMock)),
        }));

        const { getSavedScheduleEntryId } = require("../src/main/row");
                
        const receivedScheduleEntryId: string = getSavedScheduleEntryId(row);

        expect(receivedScheduleEntryId).toStrictEqual(rowBasecampMappingMock.scheduleEntryId);
    });
});

describe("hasBasecampAttendees", () => {
    it("should true when there are basecamp attendees for the row", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        rowMock.who = "Rotation";
        rowMock.inCharge = getRandomlyGeneratedText(1);
        rowMock.inCharge.value = "John Doe";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = "Jane Smith, Alice Johnson";

        jest.mock("../src/main/groups", () => ({
            GROUP_NAMES: ["ucsd"],
            GROUPS_MAP: { "ucsd": ["john doe", "jane smith", "alice johnson"] },
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn(() => randomstring.generate()),
        }));

        const { hasBasecampAttendees } = require("../src/main/row");

        const hasAttendees: boolean = hasBasecampAttendees(rowMock);
        expect(hasAttendees).toBe(true);
    });

    it("should false when there are no basecamp attendees for the row", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        rowMock.who = "Rotation";
        rowMock.inCharge = getRandomlyGeneratedText(1);
        rowMock.inCharge.value = "";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = "";

        jest.mock("../src/main/groups", () => ({
            GROUP_NAMES: ["ucsd"],
            GROUPS_MAP: { "ucsd": ["john doe", "jane smith", "alice johnson"] },
        }));

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn(() => randomstring.generate()),
        }));

        const { hasBasecampAttendees } = require("../src/main/row");

        const hasAttendees: boolean = hasBasecampAttendees(rowMock);
        expect(hasAttendees).toBe(false);
    });
});

describe("getScheduleEntryRequestForRow", () => {
    it("should return a schedule entry request when given a row", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        rowMock.domain = "College";
        rowMock.who = "UCSD";
        rowMock.inCharge = getRandomlyGeneratedText(1);
        rowMock.inCharge.value = "John Doe";
        rowMock.helpers = getRandomlyGeneratedText(1);
        rowMock.helpers.value = "Jane Smith, Alice Johnson";
        const roleTodoMapMock: RoleTodoMap = getRandomlyGeneratedRoleTodoMap();

        jest.mock("../src/main/groups", () => ({
            GROUP_NAMES: ["ucsd"],
            GROUPS_MAP: { "ucsd": ["john doe", "jane smith", "alice johnson"] },
            getMembersFromGroups: jest.fn(() => ["john doe", "jane smith", "alice johnson"]),
        }));

        const PEOPLE_MAP: { [name: string]: string } = {
            "john doe": "1",
            "jane smith": "2",
            "alice johnson": "3",
        };  

        jest.mock("../src/main/people", () => ({
            normalizePersonName: jest.fn((personName) => personName.toLowerCase().trim()),
            getPersonId: jest.fn((personName) => PEOPLE_MAP.hasOwnProperty(personName) ? PEOPLE_MAP[personName] : randomstring.generate()),
        }));

        const { getScheduleEntryRequestForRow } = require("../src/main/row");

        const scheduleEntryRequest: BasecampScheduleEntryRequest = getScheduleEntryRequestForRow(rowMock, roleTodoMapMock);
        expect(scheduleEntryRequest).toBeDefined();
        expect(scheduleEntryRequest.summary).toContain("UCSD");
        expect(scheduleEntryRequest.summary).toContain(rowMock.what.value);
        expect(scheduleEntryRequest.starts_at).toStrictEqual(rowMock.startTime.toISOString());
        expect(scheduleEntryRequest.ends_at).toStrictEqual(rowMock.endTime.toISOString());
        rowMock.where.tokens.forEach((token) => expect(scheduleEntryRequest.description).toContain(token.value));
        expect(scheduleEntryRequest.description).toContain(rowMock.inCharge.value);
        expect(scheduleEntryRequest.description).toContain(rowMock.helpers.value);
        Object.values(roleTodoMapMock).forEach((todo) => expect(scheduleEntryRequest.description).toContain(todo.url));
        rowMock.notes.tokens.forEach((token) => expect(scheduleEntryRequest.description).toContain(token.value));
        expect(scheduleEntryRequest.participant_ids).toContain(PEOPLE_MAP["john doe"]);
        expect(scheduleEntryRequest.participant_ids).toContain(PEOPLE_MAP["jane smith"]);
        expect(scheduleEntryRequest.participant_ids).toContain(PEOPLE_MAP["alice johnson"]);
    });
});
