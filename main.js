const {app, ipcMain, BrowserWindow, dialog} = require('electron')
const path = require('path')
const url = require('url')
const settings = require('electron-settings');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  loadPage('apiKey');
  
  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

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
