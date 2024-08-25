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

Fill out [`.clasp.json`](./.clasp.json) with your created script ID.

```shell
npm run build
npm run deploy
```

Register an application:
Name of application: name it
Company name:
URL:
Products:
Redirect URI: 

Services > Google Sheets

in test app in bc, need to set redirect uri for each person!?
