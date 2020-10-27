const readJsDoc = (commentValue) => {
  const tagRegex = /@(\w+)(\ {(\w+)})? ([\w\d ]+)/gmi;
  const matches = commentValue.match(tagRegex);
  const jsDocArray = [];

  if (!matches) return [];

  for (const match of matches) {
   const jsDocLineRegex = /@(\w+)(\ {(\w+)})? ([\w\d ]+)/i;
   const jsDocEntry = match.match(jsDocLineRegex);
   const [,tag,, variableType, value] = jsDocEntry;
   jsDocArray.push({
     tag,
     value,
     variableType
   });
  }

  return jsDocArray;
};

module.exports = {
  readJsDoc
}
