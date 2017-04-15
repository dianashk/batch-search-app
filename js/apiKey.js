const { ipcRenderer, shell } = require('electron');
const { dialog } = require('electron').remote;
const settings = require('electron-settings');

document.querySelector('.apiKeyLink').addEventListener('click', _ => {
  shell.openExternal('https://mapzen.com/developers');
});

document.getElementById('btnNext').addEventListener('click', _ => {
  const apiKey = document.getElementById('apiKey').value;
  if (apiKey !== 'mapzen-xxxxxxx' && apiKey.length === 14) {
    settings.set('apiKey', apiKey);
    ipcRenderer.send('loadPage', 'selectInputData');
  }  
  else {
    dialog.showErrorBox('Invalid API Key', 'API Key ' + apiKey + ' is invalid! Please try again.');
  }
});

document.getElementById('body').onload = () => {
  if (settings.has('apiKey') && settings.get('apiKey') !== 'mapzen-xxxxxxx') {
    document.getElementById('apiKey').value = settings.get('apiKey');
  }  
};