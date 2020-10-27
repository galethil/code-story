const parser = require('@babel/parser');
const fs = require('fs');

const { text } = require('./helpers/output');
const { isNamedFunction } = require('./helpers/questions');
const { setImport, setOptions, getFileImports, getImportVariablesNames, getFormattedImports, getListOfCalledFunctionsInFunction, getFunctionFromProgramBody } = require('./helpers/readers');
const FileHandler = require('./helpers/fileHandler');

let storyTemplate;

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


class Output {
  constructor(story) {
    this.story = story;
    this.filteredStory = story;
    this.filter = (condition, stories = this.filteredStory) => {
      stories.elements.forEach(storyLine => {
        if (!condition(storyLine)) {
          storyLine.filteredOut = true;
        }
        if (storyLine.import && storyLine.import.functions) {
          this.filter(condition, storyLine.import.functions);
        }
      });

      return this;
    };
    this.raw = () => this.filteredStory;
    this.text = () => text(this.filteredStory);
  }
}

const codeStory = async (storyTemplateInput) => {
  storyTemplate = storyTemplateInput;

  const { type } = storyTemplate;

  let story;

  switch (type) {
    case 'functionStory':
      story = await functionStory();
      break;
    default:
      throw Error('This type of story is not defined');
  }

  return new Output(story);
};

module.exports = codeStory;
