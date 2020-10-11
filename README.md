# code-story

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

  console.log(story);
};

func();

```
