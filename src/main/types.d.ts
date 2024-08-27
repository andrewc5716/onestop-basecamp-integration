declare interface OpenEvent {
  readonly authMode: typeof ScriptApp.AuthMode,
  readonly source: GoogleAppsScript.Spreadsheet.Spreadsheet,
  readonly triggerUid?: string,
  readonly user?: GoogleAppsScript.Base.User
}

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