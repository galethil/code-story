const parser = require("@babel/parser");
const fs = require("fs");
const glob = require("glob");

const {
  text,
  filteredOnly,
  filteredOnlyFlat,
  custom,
} = require("./helpers/output");
const FileHandler = require("./helpers/fileHandler");
const { MemberExpression, Identifier } = require("./helpers/constants");
const { loopAllChildren } = require("./helpers/readers");

let storyTemplate;

const describeFunction = async (file, functionName, params) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const functionDescription =
    await functionFile.getListOfCalledFunctionsInFunction(functionName, params);

  return functionDescription;
};

const findUsages = async (file, functionName) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const list = await functionFile.getListOfSpecificFunctionsCallsInFile(
    functionName
  );
  // console.log('list', file);
  return list;
};

const describeVariable = async (file, variableName) => {
  const functionFile = new FileHandler(file, storyTemplate);
  await functionFile.load();

  const variableDescription = await functionFile.getDetailsOfVariable(
    variableName
  );

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
  }

  return retArray;
};

const functionStory = async () => {
  const { name, file, params } = storyTemplate;

  return await describeFunction(file, name, params);
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
  const { path, file, functionName } = storyTemplate;
  if (!path && !file) throw Error("`path` or `file` is required for custom story");

  if (functionName) {
    return await describeFunction(path || file, functionName);
  }
  return await describeFiles(path || file);
};

class Output {
  constructor(story) {
    this.filter = (condition, stories = this.filteredStory) => {
      const elements = Array.isArray(stories.elements)
        ? stories.elements
        : stories;
      elements.forEach((storyLine, index) => {
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
    this.filter((element) => element && element.name);

    this.isFlat = false;

    this.flat = () => {
      const flatLoop = (elements) => {
        // extract elements from object if neccesary
        if (elements?.elements) {
          elements = elements.elements;
        }
        const flatElements = [];
        if (!elements) return flatElements;
        elements.forEach((storyLine) => {
          flatElements.push(storyLine);
          if (storyLine.import && storyLine.import.functions) {
            flatElements.push(...flatLoop(storyLine.import.functions));
            delete storyLine.import.functions;
          }

          if (storyLine.arguments) {
            for (const argument of storyLine.arguments) {
              if (
                argument.type === MemberExpression ||
                argument.type === Identifier
              ) {
                flatElements.push({ ...argument, import: undefined });
              }
              if (argument.import) {
                flatElements.push(...flatLoop(argument.import.functions));
                delete argument.import;
              }
            }

            // storyLine.arguments = [];
          }
        });

        //console.log(flatElements);

        return flatElements;
      };

      this.filteredStory = flatLoop(this.filteredStory);

      return this;
    };
    this.raw = () => this.filteredStory;
    this.filteredOnly = () => filteredOnly(this.filteredStory);
    this.text = () => text(this.filteredStory);
    this.output = (customFormatterFunction) =>
      custom(this.filteredStory, customFormatterFunction);
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
        elements.forEach((storyLine) => {
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
    this.output = (customFormatterFunction) =>
      custom(this.filteredStory, customFormatterFunction);
  }
}

class CustomOutput {
  constructor(story) {
    this.filter = (condition, stories = this.filteredStory) => {
      loopAllChildren(stories, (storyLine) => {
        if (!condition(storyLine)) {
          storyLine.filteredOut = true;
        } else {
          storyLine.filteredOut = false;
        }
      });
      // elements.forEach((storyLine, index) => {
      //   if (!storyLine) return;
      //   if (!storyLine && stories.elements) delete stories.elements[index];

      //   if (!condition(storyLine)) {
      //     storyLine.filteredOut = true;
      //   }
      //   if (storyLine.import && storyLine.import.functions) {
      //     this.filter(condition, storyLine.import.functions);
      //   }
      //   this.filter(condition, loopAllChildren(storyLine));
      // });

      return this;
    };
    this.story = story;
    this.filteredStory = this.story;

    this.isFlat = false;

    this.flat = () => {
      const flatLoop = (elements) => {
        const flatElements = [];
        if (!elements) {
          return flatElements;
        }
        elements.forEach((storyLine) => {
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
    this.filteredOnlyFlat = (modifier) => loopAllChildren(this.filteredStory, modifier, true);
    this.output = (customFormatterFunction) =>
      loopAllChildren(this.filteredStory, customFormatterFunction);
  }
}

const codeStory = async (storyTemplateInput) => {
  storyTemplate = storyTemplateInput;

  const { type } = storyTemplate;

  let story;

  switch (type) {
    case "functionStory":
      story = await functionStory();
      break;
    case "usageStory":
      story = await usageStory();
      break;
    case "variableStory":
      story = await variableStory();
      return new VariableOutput(story);
    case "customStory":
      story = await customStory();
      return new CustomOutput(story);
    default:
      throw Error("This type of story is not defined");
  }

  return new Output(story);
};

module.exports = codeStory;
