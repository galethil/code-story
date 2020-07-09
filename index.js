const parser = require('@babel/parser');
const fs = require('fs');

const { isNamedFunction } = require('./helpers/questions');
const { setImport, setOptions, getFileImports, getImportVariablesNames, getFormattedImports, getListOfCalledFunctionsInFunction, getFunctionFromProgramBody } = require('./helpers/readers');
const FileHandler = require('./helpers/fileHandler');

let storyTemplate;

const getAst = (file) => {
  const text = fs.readFileSync(file, 'utf8');

  const ast = parser.parse(text, {sourceType: 'module'});

  return ast;
};

const describeFunction = async (file, functionName) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const functionDescription = await functionFile.getListOfCalledFunctionsInFunction(functionName);

  return functionDescription;
};

const functionStory = async () => {
  const { name, file } = storyTemplate;

  return await describeFunction(file, name);
};

const codeStory = async (storyTemplateInput) => {
  storyTemplate = storyTemplateInput;

  const { type } = storyTemplate;

  switch (type) {
    case 'functionStory':
      return await functionStory();
    default:
      throw Error('This type of story is not defined');
  }
};

module.exports = codeStory;
