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

const fs = require("fs");
const cp = require("child_process");
const prettier = require("prettier");

const CHROME_EXTENSION_MANIFEST_JSON_PATH = "./packages/chrome-extension-pack-kogito-kie-editors/static/manifest.json";

//

async function updatePackages(version) {
  await cp.exec(`npx lerna version ${version} --no-push --no-git-tag-version --exact --yes`);
}

async function updateChromeExtensionManifest(version) {
  const manifest = require(CHROME_EXTENSION_MANIFEST_JSON_PATH);
  manifest.version = version;

  const formattedManifest = prettier.format(JSON.stringify(manifest), { parser: "json" });
  fs.writeFileSync(CHROME_EXTENSION_MANIFEST_JSON_PATH, formattedManifest);
}

// MAIN

const newVersion = process.argv[2];
if (!newVersion) {
  console.error("Missing version number as first argument.");
  return 1;
}

Promise.resolve()
  .then(() => updatePackages(newVersion))
  .then(() => updateChromeExtensionManifest(newVersion))
  .catch(e => {
    function red(str) {
      return ["\x1b[31m", str, "\x1b[0m"];
    }

    console.error(e);
    console.error("");
    console.error(...red("Error updating versions. There might be undesired changes."));
    console.error("");
  });
