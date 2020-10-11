const { getAst, getFileFromImport } = require('./loaders');
const {
  isIterable,
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
  isNewExpression,
  isUnaryExpression,
  isEs6Function,
  isClassicFunction,
  isTryStatement,
  isTemplateLiteral,
  isObjectExpression,
  isCatchClause,
  isThrowStatement,
  isImport,
  isImportTypeImport,
  isRequireTypeImport,
  isMultiVariableImport,
  isLocalPath,
  isStringLiteral,
  isRegExpLiteral
} = require('./questions');
const {
  getFileImports,
  getImportVariablesNames,
  getFormattedImports,
  getFunctionFromProgramBody,
  getFormattedImportByActiveName,
  getMethodOrFunctionName,
  getFolderFromImport
} = require('./readers');


class FileHandler {
  constructor(file, options) {
    this.file = file;
    if (options) this.setOptions(options);
    // this.load();
  }

  async load() {
    this.ast = await getAst(this.file);
    this.loadImports();
  }

  setOptions(options) {
    this.options = options;
  }

  setImports(imports) {
    this.imports = imports;
  }

  loadImports() {
    const imports = getFileImports(this.ast);
    const formattedImports = getFormattedImports(imports);
    this.setImports(formattedImports);
  }

  getAst() {
    return this.ast;
  }

  getFunctionFromProgramBody(functionName) {
    const programBody = this.ast.program.body;

    return getFunctionFromProgramBody(programBody, functionName);
  }

  async getListOfCalledFunctionsInFunction(functionName) {
    const functionAst = this.getFunctionFromProgramBody(functionName);

    return await this.getListOfCalledFunctionsInFunctionAst(functionAst);
  }

  // FORMATTED OUTPUTS

  getFormattedName(element) {
    const formatted = {
      loc: element.loc
    };
    if (element.callee && element.callee.name) {
      formatted.name = element.callee.name;
      formatted.variableName = element.callee.name;
    } else if (element.callee && element.callee.object && element.callee.object.name && element.callee.property && element.callee.property.name) {
      formatted.name = `${element.callee.object.name}.${element.callee.property.name}`;
      formatted.variableName = element.callee.object.name;
    } if (element.argument && element.argument.callee && element.argument.callee.name) {
      formatted.name = element.argument.callee.name;
      formatted.variableName = element.argument.callee.name;
    }

    return formatted;
  }

  async getFormattedThrowStatement(element) {
    const formatted = this.getFormattedName(element);
    if (isThrowStatement(element)) {
      formatted.type = 'ThrowStatement';
    }
    return formatted;
  }

  async getFormattedCalledFunction(element) {
    const formattedFunc = {
      loc: element.loc
    };
    if (isCallExpression(element)) {
      formattedFunc.type = 'CallExpression';
      // e.g. foo();
      if (element.callee && element.callee.name) {
        formattedFunc.name = element.callee.name;
        formattedFunc.variableName = element.callee.name;

        // e.g. logger.debug()
      } else if (element.callee && element.callee.object && element.callee.object.name && element.callee.property && element.callee.property.name) {
        formattedFunc.name = `${element.callee.object.name}.${element.callee.property.name}`;
        formattedFunc.variableName = element.callee.object.name;

        // e.g. (await someAsyncCall())
      } else if (element.callee && isMemberExpression(element.callee)) {
        return await this.getFormattedCalledFunction(element.callee.object);
      } else {
        console.log('kk');
      }
    } else if (isAwaitExpression(element)) {
      return await this.getFormattedCalledFunction(element.argument);
    }

    const fromImport = getFormattedImportByActiveName(formattedFunc.variableName, this.imports);
    // found called functions from import
    if (fromImport) {
      formattedFunc.import = fromImport;
      formattedFunc.originalName = getMethodOrFunctionName(formattedFunc.name, fromImport);

      // following the imports
      if (this.options && this.options.followImports && (this.options.followImportsDeptLevel === undefined || (this.options.followImportsDeptLevel && this.options.followImportsDeptLevel !== 0))) {

        if (fromImport.isLocalImport) {

          const importLocalPath = `${getFolderFromImport(this.file)}/${fromImport.importFrom}`;
          const filePath = await getFileFromImport(importLocalPath);

          if (filePath) {
            const functionFile = new FileHandler(
              filePath,
              {
                ...this.options,
                followImportsDeptLevel: this.options.followImportsDeptLevel ? this.options.followImportsDeptLevel - 1 : this.options.followImportsDeptLevel
              }
            );
            await functionFile.load();

            formattedFunc.import.functions = await functionFile.getListOfCalledFunctionsInFunction(formattedFunc.originalName);
          }
        }
      }
    }

    return formattedFunc;
  }

  // FUNCTIONS

  async getListOfCalledFunctions(elements) {
    let listOfCalledFunctions = [];

    if (!isIterable(elements)) {
      console.log('Non iterable elements');

      return listOfCalledFunctions;
    }
    // elements.forEach((bodyElement, index) => {
    for (const bodyElement of elements) {

      if (isCallExpression(bodyElement)) {
        listOfCalledFunctions.push(await this.getFormattedCalledFunction(bodyElement));

        if (hasArguments(bodyElement)) {
          listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctions(bodyElement.arguments));
        }
      } else if (isAwaitExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInAwaitExpression(bodyElement));
      } else if (isExpressionStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInExpressionStatement(bodyElement));
      } else if (isIfStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInIfStatement(bodyElement));
      } else if (isAssignmentExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInAssignmentExpression(bodyElement));
      } else if (isVariableDeclaration(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInVariableDeclaration(bodyElement));
      } else if (isVariableDeclarator(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInVariableDeclarator(bodyElement));
      } else if (isArrowFunctionExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInArrowFunctionExpression(bodyElement));
      } else if (isBlockStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInBlockStatement(bodyElement));
      } else if (isArrayExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInArrayExpression(bodyElement));
      } else if (isReturnStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInReturnStatement(bodyElement));
      } else if (isTryStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInTryCache(bodyElement));
      } else if (isTemplateLiteral(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInTemplateLiteral(bodyElement));
      } else if (isMemberExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInMemberExpression(bodyElement));
      } else if (isThrowStatement(bodyElement)) {
        // nothing should be in throw
        listOfCalledFunctions.push(await this.getFormattedThrowStatement(bodyElement));
      } else if (isIdentifier(bodyElement)) {
        // nothing to do with identifiers
      } else if (isObjectExpression(bodyElement)) {
        // nothing to do with object expressions
      } else if (isStringLiteral(bodyElement)) {
        // nothing to do with string literal
      } else if (isNewExpression(bodyElement)) {
        // new class e.g. new URL('http://example.com')
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInNewExpression(bodyElement));
      } else if (isRegExpLiteral(bodyElement)) {
        // nothing to do with string literal
      } else if (isUnaryExpression(bodyElement)) {
        // nothing to do with string literal
        listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctionsInUnaryExpression(bodyElement));
      } else {
        console.log('Type not defined', bodyElement.type);
      }
    }

    return listOfCalledFunctions;
  }

  async getListOfCalledFunctionsInMemberExpression(element) {
    if (!isMemberExpression(element)) throw Error('This is not a member expression in getListOfCalledFunctionsInMemberExpression');

    return await this.getListOfCalledFunctions([element.property]);
  }

  async getListOfCalledFunctionsInTemplateLiteral(element) {
    if (!isTemplateLiteral(element)) throw Error('This is not a template literal in getListOfCalledFunctionsInTemplateLiteral');

    return await this.getListOfCalledFunctions(element.expressions);
  }

  async getListOfCalledFunctionsInTryCache(element) {
    if (!isTryStatement(element)) throw Error('This is not a try cache in getListOfCalledFunctionsInTryCache');

    return await this.getListOfCalledFunctions([element.block, element.handler.body]);
  }

  async getListOfCalledFunctionsInTryStatement(element) {
    if (!isTryStatement(element)) throw Error('This is not a try statement in getListOfCalledFunctionsInTryStatement');

    return await this.getListOfCalledFunctions([element.block]);
  }

  async getListOfCalledFunctionsInCatchClause(element) {
    if (!isCatchClause(element)) throw Error('This is not a catch clause in getListOfCalledFunctionsInCatchClause');

    return await this.getListOfCalledFunctions([element.body]);
  }

  async getListOfCalledFunctionsInReturnStatement(element) {
    if (!isReturnStatement(element)) throw Error('This is not a return statement in getListOfCalledFunctionsInReturnStatement');
    let callee = [];
    if (element.callee) {
      callee = [element.callee];
    }
    return await this.getListOfCalledFunctions(callee);
  }

  async getListOfCalledFunctionsInArrayExpression(element) {
    if (!isArrayExpression(element)) throw Error('This is not a array expression in getListOfCalledFunctionsInArrayExpression');

    return await this.getListOfCalledFunctions(element.elements);
  }

  async getListOfCalledFunctionsInArrowFunctionExpression(element) {
    if (!isArrowFunctionExpression(element)) throw Error('This is not a arrow function expression in getListOfCalledFunctionsInArrowFunctionExpression');

    return await this.getListOfCalledFunctions([element.body]);
  }

  async getListOfCalledFunctionsInAwaitExpression(element) {
    if (!isAwaitExpression(element)) throw Error('This is not a await expression in getListOfCalledFunctionsInAwaitExpression');

    return await this.getListOfCalledFunctions([element.argument]);
  }

  async getListOfCalledFunctionsInVariableDeclarator(element) {
    if (!isVariableDeclarator(element)) throw Error('This is not a variable declarator in getListOfCalledFunctionsInVariableDeclarator');
    let childElements = [];
    if (element.init && !isIdentifier(element.init)) {
      childElements = [element.init];
    } else if (element.declarations) {
      childElements = element.declarations;
    }
    return await this.getListOfCalledFunctions(childElements);
  }

  async getListOfCalledFunctionsInVariableDeclaration(element) {
    if (!isVariableDeclaration(element)) throw Error('This is not a variable declaration in getListOfCalledFunctionsInVariableDeclaration');

    return await this.getListOfCalledFunctions(element.declarations);
  }

  async getListOfCalledFunctionsInAssignmentExpression(element) {
    if (!isAssignmentExpression(element)) throw Error('This is not a assignment expression in getListOfCalledFunctionsInAssignmentExpression');

    return await this.getListOfCalledFunctions([element.right]);
  }

  async getListOfCalledFunctionsInExpressionStatement(element) {
    if (!isExpressionStatement(element)) throw Error('This is not a expression statement in getListOfCalledFunctionsInExpressionStatement');

    return await this.getListOfCalledFunctions([element.expression]);
  }

  async getListOfCalledFunctionsInIfStatement(element) {
    if (!isIfStatement(element)) throw Error('This is not a if statement in getListOfCalledFunctionsInIfStatement');

    return await this.getListOfCalledFunctions(element.consequent.body);
  }

  async getListOfCalledFunctionsInBlockStatement(element) {
    if (!isBlockStatement(element)) throw Error('This is not a block statement in getListOfCalledFunctionsInBlockStatement');

    return await this.getListOfCalledFunctions(element.body);
  }

  async getListOfCalledFunctionsInNewExpression(element) {
    if (!isNewExpression(element)) throw Error('This is not a new expression in getListOfCalledFunctionsInNewExpression');

    return await this.getListOfCalledFunctions(element.arguments);
  }

  async getListOfCalledFunctionsInUnaryExpression(element) {
    if (!isUnaryExpression(element)) throw Error('This is not a unary expression in getListOfCalledFunctionsInUnaryExpression');

    return await this.getListOfCalledFunctions([element.argument]);
  }

  async getListOfCalledFunctionsInFunctionAst(functionElement) {
    let body;
    if (isEs6Function(functionElement)) {
      body = functionElement.declarations[0].init.body;
    } else if (isClassicFunction(functionElement)) {
      body = functionElement.body;
    }

    return await this.getListOfCalledFunctionsInBlockStatement(body);
  }

}

module.exports = FileHandler;

