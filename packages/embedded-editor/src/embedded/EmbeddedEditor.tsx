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
  KogitoChannelApi,
  KogitoChannelBus,
  KogitoEdit,
  ResourceContent,
  ResourceContentRequest,
  ResourceListRequest,
  ResourcesList,
  StateControlCommand,
  Tutorial,
  useConnectedKogitoChannelBus,
  UserInteraction
} from "@kogito-tooling/microeditor-envelope-protocol";
import { useSyncedKeyboardEvents } from "@kogito-tooling/keyboard-shortcuts-channel";
import { KogitoGuidedTour } from "@kogito-tooling/guided-tour";
import * as CSS from "csstype";
import * as React from "react";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { File } from "../common";
import { StateControl } from "../stateControl";
import { EditorApi } from "@kogito-tooling/editor-api";

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type ChannelApiMethodsAlreadyImplementedByEmbeddedEditor =
  | "receive_guidedTourUserInteraction"
  | "receive_guidedTourRegisterTutorial"
  | "receive_contentRequest";

type EmbeddedEditorChannelApiOverrides = Partial<
  Omit<KogitoChannelApi, ChannelApiMethodsAlreadyImplementedByEmbeddedEditor>
>;

export type Props = EmbeddedEditorChannelApiOverrides & {
  file: File;
  editorEnvelopeLocator: EditorEnvelopeLocator;
  channelType: ChannelType;
};

/**
 * Forward reference for the `EmbeddedEditor` to support consumers to call upon embedded operations.
 */
export type EmbeddedEditorRef = (EditorApi & { getStateControl(): StateControl }) | null;

const containerStyles: CSS.Properties = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  width: "100%",
  height: "100%",
  border: "none",
  margin: 0,
  padding: 0,
  overflow: "hidden"
};

const RefForwardingEmbeddedEditor: React.RefForwardingComponent<EmbeddedEditorRef, Props> = (
  props: Props,
  forwardedRef
) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stateControl = useMemo(() => new StateControl(), []);
  const envelopeMapping = useMemo(() => props.editorEnvelopeLocator.mapping.get(props.file.fileExtension), []);

  //Property functions default handling
  const onResourceContentRequest = useCallback(
    (request: ResourceContentRequest) => {
      if (props.receive_resourceContentRequest) {
        return props.receive_resourceContentRequest(request);
      }
      return Promise.resolve(new ResourceContent(request.path, undefined));
    },
    [props.receive_resourceContentRequest]
  );

  const onResourceListRequest = useCallback(
    (request: ResourceListRequest) => {
      if (props.receive_resourceListRequest) {
        return props.receive_resourceListRequest(request);
      }
      return Promise.resolve(new ResourcesList(request.pattern, []));
    },
    [props.receive_resourceListRequest]
  );

  const handleStateControlCommand = useCallback((stateControlCommand: StateControlCommand) => {
    switch (stateControlCommand) {
      case StateControlCommand.REDO:
        stateControl.redo();
        break;
      case StateControlCommand.UNDO:
        stateControl.undo();
        break;
      default:
        console.info(`Unknown message type received: ${stateControlCommand}`);
        break;
    }
    props.receive_stateControlCommandUpdate?.(stateControlCommand);
  }, []);

  //Setup envelope bus communication
  const kogitoChannelBus = useMemo(() => {
    return new KogitoChannelBus(
      {
        postMessage: message => {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(message, "*");
          }
        }
      },
      {
        receive_setContentError(errorMessage: string) {
          props.receive_setContentError?.(errorMessage);
        },
        receive_ready() {
          props.receive_ready?.();
        },
        receive_openFile: (path: string) => {
          props.receive_openFile?.(path);
        },
        receive_newEdit(edit: KogitoEdit) {
          stateControl.updateCommandStack(edit.id);
          props.receive_newEdit?.(edit);
        },
        receive_stateControlCommandUpdate(stateControlCommand: StateControlCommand) {
          handleStateControlCommand(stateControlCommand);
        },
        receive_guidedTourUserInteraction(userInteraction: UserInteraction) {
          KogitoGuidedTour.getInstance().onUserInteraction(userInteraction);
        },
        receive_guidedTourRegisterTutorial(tutorial: Tutorial) {
          KogitoGuidedTour.getInstance().registerTutorial(tutorial);
        },
        //requests
        receive_contentRequest() {
          return props.file.getFileContents().then(c => ({ content: c ?? "", path: props.file.fileName }));
        },
        receive_resourceContentRequest(request: ResourceContentRequest) {
          return onResourceContentRequest(request);
        },
        receive_resourceListRequest(request: ResourceListRequest) {
          return onResourceListRequest(request);
        }
      }
    );
  }, [
    props.file.fileExtension,
    props.file.fileName,
    props.receive_resourceContentRequest,
    props.receive_resourceListRequest,
    handleStateControlCommand
  ]);

  // Forward keyboard events to envelope
  useSyncedKeyboardEvents(kogitoChannelBus.client);

  //Attach/detach bus when component attaches/detaches from DOM
  useConnectedKogitoChannelBus(
    props.editorEnvelopeLocator.targetOrigin,
    {
      fileExtension: props.file.fileExtension,
      resourcesPathPrefix: envelopeMapping?.resourcesPathPrefix ?? ""
    },
    kogitoChannelBus
  );

  useEffect(() => {
    KogitoGuidedTour.getInstance().registerPositionProvider((selector: string) =>
      kogitoChannelBus.request_guidedTourElementPositionResponse(selector).then(position => {
        const parentRect = iframeRef.current?.getBoundingClientRect();
        KogitoGuidedTour.getInstance().onPositionReceived(position, parentRect);
      })
    );
  }, [kogitoChannelBus]);

  //Forward reference methods
  useImperativeHandle(
    forwardedRef,
    () => {
      if (!iframeRef.current) {
        return null;
      }

      return {
        getStateControl: () => stateControl,
        getElementPosition: selector => kogitoChannelBus.request_guidedTourElementPositionResponse(selector),
        redo: () => Promise.resolve(kogitoChannelBus.notify_editorRedo()),
        undo: () => Promise.resolve(kogitoChannelBus.notify_editorUndo()),
        getContent: () => kogitoChannelBus.request_contentResponse().then(c => c.content),
        getPreview: () => kogitoChannelBus.request_previewResponse(),
        setContent: async content => kogitoChannelBus.notify_contentChanged({ content: content })
      };
    },
    [kogitoChannelBus]
  );

  return (
    <>
      {!envelopeMapping && (
        <>
          <span>{`No Editor available for '${props.file.fileExtension}' extension`}</span>
        </>
      )}
      {envelopeMapping && (
        <iframe
          ref={iframeRef}
          id={"kogito-iframe"}
          data-testid={"kogito-iframe"}
          src={envelopeMapping.envelopePath}
          title="Kogito editor"
          style={containerStyles}
          data-envelope-channel={props.channelType}
        />
      )}
    </>
  );
};

export const EmbeddedEditor = React.forwardRef(RefForwardingEmbeddedEditor);
