const path = require('path');
const url = require('url');
const { BrowserWindow } = require('electron');

const settings = require('electron-settings');

const { loadPage } = require('./windowManip');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let authWindow;

module.exports.init = function init(ipcMain) {
  /**
   * Handles the login event sent from the authentication page
   * Creates new browser window and allows user to authenticate
   *
   * @param {object} event
   * @param {string} url
   */
  ipcMain.on('login', (event, url, clearCache) => {
    console.log('got a login message')
    authWindow = new BrowserWindow({ width: 800, height: 600 });
    authWindow.on('closed', function () {
      authWindow = null
    });

    if (clearCache) {
      console.log('clearing previous cache to allow new login session');
      authWindow.webContents.session.clearStorageData();
    }
    console.log('authMain loading url', url);      
    authWindow.loadURL(url);
  });

  /**
   * Automatically close the authentication window after a successful callback
   */
  ipcMain.on('login-success', (event) => {
    console.log('closing auth window');
    authWindow.close();
  });
};


