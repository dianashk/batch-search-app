const { app, ipcMain, BrowserWindow, dialog, Menu } = require('electron');
const path = require('path');
const url = require('url');
const settings = require('electron-settings');
const auth = require('./mapzen-util/src/js/authentication.js');
const config = require('./config.json');

require('electron-debug')({showDevTools: false});

let win;

const authOwner = {
  loadLoginPage: (authUrl) => {
    console.log('got a login message');

    if (settings.get('clearAuthCache')) {
      console.log('clearing previous cache to allow new login session');
      win.webContents.session.clearStorageData();
    }
    console.log('authMain loading url', authUrl);
    win.loadURL(authUrl);
  }
};

if (!config.auth) {
  throw new Error('No authentication configuration could be found.');
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  app.quit();
});

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1024,
    height: 768
  });
  win.setTitle('Mapzen Search');

  loadPage('intro');

  win.on('closed', () => {
    win = null;
  });

  const menuTemplate = [
    {
      label: 'Mapzen',
      submenu: [
        {
          label: 'About ...',
          click: () => {
            console.log('About Clicked');
          }
        }, {
          label: 'Quit',
          click: () => {
            app.quit();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

ipcMain.on('authenticate', () => {
  auth.authenticate(config.auth, authOwner, (err) => {
    if (err) {
      console.log(err.message);
    }
    loadPage('apiKey');
    settings.set('clearAuthCache', false);
  });
});

/**
 * Automatically close the authentication window after a successful callback
 */
ipcMain.on('login-success', () => {
  console.log('loading apiKey window after successful login');
  loadPage('apiKey');
});

ipcMain.on('loadPage', (event, pageName) => {
  loadPage(pageName);
});

ipcMain.on('openFile', (event, path) => {
  const options = {
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: ['openFile']
  };

  dialog.showOpenDialog(win, options, function (fileNames) {
    // fileNames is an array that contains all the selected
    if (fileNames === undefined) {
      return;
    } else {
      event.sender.send('openFileResults', fileNames[0]);
    }
  });
});

ipcMain.on('createFile', (event, path, defaultPath) => {
  const options = {
    defaultPath: defaultPath,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: ['openFile']
  };

  dialog.showSaveDialog(win, options, function (fileName) {
    // fileNames is an array that contains all the selected
    if (fileName === undefined) {
      return;
    } else {
      event.sender.send('createFileResults', fileName);
    }
  });
});

function loadPage(pageName) {
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'static', `${pageName}.html`),
    protocol: 'file:',
    slashes: true
  }));
}
