# code-story

Library that understands your javascript code and can generate formatted structure of your code,
that can be used for documentation, code generators or different validations of code.

```javascript

const codeStory = require('code-story');

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


