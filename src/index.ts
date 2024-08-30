import {onOpen} from './main/menu';

export * from './main/basecamp';
export * from './main/metadata';
export * from './main/scan';

// Re-export all the exports from `menu` module into Webpack `globalThis` scope, so they are available at runtime
// for the Google Apps Script to call.
export * from './main/menu';

// Assign `global` so gas-webpack-plugin will generate a stub for `onOpen` in the top-level scope. A top-level
// declaration is needed for Google Apps Script to detect the function, so it is available as a trigger.
global.onOpen = onOpen;
