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
const Octokit = require("@octokit/rest");

async function run() {
  try {
    const workflow = core.getInput("workflow");
    const githubToken = core.getInput("github_token");
    const octokit = new Octokit({auth: githubToken});

    console.info("Workflow: " + workflow);
    console.info("GitHub: ");
    console.info(JSON.stringify(github));
    console.info("Owner: " + github.context.repo.owner);
    console.info("Repo: " + github.context.repo.repo);
    console.info("Ref: " + github.context.ref);
    
    const branch = github.context.ref.split("/").pop();
    console.info("Brnach: " + branch);

    const { data: prs } = await octokit.pulls.list({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      base: branch
    });

    console.log(prs);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
