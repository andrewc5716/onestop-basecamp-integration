import { Logger, PropertiesService, SpreadsheetApp } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;
global.SpreadsheetApp = SpreadsheetApp;
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

describe("onSpreadsheetChange", () => {
    let mockSpreadsheet: any;
    let mockSheet: any;
    let mockActiveRange: any;
    let mockRange: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRange = {
            setFormula: jest.fn()
        };
        mockSheet = {
            getName: jest.fn().mockReturnValue('MON 8/13'),
            getRange: jest.fn().mockReturnValue(mockRange)
        };
        mockActiveRange = {
            getRow: jest.fn().mockReturnValue(5),
            getNumRows: jest.fn().mockReturnValue(2)
        };
        mockSpreadsheet = {
            getActiveRange: jest.fn().mockReturnValue(mockActiveRange)
        };
        jest.spyOn(SpreadsheetApp, "getActiveSheet").mockReturnValue(mockSheet);
        
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn()
        }));
    });

    it("should return early for non-INSERT_ROW events", () => {
        const mockEvent = {
            changeType: 'EDIT',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        onSpreadsheetChange(mockEvent);

        expect(SpreadsheetApp.getActiveSheet).not.toHaveBeenCalled();
    });

    it("should return early if sheet is not an active daily tab", () => {
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn().mockReturnValue(false)
        }));
        
        const mockEvent = {
            changeType: 'INSERT_ROW',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        onSpreadsheetChange(mockEvent);

        expect(SpreadsheetApp.getActiveSheet).toHaveBeenCalled();
    });

    it("should process inserted rows when conditions are met", () => {
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn().mockReturnValue(true)
        }));
        
        const mockEvent = {
            changeType: 'INSERT_ROW',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        onSpreadsheetChange(mockEvent);

        expect(SpreadsheetApp.getActiveSheet).toHaveBeenCalled();
        expect(mockSpreadsheet.getActiveRange).toHaveBeenCalled();
    });

    it("should handle missing active range gracefully", () => {
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn().mockReturnValue(true)
        }));
        mockSpreadsheet.getActiveRange.mockReturnValue(null);
        
        const mockEvent = {
            changeType: 'INSERT_ROW',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        onSpreadsheetChange(mockEvent);
    });

    it("should add validation formulas for multiple inserted rows", () => {
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn().mockReturnValue(true)
        }));
        jest.spyOn(mockActiveRange, 'getRow').mockReturnValue(3);
        jest.spyOn(mockActiveRange, 'getNumRows').mockReturnValue(3);

        const mockEvent = {
            changeType: 'INSERT_ROW',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        onSpreadsheetChange(mockEvent);

        // Should call getRange for both validation columns for each row (3 rows × 2 columns = 6 calls)
        expect(mockSheet.getRange).toHaveBeenCalledTimes(6);
        
        // Check that validation formulas are set for rows 3, 4, and 5
        expect(mockSheet.getRange).toHaveBeenCalledWith(3, 12); // Row 3, Column L
        expect(mockSheet.getRange).toHaveBeenCalledWith(3, 13); // Row 3, Column M
        expect(mockSheet.getRange).toHaveBeenCalledWith(4, 12); // Row 4, Column L
        expect(mockSheet.getRange).toHaveBeenCalledWith(4, 13); // Row 4, Column M
        expect(mockSheet.getRange).toHaveBeenCalledWith(5, 12); // Row 5, Column L
        expect(mockSheet.getRange).toHaveBeenCalledWith(5, 13); // Row 5, Column M
        
        // Check that the correct formulas are set for each row
        expect(mockRange.setFormula).toHaveBeenCalledWith('=validateLeadCellText(H3)');
        expect(mockRange.setFormula).toHaveBeenCalledWith('=validateHelperCellText(I3)');
        expect(mockRange.setFormula).toHaveBeenCalledWith('=validateLeadCellText(H4)');
        expect(mockRange.setFormula).toHaveBeenCalledWith('=validateHelperCellText(I4)');
        expect(mockRange.setFormula).toHaveBeenCalledWith('=validateLeadCellText(H5)');
        expect(mockRange.setFormula).toHaveBeenCalledWith('=validateHelperCellText(I5)');
    });

    it("should handle errors gracefully", () => {
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn().mockReturnValue(true)
        }));
        jest.spyOn(mockSpreadsheet, 'getActiveRange').mockImplementation(() => {
            throw new Error('Test error');
        });
        
        const mockEvent = {
            changeType: 'INSERT_ROW',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        onSpreadsheetChange(mockEvent);

        // The function should not throw and should handle the error
        expect(SpreadsheetApp.getActiveSheet).toHaveBeenCalled();
    });

    it("should use correct change type constant", () => {
        jest.mock('../src/main/scan', () => ({
            isDailyTab: jest.fn().mockReturnValue(true)
        }));

        const mockEvent = {
            changeType: 'INSERT_ROW',
            source: mockSpreadsheet
        } as any;

        const { onSpreadsheetChange } = require('../src/main/validation');
        
        // Test that it only processes INSERT_ROW
        onSpreadsheetChange(mockEvent);
        expect(SpreadsheetApp.getActiveSheet).toHaveBeenCalled();

        // Test that other change types are ignored
        const otherEvent = {
            changeType: 'EDIT',
            source: mockSpreadsheet
        } as any;

        jest.clearAllMocks();
        onSpreadsheetChange(otherEvent);
        expect(SpreadsheetApp.getActiveSheet).not.toHaveBeenCalled();
    });
});