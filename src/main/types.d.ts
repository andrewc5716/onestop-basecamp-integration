declare interface OpenEvent {
  readonly authMode: typeof ScriptApp.AuthMode,
  readonly source: GoogleAppsScript.Spreadsheet.Spreadsheet,
  readonly triggerUid?: string,
  readonly user?: GoogleAppsScript.Base.User
}

type Spreadsheet = GoogleAppsScript.Spreadsheet.Spreadsheet;
type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type Range = GoogleAppsScript.Spreadsheet.Range;
type Metadata = GoogleAppsScript.Spreadsheet.DeveloperMetadata;
type RichTextValue = GoogleAppsScript.Spreadsheet.RichTextValue;
type TextStyle = GoogleAppsScript.Spreadsheet.TextStyle;
type Trigger = GoogleAppsScript.Script.Trigger;
type SheetsOnChange = GoogleAppsScript.Events.SheetsOnChange;

declare interface TextData {
  value: string,
  hyperlink: string | null,
  strikethrough: boolean,
}

declare interface Text {
  value: string,
  tokens: TextData[],
}

declare interface Row {
  date: Date,
  metadata: Metadata,
  startTime: Date,
  endTime: Date,
  domain: string,
  who: string,
  numAttendees: number,
  what: Text,
  where: Text,
  inCharge: Text,
  helpers: Text,
  notes: Text
}

declare interface BasecampTodo {
  id: string,
  title: string,
  url: string,
}

declare interface BasecampScheduleEntry {
  id: string,
  url: string,
}

// The key string represents a role and the value represents a todo object
type RoleTodoMap = { [role: string]: BasecampTodo };

declare interface TabInfo {
  date: Date
}

declare interface RowBasecampMapping {
  rowHash: string,
  roleTodoMap: RoleTodoMap
  scheduleEntryId?: string,
  tabInfo: TabInfo
}

type HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;

declare interface OAuth2 {
  setAuthorizationBaseUrl(url: string): OAuth2;
  setTokenUrl(url: string): OAuth2;
  setClientId(clientId: string): OAuth2;
  setClientSecret(clientSecret: string): OAuth2;
  setCallbackFunction(callback: string): OAuth2;
  setPropertyStore(store: GoogleAppsScript.Properties.Properties): OAuth2;
  setScope(scopes: string | string[]): OAuth2;
  hasAccess(): boolean;
  getAuthorizationUrl(): string;
  getAccessToken(): string;
  handleCallback(callbackRequest: any): boolean;
  reset(): void;
}

declare namespace OAuth2 {
 export function createService(name: string): OAuth2
}

type JsonData = JsonObject | JsonArray;
type JsonObject = Record<string, unknown>;
type JsonArray = JsonObject[];

declare interface TodoIdentifier {
  readonly projectId: string,
  readonly todoId: string
}

declare interface TodolistIdentifier {
  readonly projectId: string,
  readonly todolistId: string
}

// This is the exact Basecamp Todo object, the keys cannot be changed
declare interface BasecampTodoRequest extends JsonObject {
  content: string, // todo name
  description: string, // todo description
  assignee_ids: string[], // list of assignee ids
  completion_subscriber_ids?: string[], // list of people ids to be notified when the task is complete
  notify: boolean, // whether to notify the assignees upon todo creation
  due_on: string // YYYY-MM-DD
}

// Response from Basecamp Todo. Only need id for now, can add more later
declare interface BasecampTodoResponse extends JsonObject {
  id: string, // id of the created todo
  title: string, // title of the created todo
  app_url: string // url of the created todo
}

declare interface ScheduleIdentifier {
  readonly projectId: string,
  readonly scheduleId: string
}

declare interface ScheduleEntryIdentifier {
  readonly projectId: string,
  readonly scheduleEntryId: string
}

// Response from Basecamp Schedule Entry. Only need id for now, can add more later
declare interface BasecampScheduleEntryResponse extends JsonObject {
  id: string, // id of the created schedule entry
  app_url: string // url of the created schedule entry
}

declare interface BasecampScheduleEntryRequest extends JsonObject {
  summary: string,
  starts_at: string, // ISO 8601
  ends_at: string,
  description: string,
  participant_ids: string[],
  all_day: boolean,
  notify: boolean
}

// Response from Basecamp people API. Only need id and name for now, can add more later
declare interface Person extends JsonObject {
  id: string,
  name: string,
}

// The key string represents a rowId and the value represents a RowBasecampMapping
type DocumentProperties = { [key: string]: RowBasecampMapping };

type RoleRequestMap = { [key: string]: BasecampTodoRequest }

declare interface Member {
  name: string,
  gender: string,
  married: boolean,
  parent: boolean,
  class: number,
  basecampId: string
}

// Maps a members name to their Member object containing their properties
type MemberMap = { [key: string]: Member };

// Maps an alias to an array of member names that the alias corresponds to
type AliasMap = { [key: string]: string[] };

declare interface Group {
  name: string,
  members: string[],
  aliases: string[],
}

// Maps a group name to an array of group member names
type GroupsMap = { [key: string]: string[] };

// function used to filter groups of members; meant to be used with the array filter() function
type FilterFunction = (memberName: string) => boolean;

declare interface HelperGroup {
  role?: string,
  helperIds: string[],
}
