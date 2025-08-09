import randomstring from "randomstring";
import { getRandomlyGeneratedRow, getRandomlyGeneratedMetadata } from "./testUtils";

describe("hasChanged - Basecamp ID mapping", () => {
    beforeEach(() => {
        jest.resetModules();

        // Stub global Logger used inside the row module
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        global.Logger = { log: jest.fn() };

        // Stub for Utilities.computeDigest that produces a deterministic byte array based on
        // the input string – changes in the string lead to changes in the resulting array.
        // This allows us to detect hash input changes without needing crypto.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore – Utilities is injected globally in the production environment.
        global.Utilities = {
            DigestAlgorithm: { SHA_256: 0 },
            computeDigest: (_algo: any, input: string) => input.split("").map((c) => c.charCodeAt(0)),
        };
    });

    it("should return true when group membership changes affect lead resolution", () => {
        // Mutable map so we can simulate updates to group membership after the row is saved
        const groupMap: { [name: string]: string[] } = { 
            "tech": ["john doe", "jane smith"]
        };

        // Static person → id mapping
        const personIdMap: { [name: string]: string } = {
            "john doe": "id1",
            "jane smith": "id2",
            "bob wilson": "id3"
        };

        jest.doMock("../src/main/people", () => ({
            getPersonId: (name: string) => personIdMap[name.toLowerCase()],
            normalizePersonName: (name: string) => name.toLowerCase().trim(),
        }));

        jest.doMock("../src/main/aliases", () => ({ ALIASES_MAP: {} }));

        jest.doMock("../src/main/groups", () => ({
            GROUPS_MAP: groupMap,
            getMembersFromGroups: (groups: string[]) => {
                return groups.flatMap(g => groupMap[g.toLowerCase()] || []);
            },
            GROUP_NAMES: ["tech"],
        }));

        jest.doMock("../src/main/filter", () => ({
            containsFilter: () => false,
            removeFilters: (str: string) => ({ stringWithoutFilters: str, removedFilters: [] }),
            filterMembers: (members: string[]) => members,
            isFilter: () => false,
        }));

        // PropertiesService mock that lets us capture what saveRow writes and return it later
        let storedRowBasecampMapping: string | null = null;
        jest.doMock("../src/main/propertiesService", () => ({
            setDocumentProperty: (_k: string, v: string) => {
                storedRowBasecampMapping = v;
            },
            getDocumentProperty: () => storedRowBasecampMapping,
            loadMapFromScriptProperties: () => ({}),
        }));

        // Import module under test AFTER mocks are in place
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveRow, hasChanged } = require("../src/main/row");

        // Construct a deterministic row with a group as lead
        const row: Row = getRandomlyGeneratedRow();
        row.inCharge.value = "Tech";
        row.inCharge.tokens = [{ value: "Tech", hyperlink: null, strikethrough: false }];
        row.domain = "Tech";  // This is needed for group resolution
        row.who = "Tech";     // This is needed for group resolution
        row.helpers.value = "";
        row.helpers.tokens = [];

        // Provide a metadata object with a fixed id
        const rowId = randomstring.generate();
        const metadata = getRandomlyGeneratedMetadata();
        metadata.getValue = jest.fn(() => rowId);
        row.metadata = metadata;

        // Initial save – should store a hash based on current group members (John + Jane)
        saveRow(row, {}, undefined);
        expect(hasChanged(row)).toBe(false);

        // Update group membership to include a new member
        groupMap["tech"] = ["john doe", "jane smith", "bob wilson"];

        // Now the hash input should differ since the group resolves to different members
        expect(hasChanged(row)).toBe(true);
    });

    it("should return false when group membership is unchanged", () => {
        // Mutable map so we can simulate updates to group membership after the row is saved
        const groupMap: { [name: string]: string[] } = { 
            "tech": ["john doe", "jane smith"]
        };

        // Static person → id mapping
        const personIdMap: { [name: string]: string } = {
            "john doe": "id1",
            "jane smith": "id2",
            "bob wilson": "id3"
        };

        jest.doMock("../src/main/people", () => ({
            getPersonId: (name: string) => personIdMap[name.toLowerCase()],
            normalizePersonName: (name: string) => name.toLowerCase().trim(),
        }));

        jest.doMock("../src/main/aliases", () => ({ ALIASES_MAP: {} }));

        jest.doMock("../src/main/groups", () => ({
            GROUPS_MAP: groupMap,
            getMembersFromGroups: (groups: string[]) => {
                return groups.flatMap(g => groupMap[g.toLowerCase()] || []);
            },
            GROUP_NAMES: ["tech"],
        }));

        jest.doMock("../src/main/filter", () => ({
            containsFilter: () => false,
            removeFilters: (str: string) => ({ stringWithoutFilters: str, removedFilters: [] }),
            filterMembers: (members: string[]) => members,
            isFilter: () => false,
        }));

        // PropertiesService mock that lets us capture what saveRow writes and return it later
        let storedRowBasecampMapping: string | null = null;
        jest.doMock("../src/main/propertiesService", () => ({
            setDocumentProperty: (_k: string, v: string) => {
                storedRowBasecampMapping = v;
            },
            getDocumentProperty: () => storedRowBasecampMapping,
            loadMapFromScriptProperties: () => ({}),
        }));

        // Import module under test AFTER mocks are in place
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveRow, hasChanged } = require("../src/main/row");

        // Construct a deterministic row with a group as lead
        const row: Row = getRandomlyGeneratedRow();
        row.inCharge.value = "Tech";
        row.inCharge.tokens = [{ value: "Tech", hyperlink: null, strikethrough: false }];
        row.domain = "Tech";  // This is needed for group resolution
        row.who = "Tech";     // This is needed for group resolution
        row.helpers.value = "";
        row.helpers.tokens = [];

        // Provide a metadata object with a fixed id
        const rowId = randomstring.generate();
        const metadata = getRandomlyGeneratedMetadata();
        metadata.getValue = jest.fn(() => rowId);
        row.metadata = metadata;

        // Initial save – should store a hash based on current group members
        saveRow(row, {}, undefined);
        expect(hasChanged(row)).toBe(false);

        // Reassign same members in different order - should still be false since we sort
        groupMap["tech"] = ["jane smith", "john doe"];
        expect(hasChanged(row)).toBe(false);

        // Even assigning the exact same array should be false
        groupMap["tech"] = ["john doe", "jane smith"];
        expect(hasChanged(row)).toBe(false);
    });

    it("should return true when attendee resolution changes", () => {
        // Mutable map so we can simulate updates to group membership after the row is saved
        const groupMap: { [name: string]: string[] } = { 
            "hg1": ["alice", "bob", "charlie"],
            "hg2": ["david", "eve"]
        };

        // Static person → id mapping
        const personIdMap: { [name: string]: string } = {
            "alice": "id1",
            "bob": "id2",
            "charlie": "id3",
            "david": "id4",
            "eve": "id5",
            "frank": "id6"
        };

        jest.doMock("../src/main/people", () => ({
            getPersonId: (name: string) => personIdMap[name.toLowerCase()],
            normalizePersonName: (name: string) => name.toLowerCase().trim(),
        }));

        jest.doMock("../src/main/aliases", () => ({ ALIASES_MAP: {} }));

        jest.doMock("../src/main/groups", () => ({
            GROUPS_MAP: groupMap,
            getMembersFromGroups: (groups: string[]) => {
                return groups.flatMap(g => groupMap[g.toLowerCase()] || []);
            },
            GROUP_NAMES: ["hg1", "hg2"],
        }));

        jest.doMock("../src/main/filter", () => ({
            containsFilter: () => false,
            removeFilters: (str: string) => ({ stringWithoutFilters: str, removedFilters: [] }),
            filterMembers: (members: string[]) => members,
            isFilter: () => false,
        }));

        // PropertiesService mock that lets us capture what saveRow writes and return it later
        let storedRowBasecampMapping: string | null = null;
        jest.doMock("../src/main/propertiesService", () => ({
            setDocumentProperty: (_k: string, v: string) => {
                storedRowBasecampMapping = v;
            },
            getDocumentProperty: () => storedRowBasecampMapping,
            loadMapFromScriptProperties: () => ({}),
        }));

        // Import module under test AFTER mocks are in place
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveRow, hasChanged } = require("../src/main/row");

        // Construct a deterministic row with ministry groups in the who column
        const row: Row = getRandomlyGeneratedRow();
        row.who = "HG1,HG2";     // This should resolve to all members of both groups
        row.domain = "HG1,HG2";  // This is needed for group resolution
        row.inCharge.value = "Frank";  // Single lead not affected by group changes
        row.inCharge.tokens = [{ value: "Frank", hyperlink: null, strikethrough: false }];
        row.helpers.value = "";
        row.helpers.tokens = [];

        // Provide a metadata object with a fixed id
        const rowId = randomstring.generate();
        const metadata = getRandomlyGeneratedMetadata();
        metadata.getValue = jest.fn(() => rowId);
        row.metadata = metadata;

        // Initial save – should store a hash based on current group members
        saveRow(row, {}, undefined);
        expect(hasChanged(row)).toBe(false);

        // Update SWS group membership
        groupMap["hg1"] = ["alice", "bob", "charlie", "frank"];  // Added Frank

        // Now the hash input should differ since attendees resolve differently
        expect(hasChanged(row)).toBe(true);
    });

    it("should return false when attendee resolution is unchanged", () => {
        // Mutable map so we can simulate updates to group membership after the row is saved
        const groupMap: { [name: string]: string[] } = { 
            "hg1": ["alice", "bob", "charlie"],
            "hg2": ["david", "eve"]
        };

        // Static person → id mapping
        const personIdMap: { [name: string]: string } = {
            "alice": "id1",
            "bob": "id2",
            "charlie": "id3",
            "david": "id4",
            "eve": "id5",
            "frank": "id6"
        };

        jest.doMock("../src/main/people", () => ({
            getPersonId: (name: string) => personIdMap[name.toLowerCase()],
            normalizePersonName: (name: string) => name.toLowerCase().trim(),
        }));

        jest.doMock("../src/main/aliases", () => ({ ALIASES_MAP: {} }));

        jest.doMock("../src/main/groups", () => ({
            GROUPS_MAP: groupMap,
            getMembersFromGroups: (groups: string[]) => {
                return groups.flatMap(g => groupMap[g.toLowerCase()] || []);
            },
            GROUP_NAMES: ["hg1", "hg2"],
        }));

        jest.doMock("../src/main/filter", () => ({
            containsFilter: () => false,
            removeFilters: (str: string) => ({ stringWithoutFilters: str, removedFilters: [] }),
            filterMembers: (members: string[]) => members,
            isFilter: () => false,
        }));

        // PropertiesService mock that lets us capture what saveRow writes and return it later
        let storedRowBasecampMapping: string | null = null;
        jest.doMock("../src/main/propertiesService", () => ({
            setDocumentProperty: (_k: string, v: string) => {
                storedRowBasecampMapping = v;
            },
            getDocumentProperty: () => storedRowBasecampMapping,
            loadMapFromScriptProperties: () => ({}),
        }));

        // Import module under test AFTER mocks are in place
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { saveRow, hasChanged } = require("../src/main/row");

        // Construct a deterministic row with ministry groups in the who column
        const row: Row = getRandomlyGeneratedRow();
        row.who = "HG1,HG2";     // This should resolve to all members of both groups
        row.domain = "HG1,HG2";  // This is needed for group resolution
        row.inCharge.value = "Frank";  // Single lead not affected by group changes
        row.inCharge.tokens = [{ value: "Frank", hyperlink: null, strikethrough: false }];
        row.helpers.value = "";
        row.helpers.tokens = [];

        // Provide a metadata object with a fixed id
        const rowId = randomstring.generate();
        const metadata = getRandomlyGeneratedMetadata();
        metadata.getValue = jest.fn(() => rowId);
        row.metadata = metadata;

        // Initial save – should store a hash based on current group members
        saveRow(row, {}, undefined);
        expect(hasChanged(row)).toBe(false);

        // Reassign same members in different order - should still be false since we sort
        groupMap["hg1"] = ["charlie", "alice", "bob"];
        groupMap["hg2"] = ["eve", "david"];
        expect(hasChanged(row)).toBe(false);

        // Even assigning the exact same arrays should be false
        groupMap["hg1"] = ["alice", "bob", "charlie"];
        groupMap["hg2"] = ["david", "eve"];
        expect(hasChanged(row)).toBe(false);
    });
}); 