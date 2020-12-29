const {
  FileType,
  ProgramType,
  CallExpression,
  AwaitExpression,
  Identifier,
  ImportNamespaceSpecifier,
  ExpressionStatement,
  AssignmentExpression,
  BlockStatement,
  VariableDeclaration,
  VariableDeclarator,
  ArrayExpression,
  ObjectExpression,
  StringLiteral,
  RegExpLiteral,
  TemplateLiteral,
  ArrowFunctionExpression,
  IfStatement,
  ReturnStatement,
  MemberExpression,
  TryStatement,
  CatchClause,
  ThrowStatement,
  NewExpression,
  UnaryExpression,
  LogicalExpression,
  ConditionalExpression,
  BinaryExpression,
  NumericLiteral,
  CommentBlock
} = require('./constants');
// COMMON

const isIterable = (element) => {
  if (element == null) return false;

  return typeof element[Symbol.iterator] === 'function';
}

// GENERAL

const isFile = (element) => (element && element.type === FileType);
const isProgram = (element) => (element && element.type === ProgramType);
const isCallExpression = (element) => (element && element.type === CallExpression);
const isAwaitExpression = (element) => (element && element.type === AwaitExpression);
const isIdentifier = (element) => (element && element.type === Identifier);
const isImportNamespaceSpecifier = (element) => (element && element.type === ImportNamespaceSpecifier);
const isExpressionStatement = (element) => (element && element.type === ExpressionStatement);
const isAssignmentExpression = (element) => (element && element.type === AssignmentExpression);
const isBlockStatement = (element) => (element && element.type === BlockStatement);
// const x = 1;
const isVariableDeclaration = (element) => (element && element.type === VariableDeclaration);
const isVariableDeclarator = (element) => (element && element.type === VariableDeclarator);
const isArrayExpression = (element) => (element && element.type === ArrayExpression);
const isObjectExpression = (element) => (element && element.type === ObjectExpression);
const isStringLiteral = (element) => (element && element.type === StringLiteral);
const isRegExpLiteral = (element) => (element && element.type === RegExpLiteral);
const isTemplateLiteral = (element) => (element && element.type === TemplateLiteral);
const isArrowFunctionExpression = (element) => (element && element.type === ArrowFunctionExpression);
const isIfStatement = (element) => (element && element.type === IfStatement);
const isReturnStatement = (element) => (element && element.type === ReturnStatement);
const isMemberExpression = (element) => (element && element.type === MemberExpression);
const isTryStatement = (element) => (element && element.type === TryStatement);
const isCatchClause = (element) => (element && element.type === CatchClause);
// throw Error('my error')
const isThrowStatement = (element) => (element && element.type === ThrowStatement);
const isNewExpression = (element) => (element && element.type === NewExpression);
const isUnaryExpression = (element) => (element && element.type === UnaryExpression);
// left && right
const isLogicalExpression = (element) => (element && element.type === LogicalExpression);
// test ? consequent : alternate
const isConditionalExpression = (element) => (element && element.type === ConditionalExpression);
// left === right
const isBinaryExpression = (element) => (element && element.type === BinaryExpression);
// 112
const isNumericLiteral = (element) => (element && element.type === NumericLiteral);
// /* comment */
const isCommentBlock = (element) => (element && element.type === CommentBlock);

const hasLeadingComments = (element) => (element && typeof element.leadingComments !== 'undefined');
const hasTrailingComments = (element) => (element && typeof element.trailingComments !== 'undefined');
const isJsDoc = (elements) => {
  const potentialJsDocs = Array.isArray(elements) ? elements : [elements];
  const jsDocComments = potentialJsDocs.find(element => {
    return isCommentBlock(element) && element.value.includes('*\n') && element.value.match(/\@\w+/gmi);
  });
  return (jsDocComments);
};

// EXPORTS

const isExport = (element) => (
  element.type === 'ExpressionStatement' &&
  element.expression.type === 'AssignmentExpression' &&
  element.expression.operator === '='
);

// FUNCTIONS

const hasArguments = (element) => (element.arguments && element.arguments.length > 0);

const isEs6Function = (element) => (
  element &&
  element.type === 'VariableDeclaration' &&
  element.declarations[0].type === 'VariableDeclarator' &&
  element.declarations[0].init.type === 'ArrowFunctionExpression'
);

const isExportNamedDeclaration = (element) => (
  element &&
  element.type === 'ExportNamedDeclaration'
);

const isNamedEs6Function = (element, functionName) => (
  element &&
  isEs6Function(element) &&
  element.declarations[0].id.name === functionName
);

const isNamedExportNamedDeclaration = (element, functionName) => (
  element &&
  isExportNamedDeclaration(element) &&
  element.declaration.id.name === functionName
);

// const isEs6SimpleFunction = (element) => (
//   element.type === 'VariableDeclaration' &&
//   element.declarations[0].type === 'VariableDeclarator' &&
//   element.declarations[0].init.type === 'ArrowFunctionExpression'
// );

// const isNamedEs6SimpleFunction = (element, functionName) => (
//   isEs6SimpleFunction(element) &&
//   element.declarations.id.name === functionName
// );

const isClassicFunction = (element) => (
  element &&
  element.type === 'FunctionDeclaration'
);

const isNamedClassicFunction = (element, functionName) => (
  element &&
  isClassicFunction(element) &&
  element.id.name === functionName
);

const isFunction = (element) => {
  return (
    isEs6Function(element) ||
    // isEs6SimpleFunction(element) ||
    isClassicFunction(element)
  );
};
const isNamedFunction = (element, functionName) => {
  return (
    isNamedEs6Function(element, functionName) ||
    // isNamedEs6SimpleFunction(element, functionName) ||
    isNamedClassicFunction(element, functionName)
  );
};

// VARIABLES

const isNamedVariable = (element, variableName) => (
  element && isVariableDeclaration(element) &&
  element.declarations &&
  element.declarations.id &&
  element.declarations.id.name &&
  element.declarations.id.name === variableName
);

// IMPORTS

const isRequireTypeImport = (element) => {
  if (element && element.type === 'VariableDeclaration') {
    const requireDeclarations = element.declarations.find(declaration => {
      return (
        declaration.type === 'VariableDeclarator' &&
        declaration.init.type === 'CallExpression' &&
        declaration.init.callee.type === 'Identifier' &&
        declaration.init.callee.name === 'require'
      );
    });

    if (requireDeclarations) return true;
  }
};

const isImportTypeImport = (element) => (
  element && element.type === 'ImportDeclaration'
);

const isMultiVariableImport = (element) => {
  if (isRequireTypeImport(element)) {
    return !element.declarations[0].id.name;
  } else if (isImportTypeImport(element)) {
    console.log('not implemented');
  }
};

const isLocalPath = (path) => {
  return !!path.match(/^[\.]{1,2}\//);
};

const isImport = (element) => (
  isRequireTypeImport(element) ||
  isImportTypeImport(element)
);



module.exports = {
  isProgram,
  isIterable,
  hasArguments,
  isCallExpression,
  isAwaitExpression,
  isIdentifier,
  isImportNamespaceSpecifier,
  isExpressionStatement,
  isAssignmentExpression,
  isBlockStatement,
  isIfStatement,
  isArrowFunctionExpression,
  isVariableDeclaration,
  isVariableDeclarator,
  isArrayExpression,
  isObjectExpression,
  isThrowStatement,
  isCatchClause,
  isTryStatement,
  isRegExpLiteral,
  isStringLiteral,
  isTemplateLiteral,
  isReturnStatement,
  isMemberExpression,
  isNewExpression,
  isUnaryExpression,
  isLogicalExpression,
  isConditionalExpression,
  isBinaryExpression,
  isNumericLiteral,
  hasLeadingComments,
  hasTrailingComments,
  isJsDoc,
  isEs6Function,
  isClassicFunction,
  isNamedEs6Function,
  isNamedClassicFunction,
  isNamedExportNamedDeclaration,
  isFunction,
  isNamedFunction,
  isNamedVariable,
  isExportNamedDeclaration,
  isRequireTypeImport,
  isImportTypeImport,
  isImport,
  isMultiVariableImport,
  isLocalPath
};
