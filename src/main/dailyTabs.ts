import {addDays, format, startOfWeek} from 'date-fns'
import range from 'lodash/range'
import partition from 'lodash/partition'

 // test
const NUM_DAYS_IN_WEEK = 7

interface DailyTabInfo {
  readonly name: string
  readonly date: Date
}

export const addWeek = () => {
  const ui: GoogleAppsScript.Base.Ui = SpreadsheetApp.getUi()

  const now = new Date()
  const firstDayOfWeek = startOfWeek(now)
  const allDaysOfWeek: Date[] = range(NUM_DAYS_IN_WEEK).map(i => addDays(firstDayOfWeek, i))
  const lastDayOfWeek: Date = allDaysOfWeek.at(-1)!

  const dailyTabInfos: DailyTabInfo[] = allDaysOfWeek.map(d => ({
    name: format(d, 'ccc M/d').toUpperCase(),
    date: d
  }))

  console.info(`Adding daily tabs for week: ${dailyTabInfos.at(0)!.name}-${dailyTabInfos.at(-1)!.name}`)

  const allTabs: GoogleAppsScript.Spreadsheet.Sheet[] = SpreadsheetApp.getActiveSpreadsheet().getSheets()

  const [existingDailyTabs, missingDailyTabs] = partition(dailyTabInfos, t => SpreadsheetApp.getActiveSpreadsheet().getSheetByName(t.name))

  if (existingDailyTabs.length > 0) {
    const existingDailyTabNames = existingDailyTabs.map(t => t.name)

    const responseButton: GoogleAppsScript.Base.Button = ui.alert(`The following daily tabs already exist: ${existingDailyTabNames.join(', ')}\n\nThese will be skipped.`, ui.ButtonSet.OK_CANCEL)

    if (responseButton == ui.Button.CANCEL) {
      console.info('Cancelling adding daily tabs for week: user cancelled')
      return
    }
  }

  for (const dailyTabInfo of missingDailyTabs) {
    
  }
}
