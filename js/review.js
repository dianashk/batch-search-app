const { ipcRenderer, shell, remote } = require('electron');
const { dialog } = remote;
const settings = require('electron-settings');
const _ = require('lodash');

const qps = 6;

function onPrevious() {
  ipcRenderer.send('loadPage', 'selectColumns');
}

function openDocumentation() {
  shell.openExternal('https://mapzen.com/documentation/search');
}

function onNext() {
  if (!validateAdditionalParams()) {
    dialog.showErrorBox('Invalid Parameters', 'Invalid additional parameters. Please revise.');
    return;
  }

  ipcRenderer.send('loadPage', 'progressMap');
}

function validateAdditionalParams() {
  const params = document.getElementById('advancedParams').value.trim();
  if (params.length === 0) {
    settings.delete('advancedParams');
    return true;
  }

  let valid = true;
  const queryParams = params.split('&').map((param) => {return param.split('=')});
  let queryParamObj = {};
  queryParams.forEach((param) => {
    queryParamObj[param[0].trim()] = param[1].trim();
    valid = (param.length === 2 && !_.isEmpty(param[0].trim()) && !_.isEmpty(param[1].trim()));
  });

  console.log(valid, queryParamObj);
  settings.set('advancedParams', queryParamObj);

  return valid;
}

function onPricingDetails() {
  shell.openExternal('https://mapzen.com/pricing/#geocoding');
}

function onAccountDetails() {
  shell.openExternal('https://mapzen.com/developers');
}

function onLoad() {
  const endpoint = settings.get(`${settings.get('inputDataPath')}.endpoint`);
  const totalCount = settings.get(`${settings.get('inputDataPath')}.lineCount`);

  document.getElementById('geocodingType').innerHTML = endpoint;

  if (totalCount !== 'undefined') {
    document.getElementById('totalRequests').innerHTML = totalCount;
    document.getElementById('estimatedCost').innerHTML = ((totalCount / 1000) * 0.50).toFixed(2);

    const seconds = totalCount/qps;
    if (seconds < 60) {
      document.getElementById('estimatedDuration').innerHTML = '<1 min';
    }
    else {
      document.getElementById('estimatedDuration').innerHTML = T(totalCount / qps, true, true);
    }
  }
  else {
    document.getElementById('totalRequests').innerHTML = 'not computed';
    document.getElementById('estimatedCost').innerHTML = 'not computed';
  }
}

function T(a,c,e) {
  const d = 60;
  const s = [" sec", " min", " hrs"];

  t = [a, (0 | a / d) * d, (0 | a / d / d) * d * d].map(function (a, b, f) {
    p = (a - (0 | f[b + 1])) / Math.pow(d, b);
    return e && 1 > b ? "" : c && !p ? "" : p + s[b] + "  "
  }).reverse().join("");

  return t;
}
