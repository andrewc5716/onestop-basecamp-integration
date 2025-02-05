import { RetryError } from "./error/retryError";

type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

const HTTP_200_RESPONSE_CODE: number = 200;
const HTTP_300_RESPONSE_CODE: number = 300;
const HTTP_400_RESPONSE_CODE: number = 400;
const HTTP_500_RESPONSE_CODE: number = 500;

export function fetchWithRetry(url: string, options: URLFetchRequestOptions, maxRetries: number = 3, baseDelay: number = 1000): HTTPResponse {
    let attempt = 0;
  
    while (attempt < maxRetries) {
        // Don't throw an exception on HTTP errors so we can handle them ourselves
        options.muteHttpExceptions = true;

        const response: HTTPResponse = UrlFetchApp.fetch(url, options);

        if(is2xxResponse(response)) {
            return response;
        } else if(is4xxResponse(response)) {
            Logger.log(`WARN: Attempt ${attempt + 1} failed but not retrying: ${response.getResponseCode()} ${response.getContentText()}`);
            return response;
        } else {
            Logger.log(`WARN: Attempt ${attempt + 1} failed: ${response.getResponseCode()} ${response.getContentText()}`);
  
            if (attempt === maxRetries - 1) {
                throw new RetryError(`Failed after ${maxRetries} attempts: ${response.getResponseCode()} ${response.getContentText()}`);
            }

            // Exponential backoff: delay increases on each retry
            const delay: number = baseDelay * Math.pow(2, attempt);
            Utilities.sleep(delay);
    
            attempt++;
        }
    }

    return UrlFetchApp.fetch(url, options);
}

function is2xxResponse(response: HTTPResponse): boolean {
    return response.getResponseCode() >= HTTP_200_RESPONSE_CODE && response.getResponseCode() < HTTP_300_RESPONSE_CODE;
}

function is4xxResponse(response: HTTPResponse): boolean {
    return response.getResponseCode() >= HTTP_400_RESPONSE_CODE && response.getResponseCode() < HTTP_500_RESPONSE_CODE;
}
