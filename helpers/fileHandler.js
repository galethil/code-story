const {
  StringLiteral,
  MemberExpression,
  BooleanLiteral,
  NumericLiteral,
  TemplateLiteral,
  Identifier,
  CallExpression,
} = require("./constants");
const { getAst, getFileFromImport } = require("./loaders");
const {
  isFile,
  isProgram,
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
  isLogicalExpression,
  isConditionalExpression,
  isBinaryExpression,
  isNumericLiteral,
  isBooleanLiteral,
  isNullLiteral,
  isEs6Function,
  isClassicFunction,
  isTryStatement,
  isTemplateLiteral,
  isObjectExpression,
  isProperty,
  isCatchClause,
  isThrowStatement,
  isImportDeclaration,
  isExportDefaultDeclaration,
  isExportNamedDeclaration,
  isOptionalMemberExpression,
  isImport,
  isImportTypeImport,
  isRequireTypeImport,
  isMultiVariableImport,
  isLocalPath,
  isStringLiteral,
  isRegExpLiteral,
  isSpreadElement,
  isObjectProperty,
  isForOfStatement,
  isJSXElement,
  isJSXText,
  isJSXExpressionContainer,
  isTaggedTemplateExpression,
  isJSXAttribute,
  isJSXSpreadAttribute,
} = require("./questions");
const {
  getFileImports,
  getImportVariablesNames,
  getFormattedImports,
  getFunctionFromProgramBody,
  getFunctionCallFromProgramBody,
  getVariableFromProgramBody,
  getFormattedImportByActiveName,
  getFormattedParamByActiveName,
  getMethodOrFunctionName,
  getFolderFromImport,
} = require("./readers");

JSON.safeStringify = (obj, indent = 2) => {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
};

class FileHandler {
  constructor(file, options) {
    this.file = file;
    this.debug = false;
    if (options) this.setOptions(options);
    // this.load();
  }

  async load() {
    this.ast = await getAst(this.file, undefined, { babelPlugins: this.options.babelPlugins || []});
    this.loadImports();
  }

  setOptions(options) {
    this.options = options;
    if ("params" in options) {
      this.setParams(options.params);
    }
    if (options?.debug === true) {
      this.debug = true;
    }
  }

  setImports(imports) {
    this.imports = imports;
  }

  loadImports() {
    const imports = getFileImports(this.ast);
    const formattedImports = getFormattedImports(imports);
    this.setImports(formattedImports);
  }

  setParams(params) {
    this.params = params;
  }

  getAst() {
    return this.ast;
  }

  getFunctionFromProgramBody(functionName, args) {
    let programBody;
    if (isProgram(this.ast)) {
      programBody = this.ast.body;
    } else {
      programBody = this.ast.program.body;
    }

    return getFunctionFromProgramBody(programBody, functionName, args);
  }

  getFunctionCallFromProgramBody(functionName) {
    let programBody;
    if (isProgram(this.ast)) {
      programBody = this.ast.body;
    } else {
      programBody = this.ast.program.body;
    }

    return getFunctionCallFromProgramBody(programBody, functionName);
  }

  getVariableFromProgramBody(variableName) {
    const programBody = this.ast.program.body;

    return getVariableFromProgramBody(programBody, variableName);
  }

  async getListOfCalledFunctionsInFunction(functionName, params) {
    const functionAst = this.getFunctionFromProgramBody(functionName, params);

    let calledFunctions = await this.getListOfCalledFunctionsInFunctionAst(
      functionAst
    );
    if (calledFunctions.length === 0) {
      const functionCallAst = this.getFunctionCallFromProgramBody(
        functionName,
        params
      );

      calledFunctions = await this.getListOfCalledFunctionsInAst(
        functionCallAst?.expression?.arguments
      );
    }
    const jsDoc =
      functionAst && functionAst.jsDoc ? functionAst.jsDoc : undefined;
    return {
      elements: calledFunctions,
      jsDoc,
    };
  }

  async getListOfSpecificFunctionsCallsInFile(functionName, test) {
    const calledFunctions = await this.getListOfCalledFunctionsInAst(this.ast);

    return calledFunctions;
  }

  async getListOfFunctionsInSpecificFunctionsDefinitionsInFile(
    functionName,
    test
  ) {
    const foundFunctions = this.getListOfFunctionDefinitions(this.ast);

    const specificFunction = foundFunctions.find((bodyElement) => {
      if (
        isVariableDeclaration(bodyElement) &&
        bodyElement.declarations[0].id.name === functionName
      ) {
        return true;
      }

      return false;
    });

    const calledFunctions = await this.getListOfCalledFunctionsInAst(
      specificFunction
    );

    return calledFunctions;
  }

  async getDetailsOfVariable(variableName) {
    const variableAst = this.getVariableFromProgramBody(variableName);
    const variable = variableAst; // await this.describeVariableFromAst(variableAst);
    return variable;
  }

  async getDetailsAboutAll() {
    return this.getAst();
  }

  // FORMATTED OUTPUTS

  getFormattedName(element) {
    const formatted = {
      loc: element.loc,
      file: this.file,
    };
    if (element.callee && element.callee.name) {
      formatted.name = element.callee.name;
      formatted.variableName = element.callee.name;
    } else if (
      element.callee &&
      element.callee.object &&
      element.callee.object.name &&
      element.callee.property &&
      element.callee.property.name
    ) {
      formatted.name = `${element.callee.object.name}.${element.callee.property.name}`;
      formatted.variableName = element.callee.object.name;
    }
    if (
      element.argument &&
      element.argument.callee &&
      element.argument.callee.name
    ) {
      formatted.name = element.argument.callee.name;
      formatted.variableName = element.argument.callee.name;
    }

    return formatted;
  }

  async getFormattedArguments(elements) {
    const formattedArguments = [];
    for (const element of elements) {
      const formattedArgument = await this.getFormattedArgument(element);
      formattedArguments.push(formattedArgument);
    }
    return formattedArguments;
  }

  async getFormattedArgument(element) {
    const { type, value, object, property, name } = element;
    switch (type) {
      case StringLiteral:
        return {
          type,
          value,
        };
      case MemberExpression:
        if (
          object &&
          property &&
          object.type === Identifier &&
          property.type === Identifier
        ) {
          return {
            type,
            name: `${object.name}.${property.name}`,
            value: `${object.name}.${property.name}`,
            object: {
              name: object.name,
            },
            property: {
              name: property.name,
            },
          };
        } else if (object && property) {
          const objectExpr = await this.getFormattedArgument(object);
          const propertyExpr = await this.getFormattedArgument(property);
          return {
            type,
            object: objectExpr,
            property: propertyExpr,
          };
        }
        break;
      case BooleanLiteral:
        return {
          type,
          value,
        };
      case NumericLiteral:
        return {
          type,
          value,
        };
      case TemplateLiteral:
        return {
          type,
          value,
        };
      case CallExpression:
        const args = [];
        for (const arg of element.arguments) {
          args.push(await this.getFormattedArgument(arg));
        }

        return {
          type,
          name: element.callee.name,
          arguments: args,
        };
      case Identifier:
        const fromImport = getFormattedImportByActiveName(name, this.imports);
        const identifier = {
          type,
          name,
        };
        // found variable is from import

        if (fromImport) {
          identifier.import = fromImport;
          identifier.originalName = getMethodOrFunctionName(name, fromImport);
          identifier.name = identifier.originalName;

          // following the imports
          if (
            this.options &&
            this.options.followImports &&
            (this.options.followImportsDeptLevel === undefined ||
              (this.options.followImportsDeptLevel &&
                this.options.followImportsDeptLevel !== 0))
          ) {
            if (fromImport.isLocalImport) {
              const importLocalPath = `${getFolderFromImport(this.file)}/${
                fromImport.importFrom
              }`;
              const filePath = await getFileFromImport(importLocalPath);

              if (filePath) {
                const functionFile = new FileHandler(filePath, {
                  ...this.options,
                  followImportsDeptLevel: this.options.followImportsDeptLevel
                    ? this.options.followImportsDeptLevel - 1
                    : this.options.followImportsDeptLevel,
                });
                await functionFile.load();

                if (this.options.type === "usageStory") {
                  identifier.import.functions =
                    await functionFile.getListOfSpecificFunctionsCallsInFile(
                      identifier.originalName
                    );
                } else {
                  identifier.import.functions =
                    await functionFile.getListOfFunctionsInSpecificFunctionsDefinitionsInFile(
                      identifier.originalName,
                      "test"
                    );
                }
              }
            }
          }
        }

        return identifier;
      default:
        return {
          type,
        };
    }
  }

  async getFormattedThrowStatement(element) {
    const formatted = this.getFormattedName(element);
    if (isThrowStatement(element)) {
      formatted.type = "ThrowStatement";

      if (element.argument && element.argument.arguments) {
        formatted.arguments = await this.getFormattedArguments(
          element.argument.arguments
        );
      }
    }
    return formatted;
  }

  async getFormattedCalledFunction(element) {
    const getChainedName = (chainedElement, name = "") => {
      if (chainedElement.callee?.object?.callee) {
        name = getChainedName(chainedElement.callee.object);
      }
      if (chainedElement.callee?.property?.name) {
        return `${name}.${chainedElement.callee.property.name}`;
      }
      return name;
    };
    const formattedFunc = {
      loc: element.loc,
      file: this.file,
    };

    if (isCallExpression(element)) {
      formattedFunc.type = "CallExpression";
      // e.g. foo();
      if (element.callee && element.callee.name) {
        formattedFunc.name = element.callee.name;
        formattedFunc.variableName = element.callee.name;

        // e.g. foo()()
      } else if (element.callee && element.callee.callee && element.callee.callee.name) {
        formattedFunc.name = element.callee.callee.name;
        formattedFunc.variableName = element.callee.callee.name;

        // e.g. logger.debug()
      } else if (
        element.callee &&
        element.callee.object &&
        element.callee.object.name &&
        element.callee.property &&
        element.callee.property.name
      ) {
        formattedFunc.name = `${element.callee.object.name}.${element.callee.property.name}`;
        formattedFunc.variableName = element.callee.object.name;
        formattedFunc.propertyName = element.callee.property.name;
      } else if (element.callee && isMemberExpression(element.callee)) {
        return await this.getFormattedCalledFunction(element.callee.object);
      } else {
        console.log("kk", element);
      }

      // e.g. (await someAsyncCall())
    } else if (isAwaitExpression(element)) {
      return await this.getFormattedCalledFunction(element.argument);
    }

    const fromImport = getFormattedImportByActiveName(
      formattedFunc.variableName,
      this.imports
    );

    // found called functions from import
    if (fromImport) {
      formattedFunc.import = fromImport;
      formattedFunc.originalName = getMethodOrFunctionName(
        formattedFunc.name,
        fromImport
      );

      // following the imports
      if (
        this.options &&
        this.options.followImports &&
        (this.options.followImportsDeptLevel === undefined ||
          (this.options.followImportsDeptLevel &&
            this.options.followImportsDeptLevel !== 0))
      ) {
        if (fromImport.isLocalImport) {
          const importLocalPath = `${getFolderFromImport(this.file)}/${
            fromImport.importFrom
          }`;
          const filePath = await getFileFromImport(importLocalPath);

          if (filePath) {
            const functionFile = new FileHandler(filePath, {
              ...this.options,
              followImportsDeptLevel: this.options.followImportsDeptLevel
                ? this.options.followImportsDeptLevel - 1
                : this.options.followImportsDeptLevel,
            });
            await functionFile.load();

            formattedFunc.import.functions =
              await functionFile.getListOfCalledFunctionsInFunction(
                formattedFunc.originalName
              );
          }
        }
      }
    }

    const fromParams = getFormattedParamByActiveName(
      formattedFunc.variableName,
      this.params
    );
    // console.log('fromParams ', fromParams, formattedFunc, this.params);

    if (fromParams) {
      formattedFunc.import = fromParams;

      const filePath = await getFileFromImport(fromParams.importFrom);

      const paramFile = new FileHandler(filePath, {
        ...this.options,
        followImportsDeptLevel: this.options.followImportsDeptLevel
          ? this.options.followImportsDeptLevel - 1
          : this.options.followImportsDeptLevel,
      });
      await paramFile.load();

      formattedFunc.import.functions =
        await paramFile.getListOfCalledFunctionsInFunction(
          formattedFunc.propertyName
        );
    }

    if (element.arguments) {
      formattedFunc.arguments = await this.getFormattedArguments(
        element.arguments
      );
      // console.log('element.arguments', formattedFunc.arguments)
    }

    return formattedFunc;
  }

  // FUNCTIONS

  getListOfFunctionDefinitions(elements) {
    let listOfFunctionDefinitions = [];
    if (isFile(elements)) {
      return this.getListOfFunctionDefinitions(elements.program);
    } else if (isProgram(elements)) {
      return this.getListOfFunctionDefinitions(elements.body);
    } else if (!isIterable(elements)) {
      if (this.debug) console.log("Non iterable elements");

      return listOfFunctionDefinitions;
    }

    for (const bodyElement of elements) {
      // console.log(bodyElement, this.file);
      if (isVariableDeclaration(bodyElement)) {
        if (isArrowFunctionExpression(bodyElement.declarations[0].init)) {
          listOfFunctionDefinitions.push(bodyElement);
        }
      } else if (isClassicFunction(bodyElement)) {
        listOfFunctionDefinitions.push(bodyElement);
      }
    }

    return listOfFunctionDefinitions;
  }

  // getListOfFunctionDefinitions

  async getListOfCalledFunctions(elements) {
    let listOfCalledFunctions = [];

    if (isFile(elements)) {
      return this.getListOfCalledFunctions(elements.program);
    } else if (isProgram(elements)) {
      return this.getListOfCalledFunctions(elements.body);
    } else if (!isIterable(elements)) {
      if (this.debug) console.log("Non iterable elements");

      return this.getListOfCalledFunctions([elements]);
    }
    // elements.forEach((bodyElement, index) => {
    for (const bodyElement of elements) {
      if (this.debug)
        console.log(
          `${this.file}:${bodyElement.loc?.start?.line}:${bodyElement.loc?.start?.column} ${bodyElement.type}`
        );

      // match custom condition
      if (this.options.customElementCondition) {
        if (this.options.customElementCondition(bodyElement)) {
          listOfCalledFunctions.push({file: this.file, ast: bodyElement, imports: this.imports});
        }
      }
      if (isCallExpression(bodyElement)) {
        // e.g. users.filter().map().format()
        if (
          bodyElement.callee &&
          bodyElement.callee.object &&
          bodyElement.callee.object.callee &&
          bodyElement.callee.property &&
          bodyElement.callee.property.name
        ) {
          // console.log('bodyElement.callee.object.callee')
          // const chainedName = getChainedName(element);
          // formattedFunc.name = chainedName;
          // formattedFunc.variableName = element.callee.object.name;
          // listOfCalledFunctions = listOfCalledFunctions.concat(await this.getFormattedCalledFunction(bodyElement));
        }

        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getFormattedCalledFunction(bodyElement)
        );

        if (hasArguments(bodyElement)) {
          listOfCalledFunctions = listOfCalledFunctions.concat(
            await this.getListOfCalledFunctions(bodyElement.arguments)
          );
        }
      } else if (isAwaitExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInAwaitExpression(bodyElement)
        );
      } else if (isExpressionStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInExpressionStatement(bodyElement)
        );
      } else if (isIfStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInIfStatement(bodyElement)
        );
      } else if (isAssignmentExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInAssignmentExpression(bodyElement)
        );
      } else if (isVariableDeclaration(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInVariableDeclaration(bodyElement)
        );
      } else if (isVariableDeclarator(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInVariableDeclarator(bodyElement)
        );
      } else if (isArrowFunctionExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInArrowFunctionExpression(
            bodyElement
          )
        );
      } else if (isBlockStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInBlockStatement(bodyElement)
        );
      } else if (isArrayExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInArrayExpression(bodyElement)
        );
      } else if (isReturnStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInReturnStatement(bodyElement)
        );
      } else if (isTryStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInTryCache(bodyElement)
        );
      } else if (isTemplateLiteral(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInTemplateLiteral(bodyElement)
        );
      } else if (isMemberExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInMemberExpression(bodyElement)
        );
      } else if (isThrowStatement(bodyElement)) {
        // nothing should be in throw
        listOfCalledFunctions.push(
          await this.getFormattedThrowStatement(bodyElement)
        );
      } else if (isIdentifier(bodyElement)) {
        // nothing to do with identifiers
      } else if (isObjectExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInObjectExpression(bodyElement)
        );
      } else if (isProperty(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInProperty(bodyElement)
        );
      } else if (isStringLiteral(bodyElement)) {
        // nothing to do with string literal
      } else if (isNewExpression(bodyElement)) {
        // new class e.g. new URL('http://example.com')
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInNewExpression(bodyElement)
        );
      } else if (isRegExpLiteral(bodyElement)) {
        // nothing to do with string literal
      } else if (isUnaryExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInUnaryExpression(bodyElement)
        );
      } else if (isLogicalExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInLogicalExpression(bodyElement)
        );
      } else if (isConditionalExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInConditionalExpression(
            bodyElement
          )
        );
      } else if (isBinaryExpression(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInBinaryExpression(bodyElement)
        );
      } else if (isNumericLiteral(bodyElement)) {
        // nothing to do with numeric literal
      } else if (isBooleanLiteral(bodyElement)) {
        // nothing to do with boolean literal
      } else if (isNullLiteral(bodyElement)) {
        // nothing to do with null literal
      } else if (isSpreadElement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInSpreadElement(bodyElement)
        );
      } else if (isObjectProperty(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInObjectProperty(bodyElement)
        );
      } else if (Array.isArray(bodyElement)) {
        // listOfCalledFunctions = listOfCalledFunctions.concat(await this.getListOfCalledFunctions(bodyElement));
      } else if (isImportDeclaration(bodyElement)) {
        // nothing to do with import declaration
      } else if (isExportDefaultDeclaration(bodyElement)) {
        // nothing to do with export default declaration
      } else if (isExportNamedDeclaration(bodyElement)) {
        // nothing to do with export default declaration
      } else if (isOptionalMemberExpression(bodyElement)) {
        // nothing to do with
      } else if (isForOfStatement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInForOfStatement(bodyElement)
        );
      } else if (isJSXElement(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInJSXElement(bodyElement)
        );
      } else if (isJSXText(bodyElement)) {
        // nothing to do with jsx text
      } else if (isJSXExpressionContainer(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInJSXExpressionContainer(bodyElement)
        );
      } else if (isTaggedTemplateExpression(bodyElement)) {
        // nothing to do with tagged template expression
      } else if (isJSXAttribute(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInJSXAttribute(bodyElement)
        );
      } else if (isJSXSpreadAttribute(bodyElement)) {
        listOfCalledFunctions = listOfCalledFunctions.concat(
          await this.getListOfCalledFunctionsInJSXSpreadAttribute(bodyElement)
        );
      } else if (bodyElement === undefined) {
        // ignore undefined
      } else {
        console.log(
          "Type not defined",
          bodyElement?.type,
          JSON.safeStringify(bodyElement)
        );
        if (this.debug) console.log(bodyElement);
      }
    }

    return listOfCalledFunctions;
  }

  async getListOfCalledFunctionsInMemberExpression(element) {
    if (!isMemberExpression(element))
      throw Error(
        "This is not a member expression in getListOfCalledFunctionsInMemberExpression. It is " +
          element.type
      );

    return await this.getListOfCalledFunctions([element.property]);
  }

  async getListOfCalledFunctionsInSpreadElement(element) {
    if (!isSpreadElement(element))
      throw Error(
        "This is not a spread element in getListOfCalledFunctionsInSpreadElement"
      );

    return await this.getListOfCalledFunctions([element.argument]);
  }

  async getListOfCalledFunctionsInObjectExpression(element) {
    if (!isObjectExpression(element))
      throw Error(
        "This is not a object expression in getListOfCalledFunctionsInObjectExpression"
      );

    return await this.getListOfCalledFunctions(element.properties);
  }

  async getListOfCalledFunctionsInObjectProperty(element) {
    if (!isObjectProperty(element)) {
      if (this.debug) console.log(element);
      throw Error(
        "This is not a object property in getListOfCalledFunctionsInObjectProperty"
      );
    }

    return await this.getListOfCalledFunctions(element.value);
  }

  async getListOfCalledFunctionsInProperty(element) {
    if (!isProperty(element))
      throw Error(
        "This is not a property in getListOfCalledFunctionsInProperty"
      );

    return await this.getListOfCalledFunctions([element.value]);
  }

  async getListOfCalledFunctionsInTemplateLiteral(element) {
    if (!isTemplateLiteral(element))
      throw Error(
        "This is not a template literal in getListOfCalledFunctionsInTemplateLiteral"
      );

    return await this.getListOfCalledFunctions(element.expressions);
  }

  async getListOfCalledFunctionsInForOfStatement(element) {
    if (!isForOfStatement(element))
      throw Error(
        "This is not a for of statement in getListOfCalledFunctionsInForOfStatement"
      );

    const listOFBlocks = [];
    if (element.body) listOFBlocks.push(element.body);
    if (element.left) listOFBlocks.push(element.left);
    if (element.right) listOFBlocks.push(element.right);

    return await this.getListOfCalledFunctions(listOFBlocks);
  }

  async getListOfCalledFunctionsInJSXElement(element) {
    if (!isJSXElement(element))
      throw Error(
        "This is not a JSX element in getListOfCalledFunctionsInJSXElement"
      );

    const listOFBlocks = [];
    if (element?.openingElement?.attributes) {
      listOFBlocks.push(...element.openingElement.attributes);
    }
    if (element.children) listOFBlocks.push(...element.children);

    return await this.getListOfCalledFunctions(listOFBlocks);
  }

  async getListOfCalledFunctionsInJSXExpressionContainer(element) {
    if (!isJSXExpressionContainer(element))
      throw Error(
        "This is not a JSX expression container in getListOfCalledFunctionsInJSXExpressionContainer"
      );

    return await this.getListOfCalledFunctions([element.expression]);
  }

  async getListOfCalledFunctionsInJSXAttribute(element) {
    if (!isJSXAttribute(element))
      throw Error(
        "This is not a JSX attribute in getListOfCalledFunctionsInJSXAttribute"
      );

    return await this.getListOfCalledFunctions([element.value]);
  }

  async getListOfCalledFunctionsInJSXSpreadAttribute(element) {
    if (!isJSXSpreadAttribute(element))
      throw Error(
        "This is not a JSX spread attribute in getListOfCalledFunctionsInJSXSpreadAttribute"
      );

    return await this.getListOfCalledFunctions([element.argument]);
  }

  async getListOfCalledFunctionsInTryCache(element) {
    if (!isTryStatement(element))
      throw Error(
        "This is not a try cache in getListOfCalledFunctionsInTryCache"
      );
    const listOFBlocks = [];
    if (element.block) listOFBlocks.push(listOFBlocks);
    if (element.handler?.body) listOFBlocks.push(element.handler.body);
    if (element.finalizer?.body) listOFBlocks.push(element.finalizer.body);

    return await this.getListOfCalledFunctions(listOFBlocks);
  }

  async getListOfCalledFunctionsInTryStatement(element) {
    if (!isTryStatement(element))
      throw Error(
        "This is not a try statement in getListOfCalledFunctionsInTryStatement"
      );

    return await this.getListOfCalledFunctions([element.block]);
  }

  async getListOfCalledFunctionsInCatchClause(element) {
    if (!isCatchClause(element))
      throw Error(
        "This is not a catch clause in getListOfCalledFunctionsInCatchClause"
      );

    return await this.getListOfCalledFunctions([element.body]);
  }

  async getListOfCalledFunctionsInReturnStatement(element) {
    if (!isReturnStatement(element))
      throw Error(
        "This is not a return statement in getListOfCalledFunctionsInReturnStatement"
      );
    let callee = [];
    if (element.callee) {
      callee = [element.callee];
    } else if (element.argument) {
      callee = [element.argument];
    }

    return await this.getListOfCalledFunctions(callee);
  }

  async getListOfCalledFunctionsInArrayExpression(element) {
    if (!isArrayExpression(element))
      throw Error(
        "This is not a array expression in getListOfCalledFunctionsInArrayExpression"
      );

    return await this.getListOfCalledFunctions(element.elements);
  }

  async getListOfCalledFunctionsInArrowFunctionExpression(element) {
    if (!isArrowFunctionExpression(element))
      throw Error(
        "This is not a arrow function expression in getListOfCalledFunctionsInArrowFunctionExpression"
      );

    return await this.getListOfCalledFunctions([element.body]);
  }

  async getListOfCalledFunctionsInAwaitExpression(element) {
    if (!isAwaitExpression(element))
      throw Error(
        "This is not a await expression in getListOfCalledFunctionsInAwaitExpression"
      );

    return await this.getListOfCalledFunctions([element.argument]);
  }

  async getListOfCalledFunctionsInVariableDeclarator(element) {
    if (!isVariableDeclarator(element))
      throw Error(
        "This is not a variable declarator in getListOfCalledFunctionsInVariableDeclarator"
      );
    let childElements = [];
    if (element.init && !isIdentifier(element.init)) {
      childElements = [element.init];
    } else if (element.declarations) {
      childElements = element.declarations;
    }
    return await this.getListOfCalledFunctions(childElements);
  }

  async getListOfCalledFunctionsInVariableDeclaration(element) {
    if (!isVariableDeclaration(element))
      throw Error(
        "This is not a variable declaration in getListOfCalledFunctionsInVariableDeclaration"
      );

    return await this.getListOfCalledFunctions(element.declarations);
  }

  async getListOfCalledFunctionsInAssignmentExpression(element) {
    if (!isAssignmentExpression(element))
      throw Error(
        "This is not a assignment expression in getListOfCalledFunctionsInAssignmentExpression"
      );

    return await this.getListOfCalledFunctions([element.right]);
  }

  async getListOfCalledFunctionsInExpressionStatement(element) {
    if (!isExpressionStatement(element))
      throw Error(
        "This is not a expression statement in getListOfCalledFunctionsInExpressionStatement"
      );

    return await this.getListOfCalledFunctions([element.expression]);
  }

  async getListOfCalledFunctionsInIfStatement(element) {
    if (!isIfStatement(element))
      throw Error(
        "This is not a if statement in getListOfCalledFunctionsInIfStatement"
      );

    return await this.getListOfCalledFunctions(element.consequent.body);
  }

  async getListOfCalledFunctionsInBlockStatement(element) {
    if (!isBlockStatement(element))
      throw Error(
        "This is not a block statement in getListOfCalledFunctionsInBlockStatement"
      );

    return await this.getListOfCalledFunctions(element.body);
  }

  async getListOfCalledFunctionsInNewExpression(element) {
    if (!isNewExpression(element))
      throw Error(
        "This is not a new expression in getListOfCalledFunctionsInNewExpression"
      );

    return await this.getListOfCalledFunctions(element.arguments);
  }

  async getListOfCalledFunctionsInUnaryExpression(element) {
    if (!isUnaryExpression(element))
      throw Error(
        "This is not a unary expression in getListOfCalledFunctionsInUnaryExpression"
      );

    return await this.getListOfCalledFunctions([element.argument]);
  }

  async getListOfCalledFunctionsInLogicalExpression(element) {
    if (!isLogicalExpression(element))
      throw Error(
        "This is not a logical expression in getListOfCalledFunctionsInLogicalExpression"
      );

    let listOfCalledFunctions = await this.getListOfCalledFunctions([
      element.left,
    ]);
    listOfCalledFunctions = listOfCalledFunctions.concat(
      await this.getListOfCalledFunctions([element.right])
    );

    return listOfCalledFunctions;
  }

  async getListOfCalledFunctionsInConditionalExpression(element) {
    if (!isConditionalExpression(element))
      throw Error(
        "This is not a conditional expression in getListOfCalledFunctionsInConditionalExpression"
      );

    let listOfCalledFunctions = await this.getListOfCalledFunctions([
      element.test,
    ]);
    listOfCalledFunctions = listOfCalledFunctions.concat(
      await this.getListOfCalledFunctions([element.consequent])
    );
    listOfCalledFunctions = listOfCalledFunctions.concat(
      await this.getListOfCalledFunctions([element.alternate])
    );

    return listOfCalledFunctions;
  }

  async getListOfCalledFunctionsInBinaryExpression(element) {
    if (!isBinaryExpression(element))
      throw Error(
        "This is not a binary expression in getListOfCalledFunctionsInBinaryExpression"
      );

    let listOfCalledFunctions = await this.getListOfCalledFunctions([
      element.left,
    ]);
    listOfCalledFunctions = listOfCalledFunctions.concat(
      await this.getListOfCalledFunctions([element.right])
    );

    return listOfCalledFunctions;
  }

  async getListOfCalledFunctionsInFunctionAst(functionElement) {
    if (!functionElement) return [];
    let body;
    if (isEs6Function(functionElement)) {
      body = functionElement.declarations[0].init.body;
    } else if (isClassicFunction(functionElement)) {
      body = functionElement.body;
    }
    // adding jsDoc
    if (functionElement && functionElement.jsDoc)
      body.jsDoc = functionElement.jsDoc;

    if (isBlockStatement(body)) {
      return await this.getListOfCalledFunctionsInBlockStatement(body);
    } else if (isArrowFunctionExpression(body)) {
      return await this.getListOfCalledFunctionsInArrowFunctionExpression(body);
    } else {
      console.error("Enexpected type in function ast", body);
    }

    //return await this.getListOfCalledFunctionsInBlockStatement(body);
  }

  async getListOfCalledFunctionsInAst(ast) {
    if (!ast) return [];

    return await this.getListOfCalledFunctions(ast);
  }
}

module.exports = FileHandler;
