import { PropertiesService } from "gasmask";
import Properties from "gasmask/dist/Properties";
import { getRandomlyGeneratedGroupsMap } from "./testUtils";
global.PropertiesService = PropertiesService;

describe("loadMapFromScriptProperties", () => {
    it("should return an empty object when the requested map key cannot be found in the script properties", () => {
        const scriptPropertiesMock: Properties = new Properties();

        jest.spyOn(scriptPropertiesMock, "getProperty").mockReturnValue(null);
        jest.spyOn(PropertiesService, "getScriptProperties").mockReturnValue(scriptPropertiesMock);

        const { loadMapFromScriptProperties } = require('../src/main/propertiesService');

        const retrievedMap: Object = loadMapFromScriptProperties("BAD_MAP_KEY");
        expect(retrievedMap).toStrictEqual({});
    });

    it("should parse and return the JSON object when the requested map key is found in the script properties", () => {
        const groupsMapMock: GroupsMap = getRandomlyGeneratedGroupsMap();
        const scriptPropertiesMock: Properties = new Properties();

        jest.spyOn(scriptPropertiesMock, "getProperty").mockReturnValue(JSON.stringify(groupsMapMock));
        jest.spyOn(PropertiesService, "getScriptProperties").mockReturnValue(scriptPropertiesMock);

        const { loadMapFromScriptProperties } = require('../src/main/propertiesService');

        const retrievedMap: Object = loadMapFromScriptProperties("MAP_KEY");
        expect(retrievedMap).toStrictEqual(groupsMapMock);
    });
});
