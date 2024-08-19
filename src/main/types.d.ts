declare interface OpenEvent {
  readonly authMode: typeof ScriptApp.AuthMode,
  readonly source: GoogleAppsScript.Spreadsheet.Spreadsheet,
  readonly triggerUid?: string,
  readonly user?: GoogleAppsScript.Base.User
}

type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

interface Text {
  readonly value: string,
  readonly hyperlink: string | null
}

interface Row {
  readonly startTime: Date,
  readonly endTime: Date,
  readonly who: string,
  readonly numAttendees: number,
  readonly what: Text,
  readonly where: Text,
  readonly inCharge: Text,
  readonly helpers: Text,
  readonly foodLead: Text,
  readonly childcare: Text,
  readonly notes: Text
}