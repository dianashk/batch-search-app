const { ipcRenderer, shell } = require('electron');
const { dialog } = require('electron').remote;
const settings = require('electron-settings');
const config = require('../config.json');
const { authenticate } = require('../mapzen-util/src/js/authRenderer');

document.getElementById('body').onload = _ => {
  // this will require the user to login before loading anything else
  authenticate(
    config.auth,
    ipcRenderer,
    settings.get('clearAuthCache') || false,
    function (err) {
      console.log('authentication is done');

      if (err) {
        process.exit();
      }

      ipcRenderer.send('loadPage', 'apiKey');
    }
  );
};