var express = require('express');
var fs = require('fs');
var request = require('request');
var querystring = require('querystring');
var settings = require('electron-settings');
const async = require('async');


// initialize our web server
var app = express();
let callbackServer;
let oauth_config;


// obtain an authorization code by redirecting to the host
// and allowing the user to login and click authorize
function authenticate(config, ipcRenderer, clearCache, callback) {
  getAuthCallback = null;
  oauth_config = config;

  if (isAuthenticated()) {
    return getUserData(callback);
  }

  initAuthCallbackServer(ipcRenderer, clearCache, callback);  
}

function isAuthenticated() {
  console.log('checking if already authenticated...');
  console.log(
    'token is ' + settings.get('auth_token'),
    'expires on ' + settings.get('auth_expiration'),
    'current time is ' + (Date.now()/1000),
    (settings.get('auth_token') && (settings.get('auth_expiration') > (Date.now()/1000))?'authenticated' : 'not authenticated'));

  return settings.get('auth_token') && (settings.get('auth_expiration') > (Date.now()/1000));
}

function initAuthCallbackServer(ipcRenderer, clearCache, callback) {
  // receive the authorization code from the host
  app.get('/mapzen/auth/callback', function (req, res) {
    var code = req.query.code;
    console.log('\n\nauthorization callback headers\n', req.headers);
    console.log('\n\nreceived authorization code: ' + code);
    exchangeToken(code, function (error, token, expiration) {
      if (error) {
        res.send(error);
        console.log(error);
        return;
      }
      res.send('all good');

      // send message to main window to close auth window
      ipcRenderer.send('login-success');

      // save token and user data to local settings
      settings.set('auth_token', token);
      settings.set('auth_expiration', expiration);

      console.log(expiration, settings.get('auth_expiration'));

      console.log('token = ' + token);

      callbackServer.close();

      getUserData(callback);
    });
  });

  callbackServer = app.listen(9000, function () {
    console.log('listening to port 9000');

    var query = querystring.stringify({
      client_id: oauth_config.client_id,
      redirect_uri: oauth_config.redirect_uri,
      response_type: 'code'
    });
    ipcRenderer.send('login', `${oauth_config.host}/oauth/authorize?${query}`, clearCache);
  });

}  

// exchange our authorization code for an access token
function exchangeToken(code, callback) {
  // make POST to /oauth/token with x-www-form-urlencoded client_id etc.
  request.post({
    url: oauth_config.host+'/oauth/token',
    form: {
      client_id: oauth_config.client_id,
      client_secret: oauth_config.client_secret,
      redirect_uri: oauth_config.redirect_uri,
      grant_type: 'authorization_code',
      code: code
    }
  }, function(error, response, body) {
    if (error) {
      // return any errors we got
      callback(error);
      return;
    }
    // log the response headers in case we need to debug issues
    console.log('\n\nexchange token response headers\n', response.headers);
    console.log(body);

    var parsed = JSON.parse(body);
    if (parsed.access_token) {
      // success! return our token
      callback(null, parsed.access_token, parsed.created_at + parsed.expires_in);
    } else {
      // something weird happened so return the body as an error
      callback(parsed);
    }
  });
}

function getUserData(callback) {
  async.series(
    [
      getUserProfile,
      getKeys
    ],
    callback);
}

function getKeys(callback) {
  request.get(`${oauth_config.host}/developers/oauth_api/current_developer/keys`,
    {
      headers: {
        'Authorization': 'Bearer ' + settings.get('auth_token')
      }
    }, function (err, res) {
      if (err) {
        return callback(err);
      }

      var keysSelector = document.createElement('select');
      //Create and append the options
      var keys = JSON.parse(res.body);
      settings.set('user_keys', keys);

      callback(null, keys);
    });
}

function getUserProfile(callback) {
  request.get(`${oauth_config.host}/developers/oauth_api/current_developer`,
    {
      headers: {
        'Authorization': 'Bearer ' + settings.get('auth_token')
      }
    }, function (err, res) {
      if (err) {
        return callback(err);
      }

      var userData = JSON.parse(res.body);
      settings.set('user_nickname', userData.nickname);
      settings.set('user_avatar', userData.avatar);
      settings.set('user_email', userData.email);

      callback(null, userData);
    });
}

module.exports.authenticate = authenticate;