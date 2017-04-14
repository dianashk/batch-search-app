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
              `<option value="">-- IGNORE --</option>` +
              `<option value="text">Full Address</option>` +
              `<option value="address">Num and Street</option>` +
              `<option value="locality">City</option>` +
              `<option value="region">State</option>` +
              `<option value="country">Country</option>` +
              `<option value="postalcode">Postalcode</option>` +
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
  var i;
  var count = 0;
  fs.createReadStream(inputDataPath)
      .on('data', function (chunk) {
        for (i = 0; i < chunk.length; ++i)
          if (chunk[i] == 10) count++;
      })
      .on('end', function () {
        settings.set(`${inputDataPath}.lineCount`, count);
        console.log('total line count:', count);
        document.getElementById('showingPreview').innerHTML =
          `<p style="font-size: 0.9em; color: gray"><i>  ...only showing first 10 rows of ${count}</i></p>`;

    });
}

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
