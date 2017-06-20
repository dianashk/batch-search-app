const { ipcRenderer } = require('electron');

function onLogin() {
  ipcRenderer.send('authenticate');
}
