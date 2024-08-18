# README

```shell
npm i
```

Enable the Google Apps Script API at https://script.google.com/home/usersettings:

![Enable Apps Script API](https://user-images.githubusercontent.com/744973/54870967-a9135780-4d6a-11e9-991c-9f57a508bdf0.gif)

```shell
clasp login
```

Create an Apps Script script, if you don't already have one you want to use.
- You probably want a [container-bound script](https://developers.google.com/apps-script/guides/bound#access_to_bound_scripts) linked to the OneStop spreadsheet.

Make your own copy of the OneStop here: https://drive.google.com/drive/folders/1s_u-hmstlLL1JqRKyKJ7r2AMyyTCCiut

Get the Script ID for your personal dev OneStop by following these steps:
- Open your new sheet
- Click Extensions > App Script
- Select the first project that appears
- Rename the project
- Go to settings
- The Script ID should be in the settings page
- Copy the script id 

Fill out [`.clasp.json`](./.clasp.json) with your created script ID.

```shell
npm run build
npm run deploy
```


