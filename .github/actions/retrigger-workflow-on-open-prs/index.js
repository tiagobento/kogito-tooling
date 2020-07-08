/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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

const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

async function run() {
  try {
    const workflow = core.getInput("workflow");
    const githubToken = core.getInput("github_token");

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const branch = github.context.ref.split("/").pop();

    const openPrs = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&base=${branch}`, {
      headers: { Authorization: "x-oauth-basic " + githubToken }
    }).then(c => c.json());

    await Promise.all(
      openPrs.map(pr => {
        console.info(`Re-triggering ${workflow} on #${pr.number}: ${pr.title}`);
        return fetch(`/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
          method: "POST",
          headers: { Authorization: "x-oauth-basic " + githubToken, Accept: "application/vnd.github.v3+json" },
          body: JSON.stringify({ ref: pr.head.sha })
        });
      })
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run().then(() => console.info("Finished."));
