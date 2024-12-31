# code-story

Library that understands your javascript code and can generate formatted structure of your code,
that can be used for documentation, code generators or different validations of code.

```javascript

const codeStory = require('@galethil/code-story');

// options
const functionStoryTemplate = {
  type: 'functionStory',
  name: 'getAllUsers',
  file: './src/modules/users/users.handler.js',
  followImports: true,
  followFunctions: true,
  followImportsDeptLevel: 2
};

const func = async () => {
  const story = await codeStory(functionStoryTemplate);

  console.log(story.raw());
};

func();

```

## Outputs

There are 3 types of outputs:

* `.raw()` - will output array with all the details you can use in your application
* `.filteredOnly()` - will output array with all the details but only filtered elements (you have to use filtering before)
* `.text()` - will output simple text output
* `.output(storyLine => storyline.name)` - custom output that will format lines using defined function

## Flat

As a standard way of output structured list is produced. If you need a simple list, you can flatten the output using `.flat()` method.

```javascript
const story = await codeStory(functionStoryTemplate);

const filteredOutput = story.flat().text();
```

## Filtering

In the output you can user custom filtering with `.filter()`. E.g. if I want to display only Throw statements of only specific called functions.

```javascript
const story = await codeStory(functionStoryTemplate);
// Filtering only throw statements
const filteredOutput = story.filter(storyLine => storyLine.type === 'ThrowStatement').text();
```

```javascript
const story = await codeStory(functionStoryTemplate);
// Showing only first arguments of all `res.status` functions called
const listOfStatuses = story
  .flat()
  .filter(
    storyLine =>
      storyLine.type === 'CallExpression'
      && storyLine.name
      && storyLine.name.includes('res.status')
  ).output(storyLine => (storyLine.arguments[0].value))
  .elements;
```

## Custom story

Define what you are searching for in your code

### Example: Give me all usages of "data-test-id" attribute in my React application

```javascript
const customStoryTemplate = {
  type: "customStory",
  path: "./ui/src/**/*.js",
  babelPlugins: ["jsx", "classProperties"],
};

const story = await codeStory(customStoryTemplate);

const dataTestIds = story
  // filter only JSX elements that contain "data-test-id"
  .filter(
    (storyLine) =>
      storyLine.type === "JSXElement" &&
      storyLine.openingElement.attributes.find(
        (attr) => attr.name?.name === "data-test-id"
      )
  )
  // make output flat into one flat array / custom modifier function to add also parent file name
  .filteredOnlyFlat(
    (storyLine, parentElements) =>
      (storyLine.file = parentElements[parentElements.length - 1])
  )
  // throw away all that was filtered out
  .filter((storyLine) => storyLine?.filteredOut === false)
  // format nice output for our needs
  .map((storyLine) => {
    return {
      name: storyLine.openingElement.name.name,
      dataTestId: storyLine.openingElement.attributes.find(
        (attr) => attr.name?.name === "data-test-id"
      ).value?.value,
      file: storyLine.file.fileLoc,
    };
  });

console.log(dataTestIds)
// OUTPUT
//   {
//     name: 'div',
//     dataTestId: 'activityAdd-rightSection-addNewActivity',
//     file: './ui/src/containers/admin/AddNewActivity.js'
//   },
//   {
//     name: 'Tabs',
//     dataTestId: 'reports-menu',
//     file: './ui/src/containers/admin/AdminReports.js'
//   },
//   {
//     name: 'Button',
//     dataTestId: 'submitButton',
//     file: './ui/src/components/SubmitButton.js'
//   },
//   ...
```

