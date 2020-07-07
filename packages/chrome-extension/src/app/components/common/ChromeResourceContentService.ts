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

import {
  ContentType,
  ResourceContentOptions,
  ResourceListOptions,
  WorkspaceServiceChannelApi
} from "@kogito-tooling/workspace-service-api";
import { fetchFile } from "../../github/api";
import * as minimatch from "minimatch";
import { RepoInfo } from "./RepoInfo";
import Octokit = require("@octokit/rest");

class OctokitResponse {
  public data: GithubTreeResponse;
}

class GithubAsset {
  public type: string;
  public path: string;
  public mode: string;
  public sha: string;
  public url: string;
}

class GithubTreeResponse {
  public sha: string;
  public url: string;
  public tree: GithubAsset[];
}

class ChromeResourceContentService implements WorkspaceServiceChannelApi {
  private readonly repoInfo: RepoInfo;
  private readonly octokit: Octokit;

  constructor(octokit: Octokit, repoInfo: RepoInfo) {
    this.octokit = octokit;
    this.repoInfo = repoInfo;
  }

  public receive_resourceContentRequest(path: string, opts?: ResourceContentOptions): Promise<string | undefined> {
    opts = opts ?? { type: ContentType.TEXT };
    return fetchFile(
      this.octokit,
      this.repoInfo.owner,
      this.repoInfo.repo,
      this.repoInfo.gitref,
      path,
      opts!.type
    ).catch(e => {
      console.debug(e);
      console.debug(`Error retrieving content from URI ${path}`);
      return undefined;
    });
  }

  public receive_resourceListRequest(pattern: string, opts?: ResourceListOptions): Promise<string[]> {
    return this.octokit.git
      .getTree({
        headers: {
          "cache-control": "no-cache"
        },
        recursive: "1",
        tree_sha: this.repoInfo.gitref,
        ...this.repoInfo
      })
      .then((v: OctokitResponse) => {
        const filteredPaths = v.data.tree.filter(file => file.type === "blob").map(file => file.path);
        return minimatch.match(filteredPaths, pattern);
      })
      .catch(e => {
        console.debug(`Error retrieving file list for pattern ${pattern}`);
        return [];
      });
  }

  public receive_openFile(path: string): void {
    throw new Error("Cannot open new file on Chrome Extension");
  }
}

export class ResourceContentServiceFactory {
  public createNew(octokit: Octokit, repoInfo: RepoInfo) {
    return new ChromeResourceContentService(octokit, repoInfo);
  }
}
