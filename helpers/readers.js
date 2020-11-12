const path = require('path');
const {
  hasLeadingComments,
  isJsDoc,
  isNamedClassicFunction,
  isNamedEs6Function,
  isNamedVariable,
  isImport,
  isImportTypeImport,
  isRequireTypeImport,
  isMultiVariableImport,
  isLocalPath
} = require('./questions');
const { readJsDoc } = require('./jsDoc');


// FUNCTIONS

const getMethodOrFunctionName = (name, importDefinition) => {
  const { activeName, originalName } = importDefinition;
  // just simple name of function
  if (name === activeName) {
    return originalName;
  } else if (name.substr(0, activeName.length + 1) === `${activeName}.`) {
    return name.substr(activeName.length + 1);
  }
};

const getFunctionFromProgramBody = (body, functionName) => {
  const foundElement = body.find((element) => {
    if (isNamedClassicFunction(element, functionName) || isNamedEs6Function(element, functionName)) {
      return true;
    }
  });

  let jsDoc;
  if (hasLeadingComments(foundElement)) {
    if (isJsDoc(foundElement.leadingComments)) {
      const jsDocText = foundElement.leadingComments.map(comment => comment.value).join('\n');
      jsDoc = readJsDoc(jsDocText);
      foundElement.jsDoc = jsDoc;
    }
  }
  return foundElement;
};

const getVariableFromProgramBody = (body, variableName) => {
  const foundElement = body.find((element) => {
    if (isNamedVariable(element, variableName)) {
      console.log('true', variableName, element.declarations);
      return true;
    }
  });

  let jsDoc;
  if (hasLeadingComments(foundElement)) {
    if (isJsDoc(foundElement.leadingComments)) {
      const jsDocText = foundElement.leadingComments.map(comment => comment.value).join('\n');
      jsDoc = readJsDoc(jsDocText);
      foundElement.jsDoc = jsDoc;
    }
  }
  return foundElement;
};

// IMPORTS

const getFolderFromImport = (pathToFile) => {
  return path.dirname(pathToFile);
};

const getFormattedImportByActiveName = (name, formattedImports) => {
  return formattedImports.find(importItem => {
    if (importItem.activeName === name) {
      return true;
    }
  });
};

const getFileImports = (ast) => {
  const programBody = ast.program.body;

  // filter all imports
  return programBody.filter(element => isImport(element));
};

const getImportVariableName = (element) => {
  if (isMultiVariableImport(element)) throw Error('Cannot get single variable from multivariable import');

  if (isRequireTypeImport(element)) {
    return element.declarations[0].id.name;
  } else if (isImportTypeImport(element)) {
    return element.specifiers[0].local.name;
  }
};

const getImportVariablesNames = (element, originalName = false) => {
  if (isRequireTypeImport(element)) {
    if (!isMultiVariableImport(element)) {
      return [element.declarations[0].id.name];
    } else {
      return element.declarations[0].id.properties.map(property => {
        if (originalName) {
          return property.key.name;
        } else {
          return property.value.name;
        }
      });
    }
  } else if (isImportTypeImport(element)) {
    return element.specifiers.map(specifier => {
      if (originalName) {
        return specifier.imported.name;
      } else {
        return specifier.local.name;
      }
    });
  }
};

const getImportImportedName = (element) => {
  if (isRequireTypeImport(element)) {
   return element.declarations[0].init.arguments[0].value;
  } else if (isImportTypeImport(element)) {
   return element.source.value;
  }
 };

const getFormattedImports = (imports) => {
  const formattedImports = [];
  imports.forEach(importElement => {
    const originalNames = getImportVariablesNames(importElement, true);
    const activeNames = getImportVariablesNames(importElement, false);
    const importFrom = getImportImportedName(importElement);
    const isLocalImport = isLocalPath(importFrom);

    originalNames.forEach((originalName, index) => {
      formattedImports.push({
        originalName,
        activeName: activeNames[index],
        importFrom,
        isLocalImport
      });
    });
  });

  imports = formattedImports;

  return formattedImports;
};

module.exports = {
  getFunctionFromProgramBody,
  getVariableFromProgramBody,
  getFileImports,
  getImportVariableName,
  getImportVariablesNames,
  getImportImportedName,
  getFormattedImports,
  getFormattedImportByActiveName,
  getMethodOrFunctionName,
  getFolderFromImport
};
