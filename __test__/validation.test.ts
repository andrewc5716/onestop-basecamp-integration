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
                        "HG2": ['Andrew Chan', 'Janice Chan']
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
                        "Andrew/Janice": ['Andrew Chan', 'Janice Chan']
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
                        "Andrew Chan": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"}
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
                        "HG2": ['Andrew Chan', 'Janice Chan']
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
                        "SDSU": ['Josh Wong']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "Josh Wong": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
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
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU, Jack/Angel\nFood: Andrew Chan\nJanice Chan")).toBe("");
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
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU staff")).toBe("");
    });

    it("should report invalid helper identifiers in the presence of valid helper identifiers", () => {
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
        const { validateHelperCellText } = require("../src/main/validation");

        expect(validateHelperCellText("SDSU, Jack/Angel, Josh/Isaac\nFood: Andrew Chan\nJanice Chan")).toBe("Invalid identifier(s): Josh/Isaac");
    });

    it("should report helper identifiers with invalid filters", () => {
        jest.mock('../src/main/propertiesService', () => ({
            loadMapFromScriptProperties: jest.fn((key: string) => {
                if (key === "GROUPS_MAP") {
                    return {
                        "SDSU": ['Josh Wong']
                    }
                } else if (key === "MEMBER_MAP") {
                    return {
                        "Josh Wong": {"gender": "Male"}
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
                        "HG2": ['Andrew Chan', 'Janice Chan']
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
                        "Andrew/Janice": ['Andrew Chan', 'Janice Chan']
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
                        "Josh Wong": {"gender": "Male"}
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
                        "Andrew Chan": {"gender": "Male"},
                        "Janice Chan": {"gender": "Female"},
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
        const { validateLeadCellText } = require("../src/main/validation");

        expect(validateLeadCellText("SDSU, Jack/Angel\nFood: Andrew Chan\nJanice Chan")).toBe("Invalid identifier(s): SDSU, Food: Andrew Chan");
    });
});