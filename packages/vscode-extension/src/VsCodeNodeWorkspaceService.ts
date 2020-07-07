/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
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
  SearchType,
  WorkspaceServiceChannelApi
} from "@kogito-tooling/workspace-service-api";

import * as fs from "fs";
import * as minimatch from "minimatch";
import * as __path from "path";
import * as vscode from "vscode";

/**
 * Implementation of a ResourceContentService using the Node filesystem APIs. This should only be used when the edited
 * asset is not part the opened workspace.
 */
export class VsCodeNodeWorkspaceService implements WorkspaceServiceChannelApi {
  constructor(private readonly rootFolder: string, private readonly path: string) {}

  public async receive_resourceListRequest(pattern: string, opts?: ResourceListOptions): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(this.rootFolder, { withFileTypes: true }, (err, files) => {
        if (err) {
          resolve([]);
        } else {
          const paths = files
            .filter(file => {
              let fileName;
              if (opts?.type === SearchType.TRAVERSAL) {
                fileName = this.rootFolder + file.name;
              } else {
                fileName = file.name;
              }
              return file.isFile() && minimatch(fileName, pattern);
            })
            .map(file => this.rootFolder + file.name);
          resolve(paths);
        }
      });
    });
  }

  public async receive_resourceContentRequest(
    path: string,
    opts?: ResourceContentOptions
  ): Promise<string | undefined> {
    let assetPath = path;

    if (!assetPath.startsWith(this.rootFolder)) {
      assetPath = this.rootFolder + path;
    }

    if (opts?.type === ContentType.BINARY) {
      return new Promise<string | undefined>((resolve, reject) => {
        fs.readFile(assetPath, (err, data) => {
          if (err) {
            resolve(undefined);
          } else {
            resolve(Buffer.from(data).toString("base64"));
          }
        });
      });
    }
    return new Promise<string | undefined>((resolve, reject) => {
      fs.readFile(assetPath, (err, data) => {
        if (err) {
          resolve(undefined);
        } else {
          resolve(Buffer.from(data).toString());
        }
      });
    });
  }

  public receive_openFile(filePath: string): void {
    const resolvedPath = __path.isAbsolute(filePath) ? filePath : __path.join(__path.dirname(this.path), filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Cannot open file at: ${resolvedPath}.`);
    }

    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(resolvedPath));
  }
}
