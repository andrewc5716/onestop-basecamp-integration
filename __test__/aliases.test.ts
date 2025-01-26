import { Logger, PropertiesService } from 'gasmask';
global.Logger = Logger;
global.PropertiesService = PropertiesService;

import { mergeAliasMaps } from "../src/main/aliases";
import { getRandomlyGeneratedAliasMap, Mock } from "./testUtils";
import randomstring from "randomstring";

describe("ALIASES_MAP", () => {
    it("should return the aliases map from the script properties when it is present", () => {
        const aliasesMapMock: AliasMap = getRandomlyGeneratedAliasMap();

        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => aliasesMapMock),
        }));
        
        const { ALIASES_MAP } = require('../src/main/aliases');

        expect(ALIASES_MAP).toEqual(aliasesMapMock);
    });

    it("should return an empty map when there is no aliases map present in the script properties", () => {
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
        }));

        const { ALIASES_MAP } = require('../src/main/aliases');

        expect(ALIASES_MAP).toStrictEqual({});
    });
});

describe("saveAliasMap", () => {
    it("should save the given alias map to the script properties when the function is called", () => {
        const aliasMapMock: AliasMap = getRandomlyGeneratedAliasMap();

        const setScriptPropertyMock: Mock = jest.fn();
        jest.mock("../src/main/propertiesService", () => ({
            loadMapFromScriptProperties: jest.fn(() => ({})),
            setScriptProperty: setScriptPropertyMock,
        }));

        const { saveAliasMap } = require('../src/main/aliases');
        saveAliasMap(aliasMapMock);

        expect(setScriptPropertyMock).toHaveBeenCalledWith("ALIASES_MAP", JSON.stringify(aliasMapMock));
    });
});

describe("mergeAliasMaps", () => {
    it("should merge the two alias maps when there are no overlaps", () => {
        const firstAliasMap: AliasMap = { "John D": [randomstring.generate()] };
        const secondAliasMap: AliasMap = { "Mary B": [randomstring.generate()] };
        const expectedMergedAliasMap: AliasMap = {
            "John D": firstAliasMap["John D"],
            "Mary B": secondAliasMap["Mary B"],
        };

        const mergedAliasMap: AliasMap = mergeAliasMaps(firstAliasMap, secondAliasMap);
        expect(mergedAliasMap).toStrictEqual(expectedMergedAliasMap);
    });

    it("should add duplicate aliases to the member list when there are duplicate aliases", () => {
        const firstAliasMap: AliasMap = { "John": [randomstring.generate()] };
        const secondAliasMap: AliasMap = { "John": [randomstring.generate()] };
        const expectedMergedAliasMap: AliasMap = {
            "John": [firstAliasMap["John"][0], secondAliasMap["John"][0]],
        };

        const mergedAliasMap: AliasMap = mergeAliasMaps(firstAliasMap, secondAliasMap);
        expect(mergedAliasMap).toStrictEqual(expectedMergedAliasMap);
    });
});
