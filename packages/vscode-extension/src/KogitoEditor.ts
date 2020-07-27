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

import * as vscode from "vscode";
import * as fs from "fs";
import * as __path from "path";
import {
  EditorEnvelopeLocator,
  EnvelopeMapping,
  KogitoEditorChannel,
  KogitoEditorChannelApi
} from "@kogito-tooling/microeditor-envelope-protocol";
import { KogitoEditorStore } from "./KogitoEditorStore";

export class KogitoEditor {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder("utf-8");

  public constructor(
    private readonly relativePath: string,
    private readonly uri: vscode.Uri,
    private readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private readonly editorStore: KogitoEditorStore,
    private readonly envelopeMapping: EnvelopeMapping,
    private readonly envelopeLocator: EditorEnvelopeLocator,
    private readonly fileExtension: string,
    private readonly kogitoEditorChannel = new KogitoEditorChannel({
      postMessage: message => this.panel.webview.postMessage(message)
    })
  ) {}

  public async requestSave(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
    return this.kogitoEditorChannel.request_contentResponse().then(content => {
      if (cancellation.isCancellationRequested) {
        return;
      }
      return vscode.workspace.fs.writeFile(destination, this.encoder.encode(content.content)).then(() => {
        vscode.window.setStatusBarMessage("Saved successfully!", 3000);
      });
    });
  }

  public async requestBackup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
    return this.kogitoEditorChannel.request_contentResponse().then(content => {
      if (cancellation.isCancellationRequested) {
        return;
      }
      return vscode.workspace.fs.writeFile(destination, this.encoder.encode(content.content)).then(() => {
        console.info("Backup saved.");
      });
    });
  }

  public async deleteBackup(destination: vscode.Uri): Promise<void> {
    await vscode.workspace.fs.delete(destination);
  }

  public async notify_editorRevert(): Promise<void> {
    this.kogitoEditorChannel.notify_contentChanged({
      content: this.decoder.decode(await vscode.workspace.fs.readFile(this.uri)),
      path: this.relativePath
    });
  }

  public async notify_editorUndo(): Promise<void> {
    this.kogitoEditorChannel.notify_editorUndo();
  }

  public async notify_editorRedo(): Promise<void> {
    this.kogitoEditorChannel.notify_editorRedo();
  }

  public requestPreview() {
    this.kogitoEditorChannel.request_previewResponse().then(previewSvg => {
      if (previewSvg) {
        const parsedPath = __path.parse(this.uri.fsPath);
        fs.writeFileSync(`${parsedPath.dir}/${parsedPath.name}-svg.svg`, previewSvg);
      }
    });
  }

  public startInitPolling() {
    this.kogitoEditorChannel.startInitPolling(this.envelopeLocator.targetOrigin, {
      fileExtension: this.fileExtension,
      resourcesPathPrefix: this.envelopeMapping.resourcesPathPrefix
    });
  }

  public startListening(editorChannelApi: KogitoEditorChannelApi) {
    this.context.subscriptions.push(
      this.panel.webview.onDidReceiveMessage(
        msg => this.kogitoEditorChannel.receive(msg, editorChannelApi),
        this,
        this.context.subscriptions
      )
    );
  }

  public setupPanelActiveStatusChange() {
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.active) {
          this.editorStore.setActive(this);
        }

        if (!this.panel.active && this.editorStore.isActive(this)) {
          this.editorStore.setNoneActive();
        }
      },
      this,
      this.context.subscriptions
    );
  }

  public setupPanelOnDidDispose() {
    this.panel.onDidDispose(
      () => {
        this.kogitoEditorChannel.stopInitPolling();
        this.editorStore.close(this);
      },
      this,
      this.context.subscriptions
    );
  }

  public hasUri(uri: vscode.Uri) {
    return this.uri === uri;
  }

  public isActive() {
    return this.panel.active;
  }

  public viewColumn() {
    return this.panel.viewColumn;
  }

  public focus() {
    this.panel.reveal(this.viewColumn(), true);
  }

  public setupWebviewContent() {
    this.panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <style>
                html, body, div#envelope-app {
                    margin: 0;
                    border: 0;
                    padding: 0;
                    overflow: hidden;
                    height: 100%;
                }
                .panel-heading.uf-listbar-panel-header span {
                    color: white !important;
                }
                body {
                    background-color: #fff !important
                }
            </style>
        
            <title></title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
        <div id="envelope-app"></div>
        <script src="${this.envelopeMapping.envelopePath}"></script>
        </body>
        </html>
    `;
  }
}
