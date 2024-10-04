const CopyWebpackPlugin = require('copy-webpack-plugin')
const GasPlugin = require("gas-webpack-plugin")
const Path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  entry: './src/index.ts',
  output: {
    path: Path.join(__dirname, 'build'),
    libraryTarget: 'this'
  },
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: [Path.resolve(__dirname, 'src'), Path.resolve(__dirname, 'config')],
        exclude: /node_modules/,
        use: ['ts-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.ts']
  },
  plugins: [
    new ESLintPlugin(),
    new GasPlugin({
      autoGlobalExportsFiles: ['./src/**/*.ts'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "./src/appsscript.json" },
      ],
    })
  ]
}
