/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ChannelType,
  EditorEnvelopeLocator,
  EnvelopeMapping,
  ResourceContent,
  ResourceContentRequest,
  ResourceListRequest,
  ResourcesList
} from "@kogito-tooling/microeditor-envelope-protocol";
import * as React from "react";
import { useCallback } from "react";
import { File } from "../common/File";
import { EmbeddedEditor } from "./EmbeddedEditor";

/**
 * Properties supported by the `EmbeddedEditor`.
 */
interface Props {
  /**
   * File to show in the editor.
   */
  file: File;

  /**
   * EnvelopeMapping to map editor URLs to installations.
   */
  editorEnvelopeLocator: EditorEnvelopeLocator;

  /**
   * EnvelopeMapping to map editor URLs to installations.
   */
  envelopeMapping: EnvelopeMapping;

  /**
   * Channel in which the editor has been embedded.
   */
  channelType: ChannelType;

  /**
   * Optional callback for when the editor is requesting external content.
   */
  onResourceContentRequest?: (request: ResourceContentRequest) => Promise<ResourceContent | undefined>;

  /**
   * Optional callback for when the editor is requesting a list of external content.
   */
  onResourceListRequest?: (request: ResourceListRequest) => Promise<ResourcesList>;
}

export const EmbeddedViewer = (props: Props) => {
  const noop = useCallback((...args: any) => {
    /*NO OP*/
  }, []);

  const onResourceContentRequest = useCallback(
    (request: ResourceContentRequest) => {
      if (props.onResourceContentRequest) {
        return props.onResourceContentRequest(request);
      }
      return Promise.resolve(new ResourceContent(request.path, undefined));
    },
    [props.onResourceContentRequest]
  );

  const onResourceListRequest = useCallback(
    (request: ResourceListRequest) => {
      if (props.onResourceListRequest) {
        return props.onResourceListRequest(request);
      }
      return Promise.resolve(new ResourcesList(request.pattern, []));
    },
    [props.onResourceListRequest]
  );

  return (
    <EmbeddedEditor
      file={props.file}
      envelopeMapping={props.envelopeMapping}
      editorEnvelopeLocator={props.editorEnvelopeLocator}
      channelType={props.channelType}
      onResourceContentRequest={onResourceContentRequest}
      onResourceListRequest={onResourceListRequest}
      onSetContentError={noop}
      onReady={noop}
      onEditorUndo={noop}
      onEditorRedo={noop}
      onOpenFile={noop}
      onNewEdit={noop}
    />
  );
};
