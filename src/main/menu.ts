export { assignBaseCampTasks } from "./main"

export const updateManualTriggerMenuUiOnOneStop = () => {

  console.log("Updating OneStop Utils menu...")
  const tabSyncMenu: GoogleAppsScript.Base.Menu = SpreadsheetApp.getUi()
    .createMenu('OneStop Utils')
    .addItem('Assign Basecamp Tasks', 'assignBaseCampTasks')

  tabSyncMenu.addToUi()
}