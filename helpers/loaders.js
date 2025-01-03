const fs = require("fs");
const parser = require("@babel/parser");
const { parse } = require("@typescript-eslint/typescript-estree");

const isJsFile = (fileName) => fileName.substr(fileName.length - 3) === ".js";
const isTsFile = (fileName) => fileName.substr(fileName.length - 3) === ".ts";

const getAst = async (file, currentLocation, options) => {
  const fileExists = fs.existsSync(file);
  if (!fileExists) {
    throw Error("File doesn't exists. " + file);
  }
  const text = fs.readFileSync(file, "utf8");

  if (isJsFile(file)) {
    return {
      ...parser.parse(text, {
        sourceType: "module",
        plugins: options.babelPlugins,
      }),
      fileLoc: file,
    };
  } else if (isTsFile(file)) {
    return {
      ...parse(text, {
        loc: true,
        range: true,
      }),
      fileLoc: file,
    };
  }

  throw new Error("Unsupported file type.");
};

const getFileFromImport = async (path) => {
  const formattedPath = path.replace("/./", "/");
  const jsFile =
    path.slice(-3) === ".js" ? formattedPath : `${formattedPath}.js`;
  const mjsFile =
    path.slice(-4) === ".mjs" ? formattedPath : `${formattedPath}.mjs`;
  const tsFile =
    path.slice(-3) === ".ts" ? formattedPath : `${formattedPath}.ts`;
  if (fs.existsSync(jsFile)) {
    return jsFile;
  } else if (fs.existsSync(tsFile)) {
    return tsFile;
  } else if (fs.existsSync(mjsFile)) {
    return mjsFile;
  }
};

module.exports = {
  getAst,
  getFileFromImport,
};
