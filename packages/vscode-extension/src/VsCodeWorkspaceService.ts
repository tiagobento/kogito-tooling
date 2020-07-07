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

import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import * as nodePath from "path";
import * as __path from "path";
import * as fs from "fs";

/**
 * Implementation of a ResourceContentService using the vscode apis to list/get assets.
 */
export class VsCodeWorkspaceService implements WorkspaceServiceChannelApi {
  constructor(private readonly currentAssetFolder: string, private readonly path: string) {}

  public async receive_resourceListRequest(pattern: string, opts?: ResourceListOptions): Promise<string[]> {
    const expr = opts?.type === SearchType.ASSET_FOLDER ? this.currentAssetFolder + pattern : pattern;

    const files = await vscode.workspace.findFiles(expr);
    return files.map(f => vscode.workspace.asRelativePath(f.path));
  }

  public async receive_resourceContentRequest(
    path: string,
    opts?: ResourceContentOptions
  ): Promise<string | undefined> {
    const contentPath = this.resolvePath(path);

    if (!contentPath) {
      return undefined;
    }

    try {
      await vscode.workspace.fs.stat(vscode.Uri.parse(contentPath));
    } catch (e) {
      console.warn(`Error checking file ${path}: ${e}`);
      return undefined;
    }

    return this.retrieveContent(opts?.type, contentPath);
  }

  private resolvePath(uri: string) {
    const folders: ReadonlyArray<WorkspaceFolder> = vscode.workspace!.workspaceFolders!;
    if (folders) {
      const rootPath = folders[0].uri.path;
      if (!uri.startsWith(nodePath.sep)) {
        uri = nodePath.sep + uri;
      }
      return rootPath + uri;
    }
    return null;
  }

  private retrieveContent(type: ContentType | undefined, contentPath: string) {
    if (type === ContentType.BINARY) {
      return vscode.workspace.fs
        .readFile(vscode.Uri.parse(contentPath))
        .then(content => Buffer.from(content).toString("base64"));
    } else {
      return vscode.workspace.openTextDocument(contentPath).then(textDoc => textDoc.getText());
    }
  }

  public receive_openFile(filePath: string): void {
    const resolvedPath = __path.isAbsolute(filePath) ? filePath : __path.join(__path.dirname(this.path), filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Cannot open file at: ${resolvedPath}.`);
    }

    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(resolvedPath));
  }
}
