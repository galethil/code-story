const text = (codeStory, spacing = 0) => {
  let finalText;

  for (const storyLine of codeStory) {
    let spaces = '';
    for (let i = 0; i <= spacing; i++) {
      spaces += '  ';
    }

    finalText += `${spaces}${storyLine.name}`;

    if (storyLine.import) {
      finalText += `(${storyLine.import.importFrom})`;
    }

    finalText += "\n";

    if (storyLine.import && storyLine.import.functions) {
      finalText += text(storyLine.import.functions, spacing + 1);
    }

  };

  return finalText;
}

module.exports = {
  text
}
