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
  EditorContext,
  EnvelopeBus,
  KogitoChannelApi,
  KogitoEnvelopeApi
} from "@kogito-tooling/microeditor-envelope-protocol";
import { DefaultKeyboardShortcutsService } from "@kogito-tooling/keyboard-shortcuts";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { EditorFactory, EnvelopeContext, EnvelopeContextType } from "@kogito-tooling/editor-api";
import { SpecialDomElements } from "./SpecialDomElements";
import { KogitoEnvelopeApiFactory } from "./KogitoEnvelopeApiImpl";
import { EnvelopeBusController } from "./EnvelopeBusController";
import { KogitoGuidedTour } from "@kogito-tooling/guided-tour";
import { EditorEnvelopeView } from "./EditorEnvelopeView";

/**
 * Starts the envelope at a container. Uses bus to send messages out of the envelope and creates editors based on the editorFactory provided.
 * @param args.container The DOM element where the envelope should be rendered.
 * @param args.bus The implementation of EnvelopeBus to send messages out of the envelope.
 * @param args.editorFactory The factory of Editors using a LanguageData implementation.
 * @param args.editorContext The context for Editors with information about the running channel.
 */
export function init(args: {
  container: HTMLElement;
  bus: EnvelopeBus;
  editorFactory: EditorFactory<any>;
  editorContext: EditorContext;
}) {
  const apiFactory = new KogitoEnvelopeApiFactory(args.editorFactory);

  const specialDomElements = new SpecialDomElements();
  const envelopeBusController = new EnvelopeBusController<KogitoEnvelopeApi, KogitoChannelApi>(args.bus);

  const envelopeContext: EnvelopeContextType = {
    channelApi: envelopeBusController.client,
    context: args.editorContext,
    services: {
      keyboardShortcuts: new DefaultKeyboardShortcutsService({ editorContext: args.editorContext }),
      guidedTour: {
        isEnabled: () => KogitoGuidedTour.getInstance().isEnabled()
      }
    }
  };

  return renderEnvelope(args.container, specialDomElements, envelopeContext).then(view => {
    const api = apiFactory.createNew({ view, envelopeBusController, envelopeContext });
    envelopeBusController.startListening(api);
    return envelopeBusController;
  });
}

function renderEnvelope(
    container: HTMLElement,
    specialDomElements: SpecialDomElements,
    envelopeContext: EnvelopeContextType
) {
  let view: EditorEnvelopeView;

  const envelope = (
    <EnvelopeContext.Provider value={envelopeContext}>
      <EditorEnvelopeView
        exposing={self => (view = self)}
        loadingScreenContainer={specialDomElements.loadingScreenContainer}
      />
    </EnvelopeContext.Provider>
  );

  return new Promise<EditorEnvelopeView>(res => {
    setTimeout(() => {
      ReactDOM.render(envelope, container, () => res(view!));
    }, 0);
  });
}
