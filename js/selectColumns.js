const { ipcRenderer } = require('electron');
const settings = require('electron-settings');
const fs = require('fs');
const csvReader = require('csv-stream');
const through = require('through2');

document.getElementById('btnPrevSelectInputDataFile').addEventListener('click', _ => {
  ipcRenderer.send('loadSelectInputData');
});

document.getElementById('btnNextStart').addEventListener('click', _ => {
  ipcRenderer.send('loadStart');
});

document.getElementById('body').onload = () => {
  console.log('onload', settings.get('inputDataPath'));

  if (settings.has('inputDataPath')) {
    const data = fs.readFileSync(settings.get('inputDataPath'));
    const table = document.getElementById('inputDataPreview');

    const options = {
      delimiter: ',', // default is ,
      endLine: '\n', // default is \n,
      escapeChar: '"', // default is an empty string
      enclosedChar: '"' // default is an empty string
    };

    let count = 0; 
    let columns = [];

    const input = fs.createReadStream(settings.get('inputDataPath'));

    input.pipe(csvReader.createStream(options))
      .pipe(through.obj((data, enc, next) => {
      
        // add column headers on first row
        if (count === 0) {
          columns = Object.keys(data);

          const thead = document.createElement('thead');
                    
          const checkboxes = columns.map((h) => {
            return `<form><div class="form-group" style="text-align: center; margin-bottom: 0px;">` +
              `<input type="checkbox" name="selected-columns" id="${h}">` +
              `<label></label></div></form>`;
          });          
          addRow(thead, ['   '].concat(checkboxes));

          const dropdowns = columns.map((h) => {
            return `<select name="selected-columns" id="${h}">` +
              `<option>-select-</option>` +
              `<option>Full Address</option>` +
              `<option>Num and Street</option>` +
              `<option>City</option>` +
              `<option>Region</option>` +
              `<option>Country</option>` +
              `<option>Postalcode</option>` +
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
          document.getElementById('showingPreview').innerHTML = '<p style="font-size: 0.9em; color: gray"><i>  ...only showing first 10 rows</i></p>';
          return input.destroy();
        }
        next();
      }));
  }
};

function addRow(parent, columns, data) {
  let tr = document.createElement('tr');
  let td = document.createElement('td');
        
  columns.forEach((c) => {
    td = document.createElement('td');
    td.innerHTML = (data ? data[c] : c);
    tr.appendChild(td);
  });
  parent.appendChild(tr);
}
