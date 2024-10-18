/**
 * Adds/updates a Basecamp menu item at the top of the Onestop with an 'Assign Basecamp Tasks' button
 * for users to manually kick off the importOneStopToBasecamp() function
 * 
 * @param e the open event that gets raised whenever a user opens the sheet
 */

export const onOpen = (e: OpenEvent) => {
  Logger.log("Updating OneStop menu...");
  const tabSyncMenu: GoogleAppsScript.Base.Menu = SpreadsheetApp.getUi()
    .createMenu('Basecamp')
    .addItem('Assign Basecamp Tasks', 'importOnestopToBasecamp');

  tabSyncMenu.addToUi();
}