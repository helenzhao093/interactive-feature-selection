const webpack = require('webpack');

const config = {
    entry: __dirname + '/js/index.js',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css']
    },
    module: {
        rules: [
          { test:/\.jsx?/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
              presets:["@babel/preset-env","@babel/preset-react"]
            }
          }
        ]
    }
};

module.exports = config;
