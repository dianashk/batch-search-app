const request = require('request');

//Retrieve full WOF record given the WOF id.
function query(options, callback) {
  let { host, id } = options;

  // set default host  
  host = host || 'https://whosonfirst.mapzen.com';

  const subPath = `${id.substr(0, 3)}/${id.substr(3, 3)}/${id.substr(6)}`;
  const query = `${host}/data/${subPath}/${id}.geojson`;
  
  request.get(query, (err, res) => {
    if (err) {
      return callback(err);
    }

    var results = JSON.parse(res.body);
    callback(null, results);
  });
}

module.exports = query;