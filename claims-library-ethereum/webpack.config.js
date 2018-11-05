const path = require('path')

module.exports = [{
  name: 'demo',
  mode: 'development',
  entry: './demo/index.js',
  output: {
    filename: 'demo.js',
    path: path.resolve(__dirname, 'dist')
  },
  externals:[{
    xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}'
  }]
},{
  name: 'source',
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  externals:[{
    xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}'
  }]
}]
