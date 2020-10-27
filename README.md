# code-story

Library that understands your code and can generate formatted structure of your code,
that can be used for documentation, code generators or different validations of code.

```javascript

const codeStory = require('code-story');

// options
const functionStoryTemplate = {
  type: 'functionStory',
  name: 'getAllUsers',
  file: './server/modules/users/users.handler.js',
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

## Filtering

In the output you can user custom filtering with `.filter()`. E.g. if I want to display only Throw statements

```javascript
const story = await codeStory(functionStoryTemplate);

const filteredOutput = story.filter(storyLine => storyLine.type === 'ThrowStatement').text();
```

## Flat

As a standard way of output structured list is produced. If you need a simple list, you can flatten the output using `.flat()` method.

```javascript
const story = await codeStory(functionStoryTemplate);

const filteredOutput = story.flat().text();
```
