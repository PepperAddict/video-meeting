const express = require("express");
const app = express();

const isDev = process.env.NODE_ENV == "development" ? true : false;

const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");

const config = require("../../config/webpack.config.js");
const compiler = webpack(config);


if (isDev) {
  const webpackHotMiddleware = require("webpack-hot-middleware");
  app.use(webpackHotMiddleware(compiler));
}

app.use(webpackDevMiddleware(compiler, config.devServer));

module.exports = app