# SD Onestop to Basecamp Integration
Takes events from the Onestop's daily tabs and populates Basecamp with appropriate todos for each person.

## Developer setup
### Local development environment
1.  ```npm i ```
2. Enable the Google Apps Script API at https://script.google.com/home/usersettings:
![Enable Apps Script API](https://user-images.githubusercontent.com/744973/54870967-a9135780-4d6a-11e9-991c-9f57a508bdf0.gif)
3. Download clasp: ```npm install -g @google/clasp```
4.  ```clasp login ```

### Personal Onestop and app script setup
5. Make your own copy of the Onestop from [this folder](https://drive.google.com/drive/folders/1s_u-hmstlLL1JqRKyKJ7r2AMyyTCCiut) and add your name to it.
6. In your new sheet, on the menu click Extensions > App Script
7. Select "Create a new project"
8. Name it appropriately, e.g. "Onestop Basecamp Integration - My Name"
9. In the Apps Scripts project, open "Project Settings" on the left bar
10. Copy your Script ID.
11. Replace `scriptId` in [`.clasp.json`](./.clasp.json) with your created script ID.

### Personal Basecamp integration setup
12. Login to [Basecamp](https://launchpad.37signals.com/signin) with your A2N Google account. Ensure you have access to the Acts2Network project before continuing.
13. Open the [Basecamp Integrations page](https://launchpad.37signals.com/integrations)
14. Click "Register an application"
15. Fill out application details:
- Name it appropriately (e.g. Onestop Integration - My Name)
- Company and website URL don't matter
- Select Basecamp 4 under Products
- For OAuth2 redirect URI, fill in the URI with the following, and replace `YOUR_SCRIPT_ID` with your Google Apps Scripts ID from the earlier section: `https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercallback`. 
16. Click "Register this app"
17. Open your app and copy your Client ID and Client Secret for the following step.
19. Create a new file `development.ts` inside the [config](./config/) folder, with the following contents:
```js
export const DEV_BASECAMP_CLIENT_ID: string = 'REPLACE_WITH_YOUR_BASECAMP_CLIENT_ID';
export const DEV_BASECAMP_CLIENT_SECRET: string = 'REPLACE_WITH_YOUR_BASECAMP_CLIENT_SECRET';
export const DEV_BASECAMP_PROJECT_ID: string = 'REPLACE_WITH_BASECAMP_PROJECT_ID';
export const DEV_BASECAMP_SCHEDULE_ID: string = 'REPLACE_WITH_BASECAMP_SCHEDULE_ID';
export const DEV_BASECAMP_TODOLIST_ID: string = 'REPLACE_WITH_BASECAMP_TODOLIST_ID';
```
You can find the Basecamp project id by looking at the URL of your Basecamp project homepage. For the URL `https://3.basecamp.com/4474129/projects/38736474`, `4474129` represents the A2N organization id within Basecamp, and `38736474` is your Basecamp project id.   
Similarly, you can find the schedule id by looking at the URL when you open the Schedule page from your Basecamp project. For the URL `https://3.basecamp.com/4474129/buckets/38736474/schedules/7717423557`, the schedule id is `7717423557`.   
For the todolist id, look at the URL of the todolist you want to use for testing. You may need to create a new todolist for testing if it doesn't already exist. For the URL `https://3.basecamp.com/4474129/buckets/38736474/todolists/7865336721`, `7865336721` is the todolist id.
20. Update `environmentVariables.ts` to make sure your environment variables are properly set and exported

## Development
### Making changes
Create a feature branch: `git checkout -b 'branch-feature-name'`, and name the branch with a clear and concise description of the change.

To allow functions to be run from the Google Apps Scripts, the function must have the `export` keyword. Additionally, it needs to be exported in [index.ts](./src/index.ts).

### Testing changes
```shell
npm run build:dev
npm run deploy:dev
```
This will deploy your code to your personal onestop sheet and app script, and use your personal Basecamp integration app.

To run functions, make sure you first open your Google sheet (onestop copy), then open your script from Extensions > App Script. Keep the Google sheet open in a separate tab, as it will be necessary for any Spreadsheet UI interactions. In the App Script code editor, find your function from the dropdown and hit run. If your function makes use of the Spreadsheet UI API, you will need to click back to your Google sheet tab for the interaction.

#### Testing Basecamp API's
You will need an OAuth2 access token, which you can receive a link for when making any Basecamp request when unauthorized. The easiest way is to call the `checkAuthorization` function from the Google Apps Scripts editor, click back to your Google sheet tab, then follow the instruction in the alert dialog (open the auth link in a new tab, close it, then re-run the function).
