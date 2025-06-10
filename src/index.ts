import { onOpen } from './main/menu';

export * from './main/aliases';
export * from './main/basecamp';
export * from './main/filter';
export * from './main/groups';
export * from './main/main';
export * from './main/members';
export * from './main/people';
export * from './main/propertiesService';
export * from './main/row';
export * from './main/scan';
export * from './main/todos';
export * from './main/schedule';
export * from './main/utils';
export * from './main/validation';

// Re-export all the exports from `menu` module into Webpack `globalThis` scope, so they are available at runtime
// for the Google Apps Script to call.
export * from './main/menu';

// Assign `global` so gas-webpack-plugin will generate a stub for `onOpen` in the top-level scope. A top-level
// declaration is needed for Google Apps Script to detect the function, so it is available as a trigger.
global.onOpen = onOpen;

// Also assign the trigger function to global scope
import { onSpreadsheetChange } from './main/validation';
global.onSpreadsheetChange = onSpreadsheetChange;