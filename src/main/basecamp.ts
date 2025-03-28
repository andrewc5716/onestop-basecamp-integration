import { BASECAMP_CLIENT_ID, BASECAMP_CLIENT_SECRET } from "../../config/environmentVariables";
import { BasecampUnauthError } from "./error/basecampUnauthError";
import { fetchWithRetry } from "./retry";

type HttpMethod = GoogleAppsScript.URL_Fetch.HttpMethod;

const BASECAMP_AUTH_URL: string = 'https://launchpad.37signals.com/authorization/new?type=web_server';
const BASECAMP_TOKEN_URL: string = 'https://launchpad.37signals.com/authorization/token?type=web_server';
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
export function getBasecampProjectUrl(projectId: string) {
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
export function oauthCallback(request: any): any {
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

export function checkAuthorization(): void {
    const basecampService: OAuth2 = getUnvalidatedBasecampService();

    if (!basecampService.hasAccess()) {
        showAuthorizationDialog(basecampService.getAuthorizationUrl());
    }

    Logger.log(sendBasecampGetRequest(BASECAMP_AUTH_CHECK_URL));
}

export function verifyBasecampAuthorization(): void {
    getValidatedBasecampService();
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
 * Returns the OAuth Basecamp service if the access token is valid, otherwise shows a dialog with a link the user
 * must open to authorize and get a valid access token. 
 * 
 * @returns OAuth service for Basecamp, guaranteed to have an active access token
 * @throws error if the OAuth service is not authorized, which must be thrown to avoid returning an unvalidated OAuth2 service
 */
function getValidatedBasecampService(): OAuth2 {
    const basecampService: OAuth2 = getUnvalidatedBasecampService();

    if (basecampService.hasAccess()) {
        return basecampService;
    } else {
        throw new BasecampUnauthError(BASECAMP_UNAUTH_ERROR_MSG);
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