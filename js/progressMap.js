const { ipcRenderer, shell } = require('electron');
const settings = require('electron-settings');
const _ = require('lodash');
const config = require('../config.json');

const mapzenSearch = require('pelias-batch-search');

// Add a map to the 'map' div
let map = null;
let keepGoing = true;
let totalCount = 0;
let errorCount = 0;
let processedCount = 0;

const venueIcon = L.icon({
    iconUrl: '../dist/venue.png',
    iconSize:     [10, 10], // size of the icon
    popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
});

const addressIcon = L.icon({
    iconUrl: '../dist/address.png',
    iconSize:     [10, 10], // size of the icon
    popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
});

const streetIcon = L.icon({
    iconUrl: '../dist/street.png',
    iconSize:     [10, 10], // size of the icon
    popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
});

const adminIcon = L.icon({
    iconUrl: '../dist/admin.png',
    iconSize:     [10, 10], // size of the icon
    popupAnchor:  [-3, -10] // point from which the popup should open relative to the iconAnchor
});

document.getElementById('body').onload = () => {
  // Add a Mapzen API key
  L.Mapzen.apiKey = settings.get('apiKey');
  map = L.Mapzen.map('map', {
    maxZoom: 18,
    minZoom: 2,
    tangramOptions: {
      scene: {
        import: [
          'https://mapzen.com/carto/refill-style/7/refill-style.zip',
          'https://mapzen.com/carto/refill-style/7/themes/brown-orange.zip'
        ],
        global: { 'sdk_building_extrude': 'false' }
      }
    }
  });

  // Set the center of the map to be the San Francisco Bay Area at zoom level 12
  map.setView([0, 0], 2);

  addLegend();

  const inputDataPath = settings.get('inputDataPath');
  const endpoint = settings.get(`${inputDataPath}.endpoint`);
  const columns = settings.get(`${inputDataPath}.column-mapping`);

  const params = {
    baseUrl: config.search.baseUrl || 'https://search.mapzen.com/v1/',
    qps: config.search.qps || 6,
    inputFile: settings.get('inputDataPath'),
    outputFile: settings.get('outputDataPath'),
    endpoint: endpoint,
    columns: columns,
    queryParams: {
      'api_key': settings.get('apiKey')
    }
  };

  const advancedParams = settings.get('advancedParams');
  if (advancedParams) {
    params.queryParams = _.merge(params.queryParams, advancedParams);
    console.log('full params:', params.queryParams);
  }

  keepGoing = true;

  document.getElementById('btnStop').addEventListener('click', _ => {
    keepGoing = false;
    onFinish();
  });

  totalCount = settings.get(`${settings.get('inputDataPath')}.lineCount`) || 0;
  mapzenSearch(
    params,
    function (updateType, data, bbox) {
      if (keepGoing) {
        switch (updateType) {
          case 'progress':
            updateProgress();
            break;
          case 'row':
            addDotToMap(data, bbox);
            break;
        }
      }
      return keepGoing;
    },
    onFinish
  );
};

function startOver() {
  ipcRenderer.send('loadPage', 'selectInputData');
}

function addLegend() {
  const legend = L.control({ position: 'topright' });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');
    const layers = ['venue', 'address', 'street', 'admin'];

    // loop through our density intervals and generate a label with a colored square for each interval
    layers.forEach((layer) => {
      div.innerHTML += `<img src="../dist/${layer}.png"></img><span>${layer}</span><br/>`;
    });
    return div;
  };

  legend.addTo(map);
}

function onFinish() {
  const progressBar = document.getElementById('progress-done');
  progressBar.style.width = '100%';

  updateProgress();

  const stopBtn = document.getElementById('btnStop');
  stopBtn.addEventListener('click', _ => {
      shell.showItemInFolder(settings.get('outputDataPath'));
    });
  stopBtn.innerHTML = '<i class="button-icons fa fa-fw fa-external-link"></i> Show results file';

  // show the start over button
  document.getElementById('btnStartOver').style.display = 'inline-block';
}

function htmlify(data) {
  let txt = '<div class="table-container"><div id="tableWrapper" class="table-wrapper"><table class="table">';
  for (x in data) {
    if (x.indexOf('res_') === 0) {
      txt += `<tr><td><font color="#7f2de3">${x}: ${data[x]}</font></td></tr>`;
    }
    else {
      txt += `<tr><td>${x}: ${data[x]} </td></tr>`;
    }
  }
  txt += '</table></div></div>';
  return txt;
}

function addDotToMap(data, bbox) {

  if (data.res_label.indexOf('ERROR:') === 0) {
    errorCount++;
    return;
  }

  processedCount++;

  let icon;
  switch (data.res_layer) {
    case 'venue':
      icon = venueIcon;
      break;
    case 'address':
      icon = addressIcon;
      break;
    case 'street':
      icon = streetIcon;
      break;
    default:
      icon = adminIcon;
  }

  const marker = L.marker([data.res_latitude, data.res_longitude], { icon: icon }).addTo(map);
  marker.bindPopup(htmlify(data));

  const bounds = L.latLngBounds(L.latLng(bbox.minLat, bbox.minLon), L.latLng(bbox.maxLat, bbox.maxLon));
  map.fitBounds(bounds, {padding:[50,50]});
}

function updateProgress() {
  if (totalCount === 0) {
    totalCount = settings.get(`${settings.get('inputDataPath')}.lineCount`) || 0;
  }

  const progressTextEl = document.getElementById('progress-text');
  const progress = errorCount + processedCount;

  let progressText = `Processed ${progress} rows`;

  if (errorCount) {
    progressText += ` (errors: ${errorCount})`;
  }

  if (totalCount > 0) {
    const pct = (progress / totalCount * 100).toFixed(0);
    progressText += ` of ${totalCount}`;
    document.getElementById('progress-done').style.width = `${pct}%`;

    if (totalCount === progress) {
      progressText = `Completed: ${progressText}`;
    }
    else if (keepGoing === false) {
      progressText = `Stopped before completion: ${progressText}`;
    }
  }

  progressTextEl.innerHTML = progressText;
}
