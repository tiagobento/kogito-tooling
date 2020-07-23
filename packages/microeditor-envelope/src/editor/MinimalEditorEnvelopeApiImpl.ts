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

import {
  ApiDefinition,
  Association,
  ChannelType,
  DEFAULT_RECT,
  EditorContent,
  MinimalEditorEnvelopeApi,
  StateControlCommand
} from "@kogito-tooling/microeditor-envelope-protocol";
import { Editor, EditorFactory } from "@kogito-tooling/editor-api";
import { EnvelopeApiFactory, EnvelopeApiFactoryArgs } from "../EnvelopeApiFactory";

export class MinimalEditorEnvelopeApiFactory<ApiToConsume extends ApiDefinition<ApiToConsume>>
  implements EnvelopeApiFactory<MinimalEditorEnvelopeApi, ApiToConsume> {
  constructor(private readonly editorFactory: EditorFactory<any>) {}

  public createNew<A extends MinimalEditorEnvelopeApi & ApiDefinition<A>>(
    args: EnvelopeApiFactoryArgs<A, ApiToConsume>
  ) {
    return new MinimalEditorEnvelopeApiImpl(this.editorFactory, args);
  }
}

export class MinimalEditorEnvelopeApiImpl<
  A extends MinimalEditorEnvelopeApi & ApiDefinition<A>,
  ApiToConsume extends ApiDefinition<ApiToConsume>
> implements MinimalEditorEnvelopeApi {
  //
  private capturedInitRequestYet = false;
  private editor: Editor;

  constructor(
    private readonly editorFactory: EditorFactory<any>,
    private readonly args: EnvelopeApiFactoryArgs<A, ApiToConsume>
  ) {}

  public receive_initRequest = async (association: Association) => {
    this.args.envelopeBusController.associate(association);

    if (this.capturedInitRequestYet) {
      return;
    }

    this.capturedInitRequestYet = true;

    const language = await this.args.envelopeContext.channelApi.request("receive_languageRequest");
    this.editor = await this.editorFactory.createEditor(language, this.args.envelopeContext);

    await this.args.view.setEditor(this.editor);
    await this.editor.af_onStartup();
    await this.editor.af_onOpen();

    if (this.args.envelopeContext.context.channel !== ChannelType.VSCODE) {
      this.registerDefaultShortcuts();
    }

    this.args.view.setLoading();

    const content = await this.args.envelopeContext.channelApi.request("receive_contentRequest");

    await this.editor
      .setContent(content.path ?? "", content.content)
      .finally(() => this.args.view.setLoadingFinished());

    this.args.envelopeContext.channelApi.notify("receive_ready");
  };

  public receive_contentChanged = (editorContent: EditorContent) => {
    this.args.view.setLoading();
    this.editor
      .setContent(editorContent.path ?? "", editorContent.content)
      .finally(() => this.args.view.setLoadingFinished());
  };

  public receive_editorUndo() {
    this.editor.undo();
  };

  public receive_editorRedo() {
    this.editor.redo();
  };

  public receive_contentRequest() {
    return this.editor.getContent().then(content => ({ content: content }));
  };

  public receive_previewRequest() {
    return this.editor.getPreview().then(previewSvg => previewSvg ?? "");
  };

  public receive_guidedTourElementPositionRequest = async (selector: string) => {
    return this.editor.getElementPosition(selector).then(rect => rect ?? DEFAULT_RECT);
  };

  private registerDefaultShortcuts() {
    this.args.envelopeContext.services.keyboardShortcuts.registerKeyPress(
      "shift+ctrl+z",
      "Edit | Redo last edit",
      async () => {
        this.editor.redo();
        this.args.envelopeContext.channelApi.notify("receive_stateControlCommandUpdate", StateControlCommand.REDO);
      }
    );
    this.args.envelopeContext.services.keyboardShortcuts.registerKeyPress(
      "ctrl+z",
      "Edit | Undo last edit",
      async () => {
        this.editor.undo();
        this.args.envelopeContext.channelApi.notify("receive_stateControlCommandUpdate", StateControlCommand.UNDO);
      }
    );
  }
}
