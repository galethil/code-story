const path = require("path");
const {
  hasLeadingComments,
  isJsDoc,
  isNamedClassicFunction,
  isNamedEs6Function,
  isNamedExportNamedDeclaration,
  isNamedVariable,
  isExportNamedDeclaration,
  isImport,
  isIdentifier,
  isImportNamespaceSpecifier,
  isImportTypeImport,
  isRequireTypeImport,
  isMultiVariableImport,
  isLocalPath,
  isCallExpression,
  isMemberExpression,
  functionHasSpecificArguments,
  isFile,
  isAwaitExpression,
  isArrayExpression,
  isProgram,
  isExpressionStatement,
  isVariableDeclaration,
  isVariableDeclarator,
  isBlockStatement,
  isIfStatement,
  isFunction,
  isEs6Function,
  isClassicFunction,
  isReturnStatement,
  isJSXElement,
} = require("./questions");
const { readJsDoc } = require("./jsDoc");

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

const getFunctionFromProgramBody = (body, functionName, args) => {
  let foundElement = body.find((element) => {
    if (
      (isNamedClassicFunction(element, functionName) ||
        isNamedEs6Function(element, functionName) ||
        isNamedExportNamedDeclaration(element, functionName)) &&
      functionHasSpecificArguments(element, args)
    ) {
      return true;
    }
  });

  if (isExportNamedDeclaration(foundElement)) {
    foundElement = foundElement.declaration;
  }

  let jsDoc;
  if (hasLeadingComments(foundElement)) {
    if (isJsDoc(foundElement.leadingComments)) {
      const jsDocText = foundElement.leadingComments
        .map((comment) => comment.value)
        .join("\n");
      jsDoc = readJsDoc(jsDocText);
      foundElement.jsDoc = jsDoc;
    }
  }

  return foundElement;
};

const getFunctionCallFromProgramBody = (body, functionName) => {
  let foundElement = body.find((element) => {
    if (
      isCallExpression(element) ||
      (element.expression &&
        isCallExpression(element.expression) &&
        isMemberExpression(element?.expression?.callee) &&
        `${element?.expression?.callee?.object?.name}.${element?.expression?.callee?.property?.name}` ===
          functionName)
    ) {
      return true;
    }
  });

  if (isExportNamedDeclaration(foundElement)) {
    foundElement = foundElement.declaration;
  }

  let jsDoc;
  if (hasLeadingComments(foundElement)) {
    if (isJsDoc(foundElement.leadingComments)) {
      const jsDocText = foundElement.leadingComments
        .map((comment) => comment.value)
        .join("\n");
      jsDoc = readJsDoc(jsDocText);
      foundElement.jsDoc = jsDoc;
    }
  }

  return foundElement;
};

const getVariableFromProgramBody = (body, variableName) => {
  const foundElement = body.find((element) => {
    if (isNamedVariable(element, variableName)) {
      return true;
    }
  });

  let jsDoc;
  if (hasLeadingComments(foundElement)) {
    if (isJsDoc(foundElement.leadingComments)) {
      const jsDocText = foundElement.leadingComments
        .map((comment) => comment.value)
        .join("\n");
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
  return formattedImports.find((importItem) => {
    if (importItem.activeName === name) {
      return true;
    }
  });
};

const getFormattedParamByActiveName = (name, formattedParams = []) => {
  const foundParam = formattedParams.find((paramItem) => {
    if (paramItem.paramName === name) {
      return true;
    }
  });
  if (foundParam && typeof foundParam === "object") {
    return {
      originalName: foundParam.paramName,
      activeName: foundParam.paramName,
      importFrom: foundParam.file,
      isLocalImport: true,
    };
  }
};

const getFileImports = (ast) => {
  const programBody = ast.program ? ast.program.body : ast.body;

  // filter all imports
  return programBody
    .filter((element) => isImport(element))
    .map((imp) => ({ ...imp, fileLoc: ast.fileLoc }));
};

const getImportVariableName = (element) => {
  if (isMultiVariableImport(element))
    throw Error("Cannot get single variable from multivariable import");

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
      return element.declarations[0].id.properties.map((property) => {
        if (originalName) {
          return property.key.name;
        } else {
          return property.value.name;
        }
      });
    }
  } else if (isImportTypeImport(element)) {
    return element.specifiers.map((specifier) => {
      if (originalName) {
        // js
        if (specifier.imported) {
          return specifier.imported.name;
        }

        // ts
        // import * as Name from 'library';
        if (isIdentifier(specifier)) {
          return specifier.local.name;
        }
        // import name from 'library'
        if (isImportNamespaceSpecifier(specifier)) {
          return specifier.local.name;
        }
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
  imports.forEach((importElement) => {
    const originalNames = getImportVariablesNames(importElement, true);
    const activeNames = getImportVariablesNames(importElement, false);
    const importFrom = getImportImportedName(importElement);
    const isLocalImport = isLocalPath(importFrom);
    if (!importFrom) console.log("importElement", importElement);
    originalNames.forEach((originalName, index) => {
      formattedImports.push({
        originalName,
        activeName: activeNames[index],
        importFrom,
        isLocalImport,
      });
    });
  });

  imports = formattedImports;

  return formattedImports;
};

const loopAllChildren = (node, modifier, returnFlat = false, parentElements = []) => {
  const elements = Array.isArray(node) ? node : [node];

  const flatChildren = [];

  elements.forEach((element) => {
    if (element) {
      if (modifier) {
        modifier(element, parentElements);
      }

      // first add this element
      if (returnFlat) {
        flatChildren.push(element);
      }

      // then add children based on type

      if (isFile(element)) {

        if (element.program) {
          flatChildren.push(...loopAllChildren(element.program, modifier, returnFlat, [element, ...parentElements]));
        }
      }
      if (isProgram(element)) {
        if (element.body) {
          flatChildren.push(...loopAllChildren(element.body, modifier, returnFlat, [element, ...parentElements]));
        }
      }
      if (isCallExpression(element)) {
        if (element.arguments) {
          element.arguments.forEach((argument) => {
            flatChildren.push(argument, modifier, returnFlat, [element, ...parentElements]);
          });
        }
      }
      if (isAwaitExpression(element)) {
        flatChildren.push(element.argument);
      }
      if (isEs6Function(element)) {
        flatChildren.push(element.params);
        flatChildren.push(element.body);
        flatChildren.push(...loopAllChildren(element.params, modifier, returnFlat, [element, ...parentElements]));
        flatChildren.push(...loopAllChildren(element.body, modifier, returnFlat, [element, ...parentElements]));
      }
      if (isClassicFunction(element)) {
        flatChildren.push(element.id, modifier, returnFlat);
        flatChildren.push(element.params, modifier, returnFlat);
        flatChildren.push(element.body, modifier, returnFlat);
        flatChildren.push(...loopAllChildren(element.params, modifier, returnFlat, [element, ...parentElements]));
        flatChildren.push(...loopAllChildren(element.body, modifier, returnFlat, [element, ...parentElements]));
      }

      if (isMemberExpression(element)) {
        flatChildren.push(element.object, modifier, returnFlat, [element, ...parentElements]);
        flatChildren.push(element.property, modifier, returnFlat, [element, ...parentElements]);
      }
      if (isExpressionStatement(element)) {
        flatChildren.push(element.expression, modifier, returnFlat, [element, ...parentElements]);
      }
      if (isVariableDeclaration(element)) {
        if (element.declarations) {
          element.declarations.forEach((declaration) => {
            flatChildren.push(declaration, modifier, returnFlat, [element, ...parentElements]);
          });
        }
      }
      if (isVariableDeclarator(element)) {
        flatChildren.push(element.id, modifier, returnFlat, [element, ...parentElements]);
        flatChildren.push(element.init, modifier, returnFlat, [element, ...parentElements]);
      }
      if (isArrayExpression(element)) {
        if (element.elements) {
          element.elements.forEach((element) => {
            flatChildren.push(element, modifier, returnFlat, [element, ...parentElements]);
          });
        }
      }
      if (isIfStatement(element)) {
        flatChildren.push(element.test, modifier, returnFlat, [element, ...parentElements]);
        flatChildren.push(element.consequent, modifier, returnFlat, [element, ...parentElements]);
        flatChildren.push(element.alternate, modifier, returnFlat, [element, ...parentElements]);
      }
      if (isBlockStatement(element)) {
        if (element.body) {
          flatChildren.push(...loopAllChildren(element.body, modifier, returnFlat, [element, ...parentElements]));
        }
      }
      if (isReturnStatement(element)) {
        flatChildren.push(...loopAllChildren(element.argument, modifier, returnFlat, [element, ...parentElements]));
      }
      if (isJSXElement(element)) {
        if (element.children) {
          flatChildren.push(...loopAllChildren(element.children, modifier, returnFlat, [element, ...parentElements]));
        }
      }
    }
  });

  return returnFlat ? flatChildren : Array.isArray(node) ? node : [node];
};

module.exports = {
  getFunctionFromProgramBody,
  getFunctionCallFromProgramBody,
  getVariableFromProgramBody,
  getFileImports,
  getImportVariableName,
  getImportVariablesNames,
  getImportImportedName,
  getFormattedImports,
  getFormattedImportByActiveName,
  getFormattedParamByActiveName,
  getMethodOrFunctionName,
  getFolderFromImport,
  loopAllChildren,
};
