const { isCallExpression, isThrowStatement } = require('./questions');

const text = (codeStory, spacing = 0) => {
  let finalText = '';

  for (const storyLine of codeStory) {
    if (!storyLine.name) continue;
    if (!storyLine.filteredOut) {
      let spaces = '';
      for (let i = 0; i <= spacing; i++) {
        spaces += '  ';
      }

      finalText += `${spaces}${storyLine.name}`;

      if (isThrowStatement(storyLine)) {
        finalText += `[throw]`;
      }

      // if (storyLine.import) {
      //   finalText += ` (${storyLine.import.importFrom})`;
      // }
      if (storyLine.file) {
        finalText += ` (${storyLine.file})`;
      }

      finalText += "\n";
    }

    if (storyLine.import && storyLine.import.functions) {
      finalText += text(storyLine.import.functions, spacing + 1);
    }

  };

  return finalText;
}

module.exports = {
  text
}
