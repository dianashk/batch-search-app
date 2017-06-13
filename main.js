const { app, ipcMain, BrowserWindow, dialog } = require('electron');
const path = require('path');
const url = require('url');
const settings = require('electron-settings');

let win;

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  app.quit();
});

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600 });

  loadPage('apiKey');
  
  win.on('closed', () => {
    win = null;
  });
}

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
