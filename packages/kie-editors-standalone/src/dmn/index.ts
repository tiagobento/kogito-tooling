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

import bpmnEnvelopeIndex from "!!raw-loader!../../dist/resources/dmn/dmnEnvelopeIndex.html";
import { EnvelopeServer } from "@kogito-tooling/envelope-bus/dist/channel";
import { ChannelType, KogitoEditorChannelApi, KogitoEditorEnvelopeApi } from "@kogito-tooling/editor/dist/api";
import { KogitoEditorChannelApiImpl } from "../envelope/KogitoEditorChannelApiImpl";
import { StateControl } from "@kogito-tooling/editor/dist/channel";
import { ContentType } from "@kogito-tooling/channel-common-api";
import { createEditor, Editor, StandaloneEditorApi } from "../common/Editor";

declare global {
  interface Window {
    DmnEditor: Editor;
  }
}

const createEnvelopeServer = (iframe: HTMLIFrameElement, readOnly?: boolean, origin?: string) => {
  const defaultOrigin = window.location.protocol === "file:" ? "*" : window.location.origin;

  return new EnvelopeServer<KogitoEditorChannelApi, KogitoEditorEnvelopeApi>(
    { postMessage: message => iframe.contentWindow?.postMessage(message, "*") },
    origin ?? defaultOrigin,
    self => {
      return self.envelopeApi.requests.receive_initRequest(
        {
          origin: self.origin,
          envelopeServerId: self.id
        },
        {
          resourcesPathPrefix: "",
          fileExtension: "dmn",
          initialLocale: "en-US",
          isReadOnly: readOnly ?? true,
          channel: ChannelType.EMBEDDED
        }
      );
    }
  );
};

export function open(args: {
  container: Element;
  initialContent: Promise<string>;
  readOnly?: boolean;
  origin?: string;
  onError?: () => any;
  resources?: Map<string, { contentType: ContentType; content: Promise<string> }>;
}): StandaloneEditorApi {
  const iframe = document.createElement("iframe");
  iframe.srcdoc = bpmnEnvelopeIndex;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  const envelopeServer = createEnvelopeServer(iframe, args.readOnly, args.origin);

  const stateControl = new StateControl();

  let receivedSetContentError = false;

  const apiImpl = new KogitoEditorChannelApiImpl(
    stateControl,
    {
      fileName: "",
      fileExtension: "dmn",
      getFileContents: () => Promise.resolve(args.initialContent),
      isReadOnly: args.readOnly ?? false
    },
    "en-US",
    {
      receive_setContentError() {
        if (!receivedSetContentError) {
          args.onError?.();
          receivedSetContentError = true;
        }
      }
    },
    args.resources
  );

  const listener = (message: MessageEvent) => {
    envelopeServer.receive(message.data, apiImpl);
  };

  window.addEventListener("message", listener);

  args.container.appendChild(iframe);
  envelopeServer.startInitPolling(apiImpl);

  return createEditor(envelopeServer, stateControl, listener, iframe);
}

window.DmnEditor = { open };
