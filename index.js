const parser = require('@babel/parser');
const fs = require('fs');
const glob = require('glob');

const { text, custom } = require('./helpers/output');
const { isNamedFunction } = require('./helpers/questions');
const FileHandler = require('./helpers/fileHandler');

let storyTemplate;

const describeFunction = async (file, functionName) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const functionDescription = await functionFile.getListOfCalledFunctionsInFunction(functionName);

  return functionDescription;
};

const findUsages = async (file, functionName) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const list = await functionFile.getListOfSpecificFunctionsCallsInFile(functionName);
  console.log('list', list);
  return list;
};

const describeVariable = async (file, variableName) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const variableDescription = await functionFile.getDetailsOfVariable(variableName);

  return variableDescription;
};

const describeFiles = async (path) => {
  const files = glob.sync(path);
  const retArray = [];
  for (const fileName of files) {
    const functionFile = new FileHandler(fileName, storyTemplate);
    await functionFile.load();

    const variableDescription = await functionFile.getDetailsAboutAll();

    retArray.push(variableDescription);
  };

  return retArray;
};

const functionStory = async () => {
  const { name, file } = storyTemplate;

  return await describeFunction(file, name);
};

const usageStory = async () => {
  const { name, file } = storyTemplate;

  return await findUsages(file, name);
};

const variableStory = async () => {
  const { name, file } = storyTemplate;

  return await describeVariable(file, name);
};

const customStory = async () => {
  const { path } = storyTemplate;

  return await describeFiles(path);
};


class Output {
  constructor(story) {
    this.filter = (condition, stories = this.filteredStory) => {
      if (!stories.elements) return this;
      stories.elements.forEach((storyLine, index) => {
        if (!storyLine) delete stories.elements[index];
        if (!condition(storyLine)) {
          storyLine.filteredOut = true;
        }
        if (storyLine.import && storyLine.import.functions) {
          this.filter(condition, storyLine.import.functions);
        }
      });

      return this;
    };
    this.story = story;
    this.filteredStory = this.story;
    this.filter(element => element && element.name);

    this.isFlat = false;

    this.flat = () => {
      const flatLoop = (elements) => {
        const flatElements = [];
        if (!elements) return flatElements;
        elements.forEach(storyLine => {
          flatElements.push(storyLine);
          if (storyLine.import && storyLine.import.functions) {
            flatElements.push(...flatLoop(storyLine.import.functions.elements));
            delete storyLine.import.functions;
          }
        });

        return flatElements;
      };
      this.filteredStory.elements = flatLoop(this.filteredStory.elements);

      return this;
    };
    this.raw = () => this.filteredStory;
    this.text = () => text(this.filteredStory);
    this.output = (customFormatterFunction) => custom(this.filteredStory, customFormatterFunction);
  }
}

class VariableOutput {
  constructor(story) {
    this.filter = (condition, stories = this.filteredStory) => {
      if (!stories.elements) return this;
      stories.elements.forEach((storyLine, index) => {
        if (!storyLine) delete stories.elements[index];
        if (!condition(storyLine)) {
          storyLine.filteredOut = true;
        }
        if (storyLine.import && storyLine.import.functions) {
          this.filter(condition, storyLine.import.functions);
        }
      });

      return this;
    };
    this.story = story;
    this.filteredStory = this.story;

    this.isFlat = false;

    this.flat = () => {
      const flatLoop = (elements) => {
        const flatElements = [];
        if (!elements) return flatElements;
        elements.forEach(storyLine => {
          flatElements.push(storyLine);
          if (storyLine.import && storyLine.import.functions) {
            flatElements.push(...flatLoop(storyLine.import.functions.elements));
            delete storyLine.import.functions;
          }
        });

        return flatElements;
      };
      this.filteredStory.elements = flatLoop(this.filteredStory.elements);

      return this;
    };
    this.findAll = () => {


      return this;
    };
    this.raw = () => this.filteredStory;
    this.text = () => text(this.filteredStory);
    this.output = (customFormatterFunction) => custom(this.filteredStory, customFormatterFunction);
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
    case 'usageStory':
      story = await usageStory();
      break;
    case 'variableStory':
      story = await variableStory();
      return new VariableOutput(story);
    case 'customStory':
      story = await customStory();
      return new VariableOutput(story);
    default:
      throw Error('This type of story is not defined');
  }

  return new Output(story);
};

module.exports = codeStory;
