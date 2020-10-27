const { isCallExpression, isThrowStatement } = require('./questions');

const text = (codeStory, spacing = 0) => {
  let finalText = '';

  for (const storyLine of codeStory.elements) {
    if (!storyLine.name) continue;
    if (!storyLine.filteredOut) {
      let spaces = '';
      for (let i = 0; i <= spacing; i++) {
        spaces += '  ';
      }

      finalText += `${spaces}${storyLine.name}`;

      if (isThrowStatement(storyLine)) {
        finalText += ` [throw with arguments: ${storyLine.arguments.map(arg => arg.value).join(', ')}]`;
      }

      if (storyLine.import && storyLine.import.functions && storyLine.import.functions.jsDoc) {
        const { jsDoc } = storyLine.import.functions;
        const summary = jsDoc.find(line => line.tag === 'summary');
        const description = jsDoc.find(line => line.tag === 'description');
        const summaryOrDescription = summary || description || {value: ''};
        finalText += ` - ${summaryOrDescription.value}`;
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

  }

  return finalText;
};

const custom = (codeStory, formattingFunction) => {
  const formattedElements = codeStory.elements.filter(storyLine => {
    if (!storyLine) return false;
    if (!storyLine.name) return false;
    if (storyLine.filteredOut) return false;

    return true;
  }).map(storyLine => {
    if (storyLine.import && storyLine.import.functions) {
      storyLine.import.functions = custom(storyLine.import.functions, formattingFunction);
    }

    return formattingFunction(storyLine);

  });

  return {
    ...codeStory,
    elements: formattedElements
  };
};

module.exports = {
  text,
  custom
}
