const { MemberExpression, Identifier } = require('./constants');
const { isCallExpression, isThrowStatement, isIterable } = require('./questions');

const simpleText = (text, spacing = 0) => {
  let finalText = '';
  for (let i = 0; i <= spacing; i++) {
    finalText += '  ';
  }
  finalText += text;
  finalText += "\n";

  return finalText;
};

const text = (codeStory, spacing = 0) => {
  let finalText = '';

  const elements = Array.isArray(codeStory.elements) ? codeStory.elements : codeStory;

  for (const storyLine of elements) {
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
        finalText += ` (${storyLine.file}:${storyLine?.loc?.start?.line}) `;
      }

      finalText += "\n";
    }

    if (storyLine.import && storyLine.import.functions) {
      finalText += text(storyLine.import.functions, spacing + 1);
    }
    const argumentsWithVariable = storyLine.arguments?.filter(argument => argument.type === MemberExpression || argument.type === Identifier);

    if (Array.isArray(argumentsWithVariable))
    for (const argument of argumentsWithVariable) {
      finalText += simpleText(`-> Argument: ${argument.name}`, spacing + 1);
      if (argument.import && argument.import.functions) {
        finalText += text(argument.import.functions, spacing + 1);
      }
    }

  }

  return finalText;
};

const filteredOnly = (codeStory) => {
  let final = [];

  for (const storyLine of codeStory) {
    if (!storyLine.name) continue;
    if (!storyLine.filteredOut) {
      final.push(storyLine);
    }

    if (storyLine.import && storyLine.import.functions) {
      final.push(...filteredOnly(storyLine.import.functions));
    }
    const argumentsWithVariable = storyLine.arguments?.filter(argument => argument.type === MemberExpression || argument.type === Identifier);

    if (Array.isArray(argumentsWithVariable))
    for (const argument of argumentsWithVariable) {
      if (argument.import && argument.import.functions) {
        final.push(...filteredOnly(argument.import.functions));
      }
    }

  }

  return final;
};

const filteredOnlyFlat = (codeStory) => {
  let final = [];

  for (const storyLine of codeStory) {
    if (!storyLine.filteredOut) {
      final.push(storyLine);
    }

    if (storyLine.import && storyLine.import.functions) {
      final.push(...filteredOnlyFlat(storyLine.import.functions));
    }
    const argumentsWithVariable = storyLine.arguments?.filter(argument => argument.type === MemberExpression || argument.type === Identifier);

    if (Array.isArray(argumentsWithVariable))
    for (const argument of argumentsWithVariable) {
      if (argument.import && argument.import.functions) {
        final.push(...filteredOnly(argument.import.functions));
      }
    }

    // loop elements of files
    if (storyLine.program && storyLine.program.body) {
      final.push(...filteredOnlyFlat(storyLine.program.body));
    }

  }

  return final;
};

const custom = (codeStory, formattingFunction) => {
  const elements = codeStory?.elements ? codeStory.elements : codeStory;
  const formattedElements = elements.filter(storyLine => {
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
  filteredOnly,
  filteredOnlyFlat,
  custom
}
