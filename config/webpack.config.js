const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const isDev = true;
module.exports = {
  mode: "development",
    entry: {
        index: [path.resolve(__dirname, "./webpack-communication.js")]
    },
    target: 'electron-renderer',
    resolve: {
      alias: {
        'react-dom': '@hot-loader/react-dom',
      },
      extensions: ['.ts', '.tsx', '.js', 'jsx']
    },
    output: {
        filename: 'bundle-script.js',
        path: path.resolve(__dirname, '../dist/'),
        publicPath: '/dist',
      },

    module: {
        rules: [
            {
              test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: [
                  {
                    loader: "babel-loader",
                    options: {
                      cacheDirectory: true,
                      babelrc: true,
                    },

                  },
                ]
              },

              {
                test: /\.styl$/,
                use: (function() {
                  let separate = [

                    { loader: MiniCSSExtractPlugin.loader},
                    { loader: 'css-loader',
                      options: {
                        url: false
                      }},
                    { loader: 'postcss-loader',
                      options: {
                        indent: 'postcss',
                        plugins: [
                          require('autoprefixer')({
                            'overideBrowserslist': ['> 1%', 'last 2 versions']
                          })
                        ]
                      }
                    },
                    { loader: 'stylus-loader'},

                  ];
        
                  if (isDev) separate.unshift({loader: 'css-hot-loader'});
                  return separate;
                }())
              },

        ]
    },
    plugins: [
        new MiniCSSExtractPlugin({
            filename: 'bundled-style.css',
            chunkFilename: '[id].css'
        }),
        new ForkTsCheckerWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "../src/index.html")
        })

    ]
}