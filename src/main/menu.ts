export const onOpen = (e: OpenEvent) => {
  const tabSyncMenu: GoogleAppsScript.Base.Menu = SpreadsheetApp.getUi()
    .createMenu('OneStop Utils');

  tabSyncMenu.addToUi();
}
