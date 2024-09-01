import {setProperties} from './main/dbPropertiesService'
import {useProperties} from './main/dbPropertiesService'
import {onOpen} from './main/menu'

// Re-export all the exports from `menu` module into Webpack `globalThis` scope, so they are available at runtime
// for the Google Apps Script to call.
export * from './main/menu'
export * from './main/dbPropertiesService'

// Assign `global` so gas-webpack-plugin will generate a stub for `onOpen` in the top-level scope. A top-level
// declaration is needed for Google Apps Script to detect the function, so it is available as a trigger.
global.onOpen = onOpen;
global.setProperties = setProperties;
global.useProperties = useProperties;
