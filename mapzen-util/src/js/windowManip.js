const path = require('path')
const url = require('url')

/**
 * Change the contents of the main window to the specified page
 * The pageName parameter is the filename within the ./public directory that will be loaded (without .html)
 *
 * @param {string} pageName 
 */
module.exports.loadPage = function loadPage(window, pageName) {
  window.loadURL(url.format({
    pathname: path.join(__dirname, '../../public', `${pageName}.html`),
    protocol: 'file:',
    slashes: true
  }));
}
