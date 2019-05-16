const path = require('path');

  module.exports = {
    entry: './src/app.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.glsl$/,
          loader: 'webpack-glsl-loader'
        },
        {
          test: /\.gltf$/,
          loader: '@vxna/gltf-loader',
          options: { inline: true }
        },
        {
          test: /\.(bin|jpe?g|png)$/,
          loader: 'file-loader'
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js', '.glsl', 'gltf' ]
    },
    output: {
      filename: 'pathTracer.js',
      path: path.resolve(__dirname, 'dist/js')
    },
    // watch: true
  };
  