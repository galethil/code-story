const path = require('path');
const {
  hasArguments,
  isReturnStatement,
  isCallExpression,
  isAwaitExpression,
  isIdentifier,
  isExpressionStatement,
  isAssignmentExpression,
  isBlockStatement,
  isVariableDeclaration,
  isVariableDeclarator,
  isArrayExpression,
  isIfStatement,
  isArrowFunctionExpression,
  isMemberExpression,
  isEs6Function,
  isClassicFunction,
  isNamedClassicFunction,
  isNamedEs6Function,
  isNamedFunction,
  isImport,
  isImportTypeImport,
  isRequireTypeImport,
  isMultiVariableImport,
  isLocalPath
} = require('./questions');


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
  return body.find((element, index) => {
    if (isNamedClassicFunction(element, functionName)) {
      return element;
    } else if (isNamedEs6Function(element, functionName)) {
      return element;
    }
  });
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
  getFileImports,
  getImportVariableName,
  getImportVariablesNames,
  getImportImportedName,
  getFormattedImports,
  getFormattedImportByActiveName,
  getMethodOrFunctionName,
  getFolderFromImport
};
