// fileMock - it returns just a string with the file name,
// to check that the correct file was called.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  process (src, filename) {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(filename))};`
    };
  }
};
