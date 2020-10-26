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

import * as React from "react";
import { EmbeddedEditor } from "@kogito-tooling/editor/dist/embedded";
import { ChannelType } from "@kogito-tooling/channel-common-api";

export function KogitoOnlineEditor(props: { fileExtension: string; content: string; readonly: boolean }) {
  return (
    <EmbeddedEditor
      key={props.fileExtension}
      file={{
        isReadOnly: props.readonly,
        getFileContents: () => Promise.resolve(props.content ?? ""),
        fileExtension: props.fileExtension,
        fileName: "myFile"
      }}
      editorEnvelopeLocator={{
        targetOrigin: window.location.origin,
        mapping: new Map([
          [
            "dmn",
            {
              resourcesPathPrefix: "http://localhost:9001/gwt-editors/dmn",
              envelopePath: "http://localhost:9001/envelope/envelope.html"
            }
          ],
          [
            "bpmn",
            {
              resourcesPathPrefix: "http://localhost:9001/gwt-editors/bpmn",
              envelopePath: "http://localhost:9001/envelope/envelope.html"
            }
          ]
        ])
      }}
      channelType={ChannelType.EMBEDDED}
      locale={"en-US"}
    />
  );
}
