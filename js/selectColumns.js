const { ipcRenderer, shell } = require('electron');
const { dialog } = require('electron').remote;
const settings = require('electron-settings');
const fs = require('fs');
const countLines = require('../js/lineCount');
const csvReader = require('csv-stream');
const through = require('through2');

function openDocumentation() {
  shell.openExternal('https://mapzen.com/documentation/search');
}

function onPrevious() {
  saveSettings();
  ipcRenderer.send('loadPage', 'selectInputData');
}

function onNext() {
  const endpoint = saveSettings();

  console.log(`endpoint determined to be ${endpoint}`);

  if (endpoint === 'invalid') {
    dialog.showErrorBox('Invalid column selection',
      'Please choose an input parameter for at least one column from the dropdown');
    return;
  }

  ipcRenderer.send('loadPage', 'review');
}

document.getElementById('body').onload = () => {
  if (settings.has('inputDataPath')) {
    const table = document.getElementById('inputDataPreview');

    const options = {
      delimiter: ',', // default is ,
      endLine: '\n', // default is \n,
      escapeChar: '"', // default is an empty string
      enclosedChar: '"' // default is an empty string
    };

    let count = 0;
    let columns = [];

    const inputDataPath = settings.get('inputDataPath');

    // this will run async and set the line count in settings
    getLineCount(inputDataPath);

    const input = fs.createReadStream(inputDataPath);

    input.pipe(csvReader.createStream(options))
      .pipe(through.obj((data, enc, next) => {

        // add column headers on first row
        if (count === 0) {
          columns = Object.keys(data);

          settings.set(inputDataPath, { columns: columns });

          const thead = document.createElement('thead');

          const dropdowns = columns.map((h) => {
            return `<select id="select-${h}">` +
              `<option value="unused">--Choose parameter--</option>` +
              `<option value="text">Full Address</option>` +
              `<option value="address">Num and Street</option>` +
              `<option value="locality">City</option>` +
              `<option value="region">State</option>` +
              `<option value="country">Country</option>` +
              `<option value="postalcode">Postal/ZIP code</option>` +
              `<option value="point.lat">Latitude</option>` +
              `<option value="point.lon">Longitude</option>` +
              `</select>`;
          });
          addRow(thead, ['   '].concat(dropdowns));

          addRow(thead, ['   '].concat(columns));

          table.appendChild(thead);
        }

        count++;

        data.mz_count = count;
        addRow(table, ['mz_count'].concat(columns), data);

        if (count === 10) {
          document.getElementById('showingPreview').innerHTML =
          `<p style="font-size: 0.9em; color: gray"><i>  ...only showing first 10 rows</i></p>`;

          return input.destroy();
        }

        next();
      }));
  }
};

function getLineCount(inputDataPath) {
  countLines(inputDataPath, (err, numberOfLines) => {
    if (err) {
      console.error(err);
      settings.set(`${inputDataPath}.lineCount`, 0);
      return;
    }
    //subtract 1 for header row
    numberOfLines -= 1;
    settings.set(`${inputDataPath}.lineCount`, numberOfLines);
    console.log('total line count:', numberOfLines);
    document.getElementById('showingPreview').innerHTML =
      `<p style="font-size: 0.9em; color: gray"><i>  ...only showing first 10 rows of ${numberOfLines}</i></p>`;
  });
}

function addRow(parent, columns, data) {
  let tr = document.createElement('tr');
  let td = document.createElement('td');

  columns.forEach((c) => {
    td = document.createElement('td');
    td.innerHTML = `<p class="table-cell">  ${(data ? data[c] : c)} </p>`;
    tr.appendChild(td);
  });
  parent.appendChild(tr);
}

function saveSettings() {
  var columns = settings.get(`${settings.get('inputDataPath')}.columns`);
  if (columns && columns.length > 0) {
    var mapping = columns.map((c) => {
      return { column: c, mapping: document.getElementById(`select-${c}`).value };
    });

    const endpoint = determineEndpoint(mapping);
    settings.set(`${settings.get('inputDataPath')}.endpoint`, endpoint.endpoint);
    settings.set(`${settings.get('inputDataPath')}.column-mapping`, endpoint.columns);

    return endpoint.endpoint;
  }
  return 'invalid';
}


function determineEndpoint(columns) {
  const fullText = columns.filter((column) => {
    return column.mapping === 'text';
  });
  const structuredParts = columns.filter((column) => {
    return ['address', 'locality', 'region', 'country', 'postalcode'].indexOf(column.mapping) > -1;
  });
  const reverseParts = columns.filter((column) => {
    return ['point.lat', 'point.lon'].indexOf(column.mapping) > -1;
  });

  if (reverseParts && reverseParts.length === 2) {
    return { endpoint: 'reverse', columns: reverseParts };
  }
  else if (structuredParts && structuredParts.length > 0) {
    return { endpoint: 'search/structured', columns: structuredParts };
  }
  else if (fullText && fullText.length === 1) {
    return { endpoint: 'search', columns: fullText };
  }
  return { endpoint: 'invalid' };
}
