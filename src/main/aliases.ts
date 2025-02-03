import { loadMapFromScriptProperties, setScriptProperty } from "./propertiesService";

const ALIASES_MAP_KEY: string = "ALIASES_MAP";

export const ALIASES_MAP: AliasMap = loadMapFromScriptProperties(ALIASES_MAP_KEY) as AliasMap;

export function saveAliasMap(aliasMap: AliasMap): void {
    setScriptProperty(ALIASES_MAP_KEY, JSON.stringify(aliasMap));
}

export function mergeAliasMaps(firstAliasMap: AliasMap, secondAliasMap: AliasMap): AliasMap {
    const finalAliasMap: AliasMap = { ...firstAliasMap};

    const aliases: string[] = Object.keys(secondAliasMap);
    for(const alias of aliases) {
        if(finalAliasMap.hasOwnProperty(alias)) {
            Logger.log(`Warning: Duplicate alias ${alias} detected`);
            finalAliasMap[alias] = finalAliasMap[alias].concat(secondAliasMap[alias]);
        } else {
            finalAliasMap[alias] = secondAliasMap[alias];
        }
    }

    return finalAliasMap;
}
