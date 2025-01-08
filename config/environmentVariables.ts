let BASECAMP_CLIENT_ID: string = "";
let BASECAMP_CLIENT_SECRET: string = "";
let BASECAMP_PROJECT_ID: string = "";
let BASECAMP_SCHEDULE_ID: string = "";

// Need to use dynamic imports here so webpack does not include and leak secrets for the other environment
// Webpack will also optimize out sections of code that do not correspond to the current environment
// The webpack mode needs to be set to eager inline so the dynamic imports are included in the same bundle
if(process.env.ENV === 'production') {
    import(/* webpackMode: "eager" */ './production')
        .then((prodModule) => {
            BASECAMP_CLIENT_ID = prodModule.PROD_BASECAMP_CLIENT_ID;
            BASECAMP_CLIENT_SECRET = prodModule.PROD_BASECAMP_CLIENT_SECRET;
            BASECAMP_PROJECT_ID = prodModule.PROD_BASECAMP_PROJECT_ID;
            BASECAMP_SCHEDULE_ID = prodModule.PROD_BASECAMP_SCHEDULE_ID;
        })
} else {
    import(/* webpackMode: "eager" */ './development')
        .then((devModule) => {
            BASECAMP_CLIENT_ID = devModule.DEV_BASECAMP_CLIENT_ID;
            BASECAMP_CLIENT_SECRET = devModule.DEV_BASECAMP_CLIENT_SECRET;
            BASECAMP_PROJECT_ID = devModule.DEV_BASECAMP_PROJECT_ID;
            BASECAMP_SCHEDULE_ID = devModule.DEV_BASECAMP_SCHEDULE_ID;
        })
}

export { BASECAMP_CLIENT_ID, BASECAMP_CLIENT_SECRET, BASECAMP_PROJECT_ID, BASECAMP_SCHEDULE_ID };
