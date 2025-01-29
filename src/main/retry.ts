import { RetryError } from "./error/retryError";

type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

export function fetchWithRetry(url: string, options: URLFetchRequestOptions, maxRetries: number = 3, baseDelay: number = 1000): HTTPResponse {
    let attempt = 0;
  
    while (attempt < maxRetries) {
        try {
            return UrlFetchApp.fetch(url, options);
        } catch (error: any) {
            Logger.log(`WARN: Attempt ${attempt + 1} failed: ${error.message}`);
  
            if (attempt === maxRetries - 1) {
                throw new RetryError(`Failed after ${maxRetries} attempts: ${error.message}`);
            }
  
            // Exponential backoff: delay increases on each retry
            const delay: number = baseDelay * Math.pow(2, attempt);
            Utilities.sleep(delay);
        }
  
        attempt++;
    }

    return UrlFetchApp.fetch(url, options);
}
