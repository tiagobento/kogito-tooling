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
  EditorContext,
  EnvelopeBus,
  KogitoEditorEnvelopeApi
} from "@kogito-tooling/microeditor-envelope-protocol";
import {
  EditorFactory,
  KogitoEditorEnvelopeContext,
  KogitoEditorEnvelopeContextType
} from "@kogito-tooling/editor-api";
import { DefaultKeyboardShortcutsService } from "@kogito-tooling/keyboard-shortcuts";
import { KogitoGuidedTour } from "@kogito-tooling/guided-tour";
import { EditorEnvelopeView } from "./EditorEnvelopeView";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { Envelope } from "../envelope/Envelope";
import { KogitoEditorEnvelopeApiFactory } from "./KogitoEditorEnvelopeApiImpl";

export class KogitoEditorEnvelope<ApiToConsume extends ApiDefinition<ApiToConsume>> {
  constructor(
    private readonly args: {
      container: HTMLElement;
      bus: EnvelopeBus;
      editorFactory: EditorFactory<any>;
      editorContext: EditorContext;
    },
    private readonly kogitoEditorEnvelopeApiFactory = new KogitoEditorEnvelopeApiFactory<ApiToConsume>(
      args.editorFactory
    ),
    private readonly keyboardShortcutsService = new DefaultKeyboardShortcutsService({
      editorContext: args.editorContext
    })
  ) {}

  public init() {
    const envelope: Envelope<
      KogitoEditorEnvelopeApi,
      ApiToConsume,
      EditorEnvelopeView,
      KogitoEditorEnvelopeContextType
    > = new Envelope(this.args.bus);

    const context: KogitoEditorEnvelopeContextType = {
      channelApi: envelope.busClient,
      context: this.args.editorContext,
      services: {
        keyboardShortcuts: this.keyboardShortcutsService,
        guidedTour: { isEnabled: () => KogitoGuidedTour.getInstance().isEnabled() }
      }
    };

    return envelope.start(() => this.renderView(context), context, this.kogitoEditorEnvelopeApiFactory);
  }

  private renderView(context: KogitoEditorEnvelopeContextType) {
    let view: EditorEnvelopeView;

    const app = (
      <KogitoEditorEnvelopeContext.Provider value={context}>
        <EditorEnvelopeView exposing={self => (view = self)} />
      </KogitoEditorEnvelopeContext.Provider>
    );

    return new Promise<EditorEnvelopeView>(res => {
      setTimeout(() => {
        ReactDOM.render(app, this.args.container, () => res(view!));
      }, 0);
    });
  }
}
