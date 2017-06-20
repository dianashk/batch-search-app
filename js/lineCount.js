const fs = require('fs');
const split = require('split');

function countLines(filePath, callback) {
  let readError;
  let lineCount = 0;

  fs.createReadStream(filePath)
    .pipe(split())
    .on('data', (line) => {
      if (line.trim().length > 0) {
        lineCount++;
      }
    })
    .on('end', () => {
      if (readError) {
        return;
      }

      callback(null, lineCount);
    })
    .on('error', (error) => {
      readError = true;

      callback(error);
    });
}

module.exports = countLines;