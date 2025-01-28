import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;

import { containsFilter, isFilter, removeFilters } from "../src/main/filter";
import { getRandomlyGeneratedMember } from "./testUtils";

describe("removeFilters", () => {
    it("should return the original string and an empty array when the input string does not contain any filters", () => {
        const inputString: string = "igsm";
        const expectedOutput: { stringWithoutFilters: string, removedFilters: string[] } = { stringWithoutFilters: inputString, removedFilters: [] };
        expect(removeFilters(inputString)).toStrictEqual(expectedOutput);
    });

    it("should remove a filter from the input string when the input string contains a filter", () => {
        const inputString: string = "igsm Bros";
        const expectedOutput: { stringWithoutFilters: string, removedFilters: string[] } = { stringWithoutFilters: "igsm", removedFilters: ["bros"] };
        expect(removeFilters(inputString)).toStrictEqual(expectedOutput);
    });

    it("should remove multiple filters from the input string when the input string contains multiple filters", () => {
        const inputString: string = "igsm Married Bros";
        const expectedOutput: { stringWithoutFilters: string, removedFilters: string[] } = { stringWithoutFilters: "igsm", removedFilters: ["bros", "married"] };
        expect(removeFilters(inputString)).toStrictEqual(expectedOutput);
    });
});

describe("containsFilter", () => {
    it("should return true when the input string contains a filter", () => {
        const inputString: string = "igsm Bros";
        expect(containsFilter(inputString)).toBeTruthy();
    });

    it("should return false when the input string does not contain a filter", () => {
        const inputString: string = "IGSM";
        expect(containsFilter(inputString)).toBeFalsy();
    });
});

describe("isFilter", () => {
    it("should return true when the given string does correspond to a filter", () => {
        expect(isFilter("Bros")).toBeTruthy();
    });

    it("should return false when the given string does correspond to a filter", () => {
        expect(isFilter("John Doe")).toBeFalsy();
    });
});

describe("filterMembers", () => {
    it("should return an empty list when the group members list is empty", () => {
        const groupMembersMock: string[] = [];
        const filterListMock: string[] = [];

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
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = [];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should return the same list of group members when the filter list is empty", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = [];

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
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should remove invalid members when the group members list contains invalid members", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Charles Davis", "Alice Johnson", "Emily Clark", "Bob Brown"];
        const filterListMock: string[] = ["Bros"];

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
        }));

        const { filterMembers } = require("../src/main/filter");

        const filteredMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Bob Brown"];
        expect(filteredMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should ignore invalid filters when there are invalid filters in the filter list", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Married", "Bad Filter"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].married = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].married = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].married = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].married = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Jane Smith"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out the sisters when the Bros filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Bros"];

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
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Bob Brown"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out the brothers when the Sis filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Sis"];

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
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["Jane Smith", "Alice Johnson"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out the non-married when the Married filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Married"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].married = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].married = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].married = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].married = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Jane Smith"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out the non-parents when the Parents filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Parents"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].parent = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].parent = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].parent = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].parent = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Jane Smith"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out non-dads when the Dads filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Dads"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["John Doe"].parent = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Jane Smith"].parent = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Alice Johnson"].parent = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";
        memberMapMock["Bob Brown"].parent = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out non-moms when the Moms filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Moms"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["John Doe"].parent = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Jane Smith"].parent = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Alice Johnson"].parent = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";
        memberMapMock["Bob Brown"].parent = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["Jane Smith"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out moms when the Minus Moms filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Minus Moms"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["John Doe"].parent = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Jane Smith"].parent = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Alice Johnson"].parent = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";
        memberMapMock["Bob Brown"].parent = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe", "Alice Johnson", "Bob Brown"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should filter out non-dads when the Dads filter is specified", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Minus Dads"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["John Doe"].parent = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Jane Smith"].parent = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Alice Johnson"].parent = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";
        memberMapMock["Bob Brown"].parent = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["Jane Smith", "Alice Johnson", "Bob Brown"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });

    it("should apply multiple filters to the group members list when there are multiple filters in the filter list", () => {
        const groupMembersMock: string[] = ["John Doe", "Jane Smith", "Alice Johnson", "Bob Brown"];
        const filterListMock: string[] = ["Bros", "Married"];

        const memberMapMock: MemberMap = {};
        memberMapMock["John Doe"] = getRandomlyGeneratedMember();
        memberMapMock["John Doe"].gender = "Male";
        memberMapMock["John Doe"].married = true;
        memberMapMock["Jane Smith"] = getRandomlyGeneratedMember();
        memberMapMock["Jane Smith"].gender = "Female";
        memberMapMock["Jane Smith"].married = true;
        memberMapMock["Alice Johnson"] = getRandomlyGeneratedMember();
        memberMapMock["Alice Johnson"].gender = "Female";
        memberMapMock["Alice Johnson"].married = false;
        memberMapMock["Bob Brown"] = getRandomlyGeneratedMember();
        memberMapMock["Bob Brown"].gender = "Male";
        memberMapMock["Bob Brown"].married = false;

        jest.mock("../src/main/members", () => ({
            MEMBER_MAP: memberMapMock,
        }));

        const { filterMembers } = require("../src/main/filter");

        const filtertedMembers: string[] = filterMembers(groupMembersMock, filterListMock);

        const expectedFilteredMembers: string[] = ["John Doe"];
        expect(filtertedMembers).toStrictEqual(expectedFilteredMembers);
    });
});
