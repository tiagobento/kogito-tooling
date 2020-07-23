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
  ChannelKeyboardEvent,
  EditorContext,
  EnvelopeBus,
  KeyboardShortcutsEnvelopeApi,
  KogitoChannelApi
} from "@kogito-tooling/microeditor-envelope-protocol";
import * as React from "react";
import { EditorFactory } from "@kogito-tooling/editor-api";
import { EnvelopeApiFactory, EnvelopeApiFactoryArgs } from "./EnvelopeApiFactory";
import { EditorEnvelope } from "./editor/EditorEnvelope";

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
  const customApiFactory = new KeyboardShortcutsEnvelopeApiFactory();
  return initCustom({ ...args, customApiFactory });
}

class KeyboardShortcutsEnvelopeApiFactory
  implements EnvelopeApiFactory<KeyboardShortcutsEnvelopeApi, KogitoChannelApi> {
  public createNew<T extends ApiDefinition<T>>(args: EnvelopeApiFactoryArgs<T, KogitoChannelApi>) {
    return new KeyboardShortcutsEnvelopeApiImpl();
  }
}

class KeyboardShortcutsEnvelopeApiImpl implements KeyboardShortcutsEnvelopeApi {
  public receive_channelKeyboardEvent = (channelKeyboardEvent: ChannelKeyboardEvent) => {
    window.dispatchEvent(new CustomEvent(channelKeyboardEvent.type, { detail: channelKeyboardEvent }));
  };
}

/**
 * Starts the envelope at a container. Uses bus to send messages out of the envelope and creates Editors based on the editorFactory provided.
 * @param args.container The DOM element where the envelope should be rendered.
 * @param args.bus The implementation of EnvelopeBus to send messages out of the envelope.
 * @param args.editorFactory The factory of Editors using a LanguageData implementation.
 * @param args.editorContext The context for Editors with information about the running channel.
 * @param args.customApiFactory The factory for an API implementation that composes with MinimalEditorEnvelopeApi.
 */
function initCustom<
  CustomApiToProvide extends ApiDefinition<CustomApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>
>(args: {
  container: HTMLElement;
  bus: EnvelopeBus;
  editorFactory: EditorFactory<any>;
  editorContext: EditorContext;
  customApiFactory?: EnvelopeApiFactory<CustomApiToProvide, ApiToConsume>;
}) {
  return new EditorEnvelope(args).init();
}
