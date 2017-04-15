const { ipcRenderer } = require('electron');
const settings = require('electron-settings');

document.getElementById('btnPrev').addEventListener('click', _ => {
  ipcRenderer.send('loadPage', 'apiKey');
});

document.getElementById('btnNext').addEventListener('click', _ => {
  ipcRenderer.send('loadPage', 'selectColumns');
});

var inputDataPathDisplay = document.getElementById('inputDataPathDisplay');
inputDataPathDisplay.addEventListener('click', _ => {
  ipcRenderer.send('openFile');
});

ipcRenderer.on('fileSelected', (event, filename) => {
  settings.set('inputDataPath', filename);
  settings.set('outputDataPath', `${filename}.output.csv`);
  document.getElementById('inputDataPathDisplay').innerText = filename;
});

document.getElementById('body').onload = () => {
  if (settings.has('inputDataPath')) {
    document.getElementById('inputDataPathDisplay').innerText = settings.get('inputDataPath');
  }  
};