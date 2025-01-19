import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;
import {isHelperCellValid} from "../src/main/validation";

describe("isHelperCellValid", () => {
    it("should allow empty", () => {
        expect(isHelperCellValid("")).toBeTruthy();
    });

    it("should reject undefined helper", () => {
        expect(isHelperCellValid("undefined")).toBeFalsy();
    })

    it("should allow a group name", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "HG2": ['Andrew Chan', 'Janice Chan']
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("HG2")).toBeTruthy();
    });

    it("should allow an alias", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "ALIASES_MAP") {
                    return {
                        "Andrew/Janice": ['Andrew Chan', 'Janice Chan']
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("Andrew/Janice")).toBeTruthy();
    });

    it("should allow a valid member name", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("Andrew Chan")).toBeTruthy();
    });

    it("should allow a valid member name with city", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("Andrew Chan (Sd)")).toBeTruthy();
    });

    it("should allow for role text", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("Food: Andrew Chan")).toBeTruthy();
    });

    it("should allow for filters", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "HG2": ['Andrew Chan', 'Janice Chan']
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("HG2 Bros")).toBeTruthy();
    });

    it("should allow for multiple lines", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("Andrew Chan\nJanice Chan\nJosh Wong")).toBeTruthy();
    });

    it("should allow for comma separated list", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("Andrew Chan, Janice Chan, Josh Wong")).toBeTruthy();
    });

    it("should allow for empty entries between commas", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid(",,,,Andrew Chan,,,Janice Chan,,,")).toBeTruthy();
    });

    it("should allow for mixing groups, aliases, and members", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "SDSU": ['Josh Wong']
                    }
                } else if (key === "ALIASES_MAP") {
                    return {
                        "Jack/Angel": ['Jack Zhang', 'Angel Zhang']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("SDSU, Jack/Angel\nFood: Andrew Chan\nJanice Chan")).toBeTruthy();
    });

    it("should allow the word staff", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "SDSU": ['Josh Wong']
                    }
                }
                return {};
            }),
        }));
        const { isHelperCellValid } = require("../src/main/validation");

        expect(isHelperCellValid("SDSU staff")).toBeTruthy();
    });
});