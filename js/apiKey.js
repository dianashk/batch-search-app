const { ipcRenderer, shell } = require('electron');
const { dialog } = require('electron').remote;
const _ = require('lodash');
const settings = require('electron-settings');

document.getElementById('btnNext').addEventListener('click', _ => {
  if (settings.get('current_api_key')) {
    settings.set('apiKey', settings.get('current_api_key'));
    ipcRenderer.send('loadPage', 'selectInputData');
  }  
  else {
    dialog.showErrorBox('Select an API Key', 'Please select an API Key before proceeding to the next step!');
  }
});

document.getElementById('body').onload = _ => {
  loadUserData();
  loadKeys();
  selectCurrentKey();
};

function loadKeys() {
  var userKeys = document.getElementById('user-keys');
  userKeys.innerHTML = "";
  
  var keys = settings.get('user_keys');
  if (!keys) {
    return;
  }

  keys.forEach(function (key) {
    var option = document.createElement('tr');
    option.className = 'form-group';
    option.innerHTML = `<td><input type="radio" id="${key.key}" name="keys">` +
      `<label for="${key.key}">${key.nickname}</td>` +
      `<td><label for="${key.key}">${key.key}</td>`;
    
    userKeys.appendChild(option);

    document.getElementById(key.key).onchange = function (event) {
      console.log('setting current api key', event.target.id);
      settings.set('current_api_key', event.target.id);
    }
  });
}

function loadUserData() {
  const defaultAvatar = '../mapzen-util/public/img/mapzen-logo.png';

  console.log('user info', settings.get('user_avatar'), settings.get('user_email'), settings.get('user_nickname'));
  
  document.getElementById('user-avatar').src = settings.get('user_avatar') || defaultAvatar;
  document.getElementById('user-email').innerText = settings.get('user_email');
  document.getElementById('user-nickname').innerText = settings.get('user_nickname') || _.split(settings.get('user_email'), '@')[0];
}

function selectCurrentKey() {
  if (settings.get('current_api_key')) {
    console.log('selecting key', settings.get('current_api_key'));
    document.getElementById(settings.get('current_api_key')).checked = true;
  }
}

function switchUser() {
  settings.deleteAll();
  settings.set('clearAuthCache', true);
  ipcRenderer.send('authenticate');
}