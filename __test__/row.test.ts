// Mock PropertiesService must be imported and set before the row module is imported
// and attempts to access the global PropertiesService object
import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;

import { generateIdForRow, getId, getMetadata, hasId } from "../src/main/row";
import { RowMissingIdError } from '../src/main/error/rowMissingIdError';
import { getRandomlyGeneratedMember, getRandomlyGeneratedMetadata, getRandomlyGeneratedRange, getRandomlyGeneratedRow, Mock } from './testUtils';

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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000000", "1000000001"] },
            { role: "Tech", helperIds: ["1000000002", "1000000003"] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should apply filters to all members of a HelperGroup when a filter is included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: John Doe, Jane Smith, Alice Johnson, Bob Brown, Bros";
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000000", "1000000003"] }
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Bob Brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000001", "1000000002", "1000000000", "1000000003"] }
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: { "John/Jane": ["John Doe", "Jane Smith"] },
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Bob Brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000000", "1000000001", "1000000002", "1000000003"] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand groups and apply filters to these members when both a group and a filter are included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: Bob Brown, Bros, Alice Johnson, UCSD";
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Jane Smith"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000003", "1000000000"] }
        ];

        const { getHelperGroups } = require("../src/main/row");

        const helperGroups: HelperGroup[] = getHelperGroups(rowMock);

        expect(helperGroups).toStrictEqual(expectedHelperGroups);
    });

    it("should expand aliases and apply filters to these members when both an alias and a filter are included in the list of helpers", () => {
        const rowMock: Row = getRandomlyGeneratedRow();
        const helpersValueMock: string = "Food: John/Jane, Alice Johnson, Bros, Bob Brown";
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: { "John/Jane": ["John Doe", "Jane Smith"] },
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Bob Brown"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000000", "1000000003"] }
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: { "UCSD": ["John Doe", "Jane Smith"] },
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: "Food", helperIds: ["1000000003", "1000000002", "1000000000"] }
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

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
            ALIASES_MAP: {},
        }));

        jest.mock("../src/main/groups", () => ({
            GROUPS_MAP: {},
        }));

        jest.mock("../src/main/people", () => ({
            getPersonId: jest.fn((personName) => {
                switch(personName) {
                    case "John Doe": 
                        return "1000000000";
                    case "Jane Smith":
                        return "1000000001";
                    case "Alice Johnson":
                        return "1000000002";
                    case "Bob Brown":
                        return "1000000003";
                    default:
                        return "1000000004";
                }
            }),
        }));

        const expectedHelperGroups: HelperGroup[] = [
            { role: undefined, helperIds: ["1000000000", "1000000001", "1000000002", "1000000003"] }
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
