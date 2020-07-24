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

import { KogitoEditorStore } from "./KogitoEditorStore";
import { KogitoEditor } from "./KogitoEditor";
import {
  EditorEnvelopeLocator,
  EnvelopeMapping,
  KogitoEdit,
  ResourceContentService,
} from "@kogito-tooling/microeditor-envelope-protocol";
import { VsCodeNodeResourceContentService } from "./VsCodeNodeResourceContentService";
import { VsCodeResourceContentService } from "./VsCodeResourceContentService";

import * as vscode from "vscode";
import { Uri, Webview } from "vscode";
import * as nodePath from "path";

export class KogitoEditorFactory {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly editorStore: KogitoEditorStore,
    private readonly editorEnvelopeLocator: EditorEnvelopeLocator
  ) {}

  public configureNew(
    uri: vscode.Uri,
    initialBackup: vscode.Uri | undefined,
    webviewPanel: vscode.WebviewPanel,
    signalEdit: (edit: KogitoEdit) => void
  ) {
    const path = uri.fsPath;
    if (path.length <= 0) {
      throw new Error("parameter 'path' cannot be empty");
    }

    webviewPanel.webview.options = {
      enableCommandUris: true,
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this.context.extensionPath)]
    };

    const mapping = new Map<string, EnvelopeMapping>();
    Array.of(...this.editorEnvelopeLocator.mapping.entries()).forEach(([k, v]) => {
      mapping.set(k, {
        envelopePath: this.getWebviewPath(webviewPanel.webview, v.envelopePath),
        resourcesPathPrefix: this.getWebviewPath(webviewPanel.webview, v.resourcesPathPrefix)
      });
    });

    const editorEnvelopeLocator: EditorEnvelopeLocator = {
      targetOrigin: this.editorEnvelopeLocator.targetOrigin,
      mapping: mapping
    };

    const workspacePath = vscode.workspace.asRelativePath(path);

    const resourceContentService = this.createResourceContentService(path, workspacePath);

    const fileExtension = uri.fsPath.split(".").pop()!;

    const envelopeMapping = editorEnvelopeLocator.mapping.get(fileExtension);
    if (!envelopeMapping) {
      throw new Error("No envelope mapping found for " + fileExtension);
    }

    const editor = new KogitoEditor(
      workspacePath,
      uri,
      initialBackup,
      webviewPanel,
      this.context,
      this.editorStore,
      resourceContentService,
      signalEdit,
      envelopeMapping,
      editorEnvelopeLocator,
      fileExtension
    );

    this.editorStore.addAsActive(editor);
    editor.setupEnvelopeBus();
    editor.setupPanelActiveStatusChange();
    editor.setupPanelOnDidDispose();
    editor.setupWebviewContent();
  }

  private getWebviewPath(webview: Webview, relativePath: string) {
    return webview.asWebviewUri(Uri.file(this.context.asAbsolutePath(relativePath))).toString();
  }

  public createResourceContentService(path: string, workspacePath: string): ResourceContentService {
    if (this.isAssetInWorkspace(path)) {
      return new VsCodeResourceContentService(this.getParentFolder(workspacePath));
    }
    return new VsCodeNodeResourceContentService(this.getParentFolder(path));
  }

  private isAssetInWorkspace(path: string): boolean {
    return vscode.workspace.workspaceFolders?.map(f => f.uri.path).find(p => path.startsWith(p)) !== undefined;
  }

  private getParentFolder(assetPath: string) {
    if (assetPath.includes(nodePath.sep)) {
      return assetPath.substring(0, assetPath.lastIndexOf(nodePath.sep) + 1);
    }
    return "";
  }
}
