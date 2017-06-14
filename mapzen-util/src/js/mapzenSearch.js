const querystring = require('querystring');
const request = require('request');

/**
 * @param {object} options 
 * @param {string} options.host 
 * @param {string} options.api_key 
 * @param {string} options.endpoint 
 * @param {string} options.params 
 * @param {function} callback 
 */
function query(options, callback) {
  let { host, api_key, endpoint, params } = options;

  // set default host  
  host = host || 'https://search.mapzen.com';

  const query = `${host}/v1/${endpoint}?api_key=${api_key}&${querystring.stringify(params)}`;
  request.get(query, (err, res) => {
    if (err) {
      return callback(err);
    }

    var results = JSON.parse(res.body);
    callback(null, results);
  });
}

module.exports = query;
