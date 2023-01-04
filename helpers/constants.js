const FileType = 'File';
const ProgramType = 'Program';
const CallExpression = 'CallExpression';
const AwaitExpression = 'AwaitExpression';
const Identifier = 'Identifier';
const ImportNamespaceSpecifier = 'ImportNamespaceSpecifier';
const ExpressionStatement = 'ExpressionStatement';
const AssignmentExpression = 'AssignmentExpression';
const BlockStatement = 'BlockStatement';
const VariableDeclaration = 'VariableDeclaration';
const VariableDeclarator = 'VariableDeclarator';
const ArrayExpression = 'ArrayExpression';
const ObjectExpression = 'ObjectExpression';
const Property = 'Property';
const StringLiteral = 'StringLiteral';
const RegExpLiteral = 'RegExpLiteral';
const TemplateLiteral = 'TemplateLiteral';
const ArrowFunctionExpression = 'ArrowFunctionExpression';
const IfStatement = 'IfStatement';
const ReturnStatement = 'ReturnStatement';
// httpStatus.FORBIDDEN
const MemberExpression = 'MemberExpression';
const TryStatement = 'TryStatement';
const CatchClause = 'CatchClause';
// throw Error('my error')
const ThrowStatement = 'ThrowStatement';
const NewExpression = 'NewExpression';
const UnaryExpression = 'UnaryExpression';
// left && right
const LogicalExpression = 'LogicalExpression';
// test ? consequent : alternate
const ConditionalExpression = 'ConditionalExpression';
// left === right
const BinaryExpression = 'BinaryExpression';
// 112
const NumericLiteral = 'NumericLiteral';
//
const BooleanLiteral = 'BooleanLiteral';
// /* comment */
const CommentBlock = 'CommentBlock';
// {...spread}
const SpreadElement = 'SpreadElement';
// key: value
const ObjectProperty = 'ObjectProperty';

module.exports = {
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
  Property,
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
  BooleanLiteral,
  CommentBlock,
  SpreadElement,
  ObjectProperty
};
