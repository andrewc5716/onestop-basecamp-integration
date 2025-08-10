import { BASECAMP_CLIENT_ID, BASECAMP_CLIENT_SECRET } from "../../config/environmentVariables";
import { BasecampUnauthError } from "./error/basecampUnauthError";
import { fetchWithRetry } from "./retry";

type HttpMethod = GoogleAppsScript.URL_Fetch.HttpMethod;

const BASECAMP_AUTH_URL: string = 'https://launchpad.37signals.com/authorization/new?type=web_server';
const BASECAMP_TOKEN_URL: string = 'https://launchpad.37signals.com/authorization/token?type=web_server';
const BASECAMP_REFRESH_TOKEN_URL: string = 'https://launchpad.37signals.com/authorization/token';
const BASECAMP_AUTH_CHECK_URL: string = 'https://launchpad.37signals.com/authorization.json';
const OAUTH_BASECAMP_SERVICE_NAME: string = 'Basecamp';
const OAUTH_CALLBACK_FUNCTION_NAME: string = 'oauthCallback'
const BASECAMP_UNAUTH_ERROR_MSG: string = 'Basecamp not authenticated. Please try again.';
const AUTH_DIALOG_MSG: string = 'You are disconnected from Basecamp. Copy the following link on a new tab to be authorized:\n\n';
const AUTH_SUCCESS_HTML: string = 'Connection with Basecamp was successful! You can close this tab and re-run the program.';
const AUTH_FAIL_HTML: string = 'Connection denied. Please close this tab and try again.';
const LINK_HEADER_MISSING_ERROR_MSG: string = 'Next URL from Link header is undefined';

const HEADER_AUTHORIZATION: string = 'Authorization';
const HEADER_BEARER_TOKEN: string = 'Bearer ';
const HEADER_USER_AGENT: string = 'User-Agent';
const HEADER_USER_AGENT_NAME: string = 'Google App Script Onestop Basecamp Integration';
const HEADER_CONTENT_TYPE: string = 'Content-Type';
const HEADER_JSON_CONTENT_TYPE: string = 'application/json';

const HTTP_POST_METHOD: HttpMethod = 'post';
const HTTP_PUT_METHOD: HttpMethod = 'put';
const HTTP_GET_METHOD: HttpMethod = 'get';

const BASECAMP_API_URL: string = 'https://3.basecampapi.com';
const A2N_BASECAMP_ORG_ID: string = '4474129';
const BUCKETS_PATH: string = '/buckets/';

/**
 * Gets the Basecamp URL for a specific project
 * 
 * @param projectId the "bucket" or project
 * @returns the Basecamp URL for the specific project
 */
export function getBasecampProjectUrl(projectId: string): string {
    return getBasecampUrl() + BUCKETS_PATH + projectId;
}

/**
 * Gets the Basecamp URL for A2N. Used for non-project specific data like for people.json
 * 
 * @returns the Basecamp URL for A2N
 */
export function getBasecampUrl(): string {
    return BASECAMP_API_URL + '/' + A2N_BASECAMP_ORG_ID;
}

export function sendBasecampPostRequest(requestUrl: string, requestPayload: JsonObject): JsonData {
    const response: HTTPResponse = fetchWithRetry(requestUrl, {
        method: HTTP_POST_METHOD,
        headers: getHeaders(),
        payload: JSON.stringify(requestPayload)
    });
    return JSON.parse(response.getContentText());
}

export function sendBasecampPutRequest(requestUrl: string, requestPayload: JsonObject): JsonData {
    const response: HTTPResponse = fetchWithRetry(requestUrl, {
        method: HTTP_PUT_METHOD,
        headers: getHeaders(),
        payload: JSON.stringify(requestPayload)
    });

    const contentText: string = response.getContentText();

    if (contentText) {
        return JSON.parse(contentText);
    } else {
        return {};
    }
}

/**
 * Performs a GET request for a Basecamp API, with built in pagination if applicable
 * 
 * @param requestUrl GET request URL
 * @returns the GET response. If paginated, most likely a JsonArray
 */
export function sendPaginatedBasecampGetRequest(requestUrl: string): JsonData {
    let getResponse: HTTPResponse = sendBasecampGetRequest(requestUrl);

    const jsonResponse: JsonData = JSON.parse(getResponse.getContentText());
    // If the response isn't an array, pagination won't be possible anyway so return the response object
    if (!Array.isArray(jsonResponse)) {
        return jsonResponse;
    }

    let cumulativeResponse: JsonArray = jsonResponse;

    while (hasNextPageUrlFromGetResponse(getResponse)) {
        getResponse = sendBasecampGetRequest(getNextPageUrlFromGetResponse(getResponse));
        const jsonResponse: JsonData = JSON.parse(getResponse.getContentText());
        cumulativeResponse = cumulativeResponse.concat(jsonResponse);
    }

    return cumulativeResponse;
}

/**
 * Callback function for OAuth protocol
 * IMPORTANT: function name MUST match with OAUTH_CALLBACK_FUNCTION_NAME
 * @param request input from Basecamp authorization
 * @returns HTML output of authorization status
 */
export function oauthCallback(request: unknown): GoogleAppsScript.HTML.HtmlOutput {
    const authorized: boolean = getUnvalidatedBasecampService().handleCallback(request);
    if (authorized) {
        return HtmlService.createHtmlOutput(AUTH_SUCCESS_HTML);
    } else {
        return HtmlService.createHtmlOutput(AUTH_FAIL_HTML);
    }
}

export function logout(): void {
    getUnvalidatedBasecampService().reset();
}

/**
 * Logs in to Basecamp. If the user is not authenticated, shows the authorization dialog.
 * If the user is authenticated, refreshes the tokens automatically.
 * 
 * @throws BasecampUnauthError if the user is not authenticated and the authorization dialog is shown
 */
export function login(): void {
    try {
        getValidatedBasecampService(); // This handles refresh automatically
        Logger.log(sendBasecampGetRequest(BASECAMP_AUTH_CHECK_URL));
    } catch (error) {
        // Auth failed, show manual authorization dialog
        Logger.log('Authentication failed - authorization dialog shown in Onestop Google Sheet');
        const basecampService: OAuth2 = getUnvalidatedBasecampService();
        showAuthorizationDialog(basecampService.getAuthorizationUrl());
    }
}

export function verifyBasecampAuthorization(): void {
    getValidatedBasecampService();
}

/**
 * Diagnostic function to view OAuth token status for troubleshooting.
 * Shows essential information about authentication state and automatic refresh capability.
 * This function is read-only and does not take any action.
 */
export function viewAuthStatus(): void {
    const basecampService: OAuth2 = getUnvalidatedBasecampService();
    const propertyStore = PropertiesService.getUserProperties();
    const serviceName = OAUTH_BASECAMP_SERVICE_NAME;
    
    try {
        const hasAccess: boolean = basecampService.hasAccess();
        const refreshToken: string | null = propertyStore.getProperty(`${serviceName}.refresh_token`);
        
        Logger.log('=== Basecamp Authentication Status ===');
        Logger.log(`✅ Currently Authenticated: ${hasAccess ? 'YES' : 'NO'}`);
        Logger.log(`🔄 Automatic Refresh Available: ${refreshToken ? 'YES' : 'NO'}`);
        
        if (hasAccess && refreshToken) {
            Logger.log('🎉 Fully configured - automatic refresh will work when tokens expire');
        } else if (hasAccess && !refreshToken) {
            Logger.log('⚠️  Authenticated but no refresh token stored yet');
            Logger.log('💡 Automatic extraction will happen when refresh is needed');
        } else {
            Logger.log('❌ Not authenticated - run login() to authenticate');
        }
        
        Logger.log('=== End Status ===');
        
    } catch (error: unknown) {
        Logger.log(`❌ Error checking auth status: ${error}`);
    }
}

/**
 * Gets the OAuth service to interact with Basecamp.
 * "Unvalidated" because there may not be an active access token, see getValidatedBasecampService()
 * 
 * @returns OAuth service for Basecamp which may not have an active access token
 */
function getUnvalidatedBasecampService(): OAuth2 {
    // function name includes "unvalidated" because the access token may not be active
    return OAuth2.createService(OAUTH_BASECAMP_SERVICE_NAME)
        .setAuthorizationBaseUrl(BASECAMP_AUTH_URL)
        .setTokenUrl(BASECAMP_TOKEN_URL)
        .setClientId(BASECAMP_CLIENT_ID)
        .setClientSecret(BASECAMP_CLIENT_SECRET)
        .setCallbackFunction(OAUTH_CALLBACK_FUNCTION_NAME)
        .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Returns the OAuth Basecamp service if the access token is valid, otherwise attempts to refresh the token
 * automatically. If refresh fails, throws an error.
 * 
 * @returns OAuth service for Basecamp, guaranteed to have an active access token
 * @throws BasecampUnauthError if the OAuth service is not authorized and cannot be refreshed
 */
function getValidatedBasecampService(): OAuth2 {
    let basecampService: OAuth2 = getUnvalidatedBasecampService();

    // Return immediately if already authenticated
    if (basecampService.hasAccess()) {
        return basecampService;
    }

    refreshTokens(basecampService);

    // Get fresh service instance to pick up new tokens
    basecampService = getUnvalidatedBasecampService();
    
    if (!basecampService.hasAccess()) {
        throw new BasecampUnauthError(BASECAMP_UNAUTH_ERROR_MSG);
    }

    return basecampService;
}

/**
 * Refreshes the OAuth token automatically using the stored refresh token.
 * If no refresh token is found in our backup storage, attempts to extract it from
 * the OAuth2 library's internal storage first.
 * 
 * @param basecampService the OAuth service to refresh tokens for
 * @throws BasecampUnauthError if token refresh fails
 */
function refreshTokens(basecampService: OAuth2): void {
    try {
        const propertyStore: GoogleAppsScript.Properties.Properties = PropertiesService.getUserProperties();
        const serviceName: string = OAUTH_BASECAMP_SERVICE_NAME;
        let refreshToken: string | null = propertyStore.getProperty(`${serviceName}.refresh_token`);
        
        // If no refresh token in our backup location, try to extract it from OAuth2 library
        if (!refreshToken) {
            Logger.log('No refresh token in backup storage, attempting to extract from OAuth2 library...');
            storeRefreshToken();
            refreshToken = propertyStore.getProperty(`${serviceName}.refresh_token`);
        }
        
        // If still no refresh token, we can't refresh
        if (!refreshToken) {
            throw new BasecampUnauthError('No refresh token available - need to re-authorize to get refresh token');
        }
        
        Logger.log('Refresh token found, attempting automatic refresh...');
        callBasecampRefreshApi(basecampService);
    } catch (error: unknown) {
        throw new BasecampUnauthError(`Token refresh failed: ${error}`);
    }
}

/**
 * Refreshes the OAuth token by calling Basecamp's token endpoint directly with the refresh token.
 * This is the reliable method that works consistently with Basecamp's API.
 * 
 * @param basecampService the OAuth service to refresh tokens for
 * @throws BasecampUnauthError if token refresh fails
 */
function callBasecampRefreshApi(basecampService: OAuth2): void {
    try {
        // Get refresh token from our manual storage since the library doesn't expose getRefreshToken()
        const propertyStore: GoogleAppsScript.Properties.Properties = PropertiesService.getUserProperties();
        const serviceName: string = OAUTH_BASECAMP_SERVICE_NAME;
        const refreshToken: string | null = propertyStore.getProperty(`${serviceName}.refresh_token`);
        
        if (!refreshToken) {
            throw new BasecampUnauthError('No refresh token available for manual refresh - need to re-authorize');
        }

        Logger.log('Found refresh token, refreshing via Basecamp API...');

        const payload: Record<string, string> = {
            'type': 'refresh',
            'refresh_token': refreshToken,
            'client_id': BASECAMP_CLIENT_ID,
            'client_secret': BASECAMP_CLIENT_SECRET
        };

        const response = UrlFetchApp.fetch(BASECAMP_REFRESH_TOKEN_URL, {
            method: HTTP_POST_METHOD,
            payload: payload,
            muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
            const tokenData: BasecampTokenResponse = JSON.parse(response.getContentText());
            Logger.log('Received new tokens from Basecamp');
            
            // Store tokens in OAuth2 library format so it recognizes them
            const oauthDataKey: string = `oauth2.${serviceName}`;
            const newOAuthData = {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || refreshToken,
                expires_in: tokenData.expires_in || 1209600,
                token_type: tokenData.token_type || 'Bearer',
                expiresAt: Date.now() + ((tokenData.expires_in || 1209600) * 1000)
            };
            
            // Store in OAuth2 library format
            propertyStore.setProperty(oauthDataKey, JSON.stringify(newOAuthData));
            
            // Also store refresh token in our backup location
            propertyStore.setProperty(`${serviceName}.refresh_token`, tokenData.refresh_token || refreshToken);

            Logger.log('Token refresh successful - new tokens stored in OAuth2 library format');
        } else {
            throw new BasecampUnauthError(`Token refresh failed with status: ${response.getResponseCode()}, ${response.getContentText()}`);
        }
    } catch (error: unknown) {
        throw new BasecampUnauthError(`Token refresh error: ${error}`);
    }
}

/**
 * Simulates token expiration by clearing the access token while keeping the refresh token.
 * This allows testing of the automatic refresh functionality without waiting for real expiration.
 * 
 * @returns true if access token was cleared successfully
 */
export function simulateTokenExpiration(): boolean {
    try {
        const propertyStore: GoogleAppsScript.Properties.Properties = PropertiesService.getUserProperties();
        const serviceName: string = OAUTH_BASECAMP_SERVICE_NAME;
        
        // Get the current OAuth data
        const oauthDataKey: string = `oauth2.${serviceName}`;
        const oauthDataString: string | null = propertyStore.getProperty(oauthDataKey);
        
        if (!oauthDataString) {
            Logger.log('No OAuth data found - nothing to expire');
            return false;
        }
        
        // Parse and modify the OAuth data to simulate expiration
        const oauthData: any = JSON.parse(oauthDataString);
        
        // Save the refresh token before clearing OAuth data
        const refreshToken: string = oauthData.refresh_token;
        if (refreshToken) {
            propertyStore.setProperty(`${serviceName}.refresh_token`, refreshToken);
            Logger.log('Refresh token backed up for automatic refresh');
        }
        
        // Clear the entire OAuth data to force the library to recognize expiration
        propertyStore.deleteProperty(oauthDataKey);
        
        Logger.log('✅ Simulated token expiration - OAuth data cleared, refresh token preserved');
        Logger.log('💡 Now call login() to test automatic refresh');
        Logger.log('💡 Note: viewAuthStatus() will show "Not authenticated" until refresh happens');
        return true;
        
    } catch (error: unknown) {
        Logger.log(`❌ Error simulating token expiration: ${error}`);
        return false;
    }
}

/**
 * Internal helper to store refresh token by extracting from OAuth2 library's storage.
 * 
 * @throws BasecampUnauthError if refresh token cannot be found or stored
 */
function storeRefreshToken(): void {
    const propertyStore: GoogleAppsScript.Properties.Properties = PropertiesService.getUserProperties();
    const serviceName: string = OAUTH_BASECAMP_SERVICE_NAME;
    
    // The OAuth2 library stores everything in oauth2.ServiceName
    const oauthDataKey: string = `oauth2.${serviceName}`;
    const oauthDataString: string | null = propertyStore.getProperty(oauthDataKey);
    
    if (!oauthDataString) {
        throw new BasecampUnauthError('No OAuth data found in library storage - need to re-authorize');
    }
    
    try {
        const oauthData: any = JSON.parse(oauthDataString);
        
        if (!oauthData.refresh_token) {
            throw new BasecampUnauthError('No refresh token found in OAuth data - need to re-authorize');
        }
        
        const refreshToken: string = oauthData.refresh_token;
        // Store it under our standard key for future use
        propertyStore.setProperty(`${serviceName}.refresh_token`, refreshToken);
        Logger.log('Refresh token automatically extracted from OAuth2 library');
        
    } catch (error: unknown) {
        throw new BasecampUnauthError('Failed to parse OAuth data - need to re-authorize');
    }
}

function showAuthorizationDialog(authorizationUrl: string): void {
    SpreadsheetApp.getUi().alert(AUTH_DIALOG_MSG + authorizationUrl);
}

function getHeaders(): Record<string, string> {
    const basecampService: OAuth2 = getValidatedBasecampService();
    const accessToken: string = basecampService.getAccessToken();

    return {
        [HEADER_AUTHORIZATION]: HEADER_BEARER_TOKEN + accessToken,
        [HEADER_USER_AGENT]: HEADER_USER_AGENT_NAME,
        [HEADER_CONTENT_TYPE]: HEADER_JSON_CONTENT_TYPE
    };
}

function sendBasecampGetRequest(requestUrl: string): HTTPResponse {
    return fetchWithRetry(requestUrl, {
        method: HTTP_GET_METHOD,
        headers: getHeaders()
    });
}

function hasNextPageUrlFromGetResponse(response: HTTPResponse): boolean {
    // responseHeaders is of type 'any' to easily pull the optional Link field
    const responseHeaders: any = response.getAllHeaders();
    return responseHeaders.Link !== undefined;
}

function getNextPageUrlFromGetResponse(response: HTTPResponse): string {
    if (!hasNextPageUrlFromGetResponse(response)) {
        throw new Error(LINK_HEADER_MISSING_ERROR_MSG);
    } else {
        // responseHeaders is of type 'any' to easily pull the optional Link field
        const responseHeaders: any = response.getAllHeaders();
        // Example Link header looks like <https://3.basecampapi.com/12345/people.json?page=2>; rel="next". This extracts everything between <>
        return responseHeaders.Link.split('<')[1].split('>')[0];
    }
}