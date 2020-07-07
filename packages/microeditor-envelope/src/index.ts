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

import { EditorContext } from "@kogito-tooling/core-api";
import { DefaultKeyboardShortcutsService, KeyboardShortcutsApi } from "@kogito-tooling/keyboard-shortcuts";
import { EnvelopeBus } from "@kogito-tooling/microeditor-envelope-protocol";
import { ReactElement } from "react";
import * as ReactDOM from "react-dom";
import { EditorEnvelopeController } from "./EditorEnvelopeController";
import { EditorFactory } from "./EditorFactory";
import { Renderer } from "./Renderer";
import { SpecialDomElements } from "./SpecialDomElements";
import { ResourceContentOptions, ResourceListOptions } from "@kogito-tooling/workspace-service-api";
import { KogitoGuidedTour, Tutorial, UserInteraction } from "@kogito-tooling/guided-tour";

export { EditorEnvelopeController } from "./EditorEnvelopeController";
export * from "./EditorFactory";
export * from "./KogitoEnvelopeBus";
export { SpecialDomElements } from "./SpecialDomElements";

//FIXME: tiago Move this to kie-bc-editors
declare global {
  interface Window {
    envelope: {
      guidedTourService: {
        refresh(userInteraction: UserInteraction): void;
        registerTutorial(tutorial: Tutorial): void;
        isEnabled(): boolean;
      };
      editorContext: EditorContext;
      resourceContentEditorService: {
        get(path: string, opts?: ResourceContentOptions): Promise<string | undefined>;
        list(pattern: string, opts?: ResourceListOptions): Promise<string[]>;
      };
      keyboardShortcuts: KeyboardShortcutsApi;
      workspaceService: {
        openFile(path: string): void;
      };
    };
  }
}

class ReactDomRenderer implements Renderer {
  public render(element: ReactElement, container: HTMLElement, callback: () => void) {
    setTimeout(() => {
      ReactDOM.render(element, container, callback);
    }, 0);
  }
}

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
  const specialDomElements = new SpecialDomElements();
  const renderer = new ReactDomRenderer();
  const keyboardShortcutsService = new DefaultKeyboardShortcutsService({ editorContext: args.editorContext });
  const editorEnvelopeController = new EditorEnvelopeController(
    args.bus,
    args.editorFactory,
    specialDomElements,
    renderer,
    keyboardShortcutsService
  );

  return (
    editorEnvelopeController
      .start({ container: args.container, context: args.editorContext })
      //FIXME: tiago Move this to kie-bc-editors
      .then(messageBus => {
        window.envelope = {
          guidedTourService: {
            refresh(userInteraction: UserInteraction): void {
              messageBus.notify_guidedTourRefresh(userInteraction);
            },
            registerTutorial(tutorial: Tutorial): void {
              messageBus.notify_guidedTourRegisterTutorial(tutorial);
            },
            isEnabled(): boolean {
              return KogitoGuidedTour.getInstance().isEnabled();
            }
          },
          resourceContentEditorService: {
            get(path: string, opts?: ResourceContentOptions) {
              return messageBus.request_resourceContent(path, opts);
            },
            list(pattern: string, opts?: ResourceListOptions) {
              return messageBus.request_resourceList(pattern, opts);
            }
          },
          editorContext: args.editorContext,
          keyboardShortcuts: keyboardShortcutsService.exposeApi(),
          workspaceService: {
            openFile(path: string): void {
              messageBus.notify_openFile(path);
            }
          }
        };
      })
  );
}
