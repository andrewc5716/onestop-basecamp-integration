import { PropertiesService } from 'gasmask';
global.PropertiesService = PropertiesService;
import {validateHelperCellText, validateLeadCellText} from "../src/main/validation";

describe("validateHelperCellText", () => {
    it("should allow empty", () => {
        expect(validateHelperCellText("")).toBe("");
    });

    it("should allow a group name", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "hg2": ['andrew chan', 'janice chan']
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("HG2")).toBe("");
    });

    it("should allow an alias", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "ALIASES_MAP") {
                    return {
                        "andrew/janice": ['andrew chan', 'janice chan']
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("Andrew/Janice")).toBe("");
    });

    it("should allow a valid member name", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("Andrew Chan")).toBe("");
    });

    it("should allow a valid member name with city", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("Andrew Chan (Sd)")).toBe("");
    });

    it("should allow for role text", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("Food: Andrew Chan")).toBe("");
    });

    it("should allow for filters", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "hg2": ['andrew chan', 'janice chan']
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("HG2 Bros")).toBe("");
    });

    it("should report helper identifiers with invalid filters", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "sdsu": ['josh wong']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU Brs")).toBe("Invalid identifier(s): SDSU Brs");
    });

    it("should allow for multiple lines", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("Andrew Chan\nJanice Chan\nJosh Wong")).toBe("");
    });

    it("should allow for comma separated list", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("Andrew Chan, Janice Chan, Josh Wong")).toBe("");
    });

    it("should allow for empty entries between commas", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText(",,,,Andrew Chan,,,Janice Chan,,,")).toBe("");
    });

    it("should allow for mixing groups, aliases, and members", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "sdsu": ['josh wong']
                    }
                } else if (key === "ALIASES_MAP") {
                    return {
                        "jack/angel": ['jack zhang', 'angel zhang']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU, Jack/Angel\nFood: Andrew Chan\nJanice Chan")).toBe("");
    });

    it("should allow the word staff", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "sdsu": ['josh wong']
                    }
                }
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU staff")).toBe("");
    });

    it("should report invalid helper identifiers in the presence of valid helper identifiers", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "sdsu": ['Josh Wong']
                    }
                } else if (key === "ALIASES_MAP") {
                    return {
                        "jack/angel": ['Jack Zhang', 'Angel Zhang']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU, Jack/Angel, Josh/Isaac\nFood: Andrew Chan\nJanice Chan")).toBe("Invalid identifier(s): Josh/Isaac");
    });

    it("should report helper identifiers with invalid filters", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "sdsu": ['josh wong']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU Brs")).toBe("Invalid identifier(s): SDSU Brs");
    });
});

describe("validateLeadCellText", ()=> {
    it("should allow empty", () => {
        expect(validateLeadCellText("")).toBe("");
    });

    it("should reject a group name", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "hg2": ['andrew chan', 'janice chan']
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("HG2")).toBe("Invalid identifier(s): HG2");
    });

    it("should allow an alias", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "ALIASES_MAP") {
                    return {
                        "andrew/janice": ['andrew chan', 'janice chan']
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("Andrew/Janice")).toBe("");
    });

    it("should allow for comma separated list", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("Andrew Chan, Janice Chan, Josh Wong")).toBe("");
    });

    it("should allow for separated list", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("Andrew Chan, Janice Chan, Josh Wong")).toBe("");
    });

    it("should allow for multiple lines", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                        "josh wong": {"gender": "Male"}
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("Andrew Chan\nJanice Chan\nJosh Wong")).toBe("");
    });

    it("should allow for empty entries between commas", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "andrew chan": {"gender": "Male"},
                        "janice chan": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText(",,,,Andrew Chan,,,Janice Chan,,,")).toBe("");
    });

    it("should report invalid aliases, and members", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "MEMBER_MAP") {
                    return {
                        "janice chan": {"gender": "Female"},
                        "jack zhang": {"gender": "Male"},
                        "angel zhang": {"gender": "Female"},
                    }
                } 
                return {};
            }),
        }));
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("Jack/Angel\nFood: Andrew Chan\nJanice Chan")).toBe("Invalid identifier(s): Jack/Angel, Andrew Chan");
    });

    it("should allow for a role", () => {
jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "ALIASES_MAP") {
                    return {
                        "kegan": ['kegan wong']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "kegan wong": {"gender": "Male"},
                    }
                } 
                return {};
            }),
        }));

        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("Tech: Kegan")).toBe("");
    });
});