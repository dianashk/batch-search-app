const { ipcRenderer } = require('electron');
const settings = require('electron-settings');

document.getElementById('btnPrevSelectInputDataFile').addEventListener('click', _ => {
  ipcRenderer.send('loadApiKey');
});

// document.getElementById('btnNextMapColumns').addEventListener('click', _ => {
//   ipcRenderer.send('loadMapColumns');
// });

var inputDataPathDisplay = document.getElementById('inputDataPathDisplay');
inputDataPathDisplay.addEventListener('click', _ => {
  ipcRenderer.send('openFile');
});

ipcRenderer.on('fileSelected', (event, filename) => {
  settings.set('inputDataPath', filename);
  document.getElementById('inputDataPathDisplay').innerText = filename;
});

document.getElementById('body').onload = () => {
  console.log('onload');

  if (settings.has('inputDataPath')) {
    document.getElementById('inputDataPathDisplay').innerText = settings.get('inputDataPath');
  }  
};