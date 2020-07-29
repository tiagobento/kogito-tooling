/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const nodeExternals = require("webpack-node-externals");
const CopyPlugin = require("copy-webpack-plugin");
const pfWebpackOptions = require("@kogito-tooling/patternfly-base/patternflyWebpackOptions");
const { merge } = require("webpack-merge");
const common = require("../../webpack.common.config");

module.exports = [
  merge(common, {
    entry: {
      index: "./src/index.ts"
    },
    output: {
      libraryTarget: "umd",
      globalObject: "this"
    },
    module: { rules: [...pfWebpackOptions.patternflyRules] },
    externals: [nodeExternals({ modulesDir: "../../node_modules" })],
    plugins: [new CopyPlugin([{ from: "./static/envelope", to: "./envelope" }])]
  }),
  merge(common, {
    entry: {
      "envelope/envelope": "./src/envelope/envelope.ts"
    },
    module: { rules: [...pfWebpackOptions.patternflyRules] },
  })
];