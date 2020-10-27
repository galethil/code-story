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
        finalText += ` [throw]`;
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

  };

  return finalText;
}

module.exports = {
  text
}
