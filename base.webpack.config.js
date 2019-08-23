/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require("path");
const CircularDependencyPlugin = require("circular-dependency-plugin");

module.exports = dirname => ({
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/, // exclude detection of files based on a RegExp
      failOnError: false, // add errors to webpack instead of warnings
      cwd: process.cwd() // set the current working directory for displaying module paths
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(dirname, "src"),
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: false,
              experimentalWatchApi: true,
              configFile: path.resolve(dirname, "tsconfig.json")
            }
          }
        ]
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["react"]
            }
          }
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader"
        ],
      },
      {
        test: /\.css$/,
        include: [
          path.resolve(dirname, "src"),
          path.resolve(dirname, "../../node_modules/patternfly"),
          path.resolve(dirname, "../../node_modules/@patternfly/patternfly"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-styles/css"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/dist/styles/base.css"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/dist/esm/@patternfly/patternfly"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/node_modules/@patternfly/react-styles/css")
        ],
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(svg|ttf|eot|woff|woff2)$/,
        include: [
          path.resolve(dirname, "../../node_modules/patternfly/dist/fonts"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/dist/styles/assets/fonts"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/dist/styles/assets/pficon"),
          path.resolve(dirname, "../../node_modules/@patternfly/patternfly/assets/fonts"),
          path.resolve(dirname, "../../node_modules/@patternfly/patternfly/assets/pficon")
        ],
        use: ["file-loader"]
      },
      {
        test: /\.(jpg|jpeg|png|gif)$/i,
        include: [
          path.resolve(dirname, "src"),
          path.resolve(dirname, "../../node_modules/patternfly"),
          path.resolve(dirname, "../../node_modules/@patternfly/patternfly/assets"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/dist/styles/assets/images"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-styles/css/assets/images"),
          path.resolve(dirname, "../../node_modules/@patternfly/react-core/node_modules/@patternfly/react-styles/css/assets/images")
        ],
        use: ["file-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    modules: [
      path.resolve(dirname, "../../node_modules"), 
      path.resolve(dirname, "node_modules"), 
      path.resolve(dirname, "src")]
  }
});
