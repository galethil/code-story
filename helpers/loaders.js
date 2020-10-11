const fs = require('fs');
const parser = require('@babel/parser');

const getAst = async (file, currentLocation) => {
  const fileExists = fs.existsSync(file);
  if (!fileExists) {
    throw Error('File doesn\'t exists.');
  }
  const text = fs.readFileSync(file, 'utf8');

  const ast = parser.parse(text, { sourceType: 'module' });

  return ast;
};

const getFileFromImport = async (path) => {
  const jsFile = `${path}.js`;
  if (fs.existsSync(jsFile)) {
    return jsFile;
  }
};

module.exports = {
  getAst,
  getFileFromImport
};
