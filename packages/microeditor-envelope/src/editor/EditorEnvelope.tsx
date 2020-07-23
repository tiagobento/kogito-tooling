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
  MinimalEditorEnvelopeApi
} from "@kogito-tooling/microeditor-envelope-protocol";
import {EditorFactory, EnvelopeContext, EnvelopeContextType} from "@kogito-tooling/editor-api";
import {EnvelopeApiFactory} from "../EnvelopeApiFactory";
import {MinimalEditorEnvelopeApiFactory} from "./MinimalEditorEnvelopeApiImpl";
import {DefaultKeyboardShortcutsService} from "@kogito-tooling/keyboard-shortcuts";
import {EnvelopeBusController} from "../EnvelopeBusController";
import {KogitoGuidedTour} from "@kogito-tooling/guided-tour";
import {EditorEnvelopeView} from "./EditorEnvelopeView";
import * as ReactDOM from "react-dom";
import * as React from "react";

export class EditorEnvelope<
  CustomApiToProvide extends ApiDefinition<CustomApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>
> {
  constructor(
    private readonly args: {
      container: HTMLElement;
      bus: EnvelopeBus;
      editorFactory: EditorFactory<any>;
      editorContext: EditorContext;
      customApiFactory?: EnvelopeApiFactory<CustomApiToProvide, ApiToConsume>;
    },
    private readonly minimalEnvelopeApiFactory = new MinimalEditorEnvelopeApiFactory<ApiToConsume>(args.editorFactory),
    private readonly keyboardShortcutsService = new DefaultKeyboardShortcutsService({
      editorContext: args.editorContext
    }),
    private readonly envelopeBusController = new EnvelopeBusController<
      MinimalEditorEnvelopeApi & CustomApiToProvide,
      ApiToConsume
    >(args.bus),
    private readonly envelopeContext: EnvelopeContextType = {
      channelApi: envelopeBusController.client,
      context: args.editorContext,
      services: {
        keyboardShortcuts: keyboardShortcutsService,
        guidedTour: { isEnabled: () => KogitoGuidedTour.getInstance().isEnabled() }
      }
    }
  ) {}

  public async init() {
    const view = await this.render();
    const api = this.buildCompleteEnvelopeApi(view);

    this.envelopeBusController.startListening(api);
    return this.envelopeBusController;
  }

  private buildCompleteEnvelopeApi(view: EditorEnvelopeView) {
    const customApiFactory = this.args.customApiFactory ?? { createNew: () => ({} as CustomApiToProvide) };

    const args = {
      view: view,
      envelopeBusController: this.envelopeBusController,
      envelopeContext: this.envelopeContext
    };

    const customApi = customApiFactory.createNew(args);
    const minimalEnvelopeApi = this.minimalEnvelopeApiFactory.createNew(args);

    return {
      ...this.classInstanceToPlainObject(customApi),
      ...this.classInstanceToPlainObject(minimalEnvelopeApi)
    };
  }

  private render() {
    let view: EditorEnvelopeView;

    const envelope = (
      <EnvelopeContext.Provider value={this.envelopeContext}>
        <EditorEnvelopeView exposing={self => (view = self)} />
      </EnvelopeContext.Provider>
    );

    return new Promise<EditorEnvelopeView>(res => {
      setTimeout(() => {
        ReactDOM.render(envelope, this.args.container, () => res(view!));
      }, 0);
    });
  }

  private classInstanceToPlainObject<T extends ApiDefinition<T>>(classInstance: T): T {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(classInstance))
      .map(k => k as keyof T)
      .reduce(
        (obj, k) => {
          obj[k] = classInstance[k];
          return obj;
        },
        { ...classInstance } as T
      );
  }
}
