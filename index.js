const parser = require('@babel/parser');
const fs = require('fs');

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

const functionStory = async () => {
  const { name, file } = storyTemplate;

  return await describeFunction(file, name);
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
