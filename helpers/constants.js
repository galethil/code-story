const CallExpression = 'CallExpression';
const AwaitExpression = 'AwaitExpression';
const Identifier = 'Identifier';
const ExpressionStatement = 'ExpressionStatement';
const AssignmentExpression = 'AssignmentExpression';
const BlockStatement = 'BlockStatement';
const VariableDeclaration = 'VariableDeclaration';
const VariableDeclarator = 'VariableDeclarator';
const ArrayExpression = 'ArrayExpression';
const ObjectExpression = 'ObjectExpression';
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
// /* comment */
const CommentBlock = 'CommentBlock';

module.exports = {
  CallExpression,
  AwaitExpression,
  Identifier,
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
};
