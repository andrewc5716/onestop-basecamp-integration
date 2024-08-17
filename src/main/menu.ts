export {addWeek} from './dailyTabs'

export const onOpen = (e: OpenEvent) => {
  const tabSyncMenu: GoogleAppsScript.Base.Menu = SpreadsheetApp.getUi()
    .createMenu('OneStop Utils')
    .addItem('abc', 'addWeek')

  tabSyncMenu.addToUi()
}
