const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");


const isDev = true;
module.exports = {
  mode: "development",
  entry: {
    index: [
     path.resolve(__dirname, "./webpack-communication.js")],
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/
  },
  target: 'web',
  resolve: {
    alias: {
      "react-dom": "@hot-loader/react-dom",
    },
    extensions: [".ts", ".tsx", ".js", "jsx"],
  },
  output: {
    filename: "bundle-script.js",
    path: path.resolve(__dirname, "../dist/"),
    publicPath: "/",
    hotUpdateChunkFilename: 'hot-update.js',
    hotUpdateMainFilename: 'hot-update.json'
  },
  devServer: {
    publicPath: '/',
    contentBase: path.resolve(__dirname, '../dist'),
    hot: true,
    overlay: true, 
    noInfo: true,
    stats: {
      colors: true
    },
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 8080,
    historyApiFallback: {
      index: '/'
    }
  },
  devtool: 'inline-source-map' ,
  module: {
    rules: [

      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {loader: 'react-hot-loader/webpack'},
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              babelrc: true,
            },
          },

        ],
      },

      {
        test: /\.styl$/,
        use: (function () {
          let separate = [
            { loader: MiniCSSExtractPlugin.loader },
            {
              loader: "css-loader",
              options: {
                url: false,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                indent: "postcss",
                plugins: [
                  require("autoprefixer")({
                    overideBrowserslist: ["> 1%", "last 2 versions"],
                  }),
                ],
              },
            },
            { loader: "stylus-loader" },
          ];

          if (isDev) separate.unshift({ loader: "css-hot-loader" });
          return separate;
        })(),
      },
    ],
  },
  plugins:[
    
    new MiniCSSExtractPlugin({
      filename: "bundled-style.css",
      chunkFilename: "[id].css",
    }),
    //  new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../src/index.html"),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
};
