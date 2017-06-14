const { remote, ipcRenderer, shell, BrowserWindow } = require('electron');
const { dialog } = require('electron').remote;
const { authenticate } = require('../src/js/authRenderer');
const config = require('../../config.json');

const settings = require('electron-settings');

let selectedKey;

document.getElementById('body').onload = function () {
  selectedKey = settings.get('current_api_key');
  
  // this will require the user to login before loading anything else
  authenticate(config.auth, ipcRenderer, false, function (err) {
    console.log('authentication is done');

    loadUserData();
    loadKeys();
    selectCurrentKey();
  });
};

function loadKeys() {
  var userKeys = document.getElementById('user-keys');
  
  var keys = settings.get('user_keys');
  keys.forEach(function (key) {
    var option = document.createElement('tr');
    option.className = 'form-group';
    option.innerHTML = `<td><input type="radio" id="${key.key}" name="keys">` +
      `<label for="${key.key}">${key.nickname}</td>` +
      `<td><label for="${key.key}">${key.key}</td>`;
    
    userKeys.appendChild(option);

    document.getElementById(key.key).onchange = function (event) {
      selectedKey = event.target.id;
    }
  });
}

function loadUserData() {
  const defaultAvatar = '../public/img/mapzen-logo.png';

  document.getElementById('user-avatar').src = settings.get('user_avatar') || defaultAvatar;
  document.getElementById('user-email').innerText = settings.get('user_email');
  document.getElementById('user-nickname').innerText = settings.get('user_nickname');
}

function selectCurrentKey() {
  if (settings.get('current_api_key')) {
    console.log('selecting key', settings.get('current_api_key'));
    document.getElementById(settings.get('current_api_key')).checked = true;
  }
}

function closeWindow() {
  if (!selectedKey) {
    dialog.showErrorBox('No key selected!', 'Please pick one or log into your Mapzen account to add a key.');
    return;
  }

  console.log('closing user profile window...', selectedKey);
  settings.set('current_api_key', selectedKey);

  ipcRenderer.send('user:api_key_updated');
  ipcRenderer.send('user-success');
}

function switchUser() {
  settings.deleteAll();

  console.log('forget current user and authenticate again');
  console.log('config looks like', config);

  // this will require the user to login before loading anything else
  // clearCache parameter should be set to true
  authenticate(config.auth, ipcRenderer, true, function (err) {
    console.log('authentication is done');
    loadUserData();
    loadKeys();
    selectCurrentKey();
  });
}
