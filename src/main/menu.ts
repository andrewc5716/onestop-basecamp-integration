export { importOnestopToBasecamp } from "./main"

/**
 * Adds/updates a Basecamp menu item at the top of the Onestop with an 'Assign Basecamp Tasks' button
 * for users to manually kick off the importOneStopToBasecamp() function
 * 
 * NOTE: Run this function manually in the AppScript Editor whenever there is a change in the menu
 */

export const updateManualTriggerMenuUiOnOneStop = () => {

  console.log("Updating OneStop menu...")
  const tabSyncMenu: GoogleAppsScript.Base.Menu = SpreadsheetApp.getUi()
    .createMenu('Basecamp')
    .addItem('Assign Basecamp Tasks', 'importOnestopToBasecamp')

  tabSyncMenu.addToUi()
}