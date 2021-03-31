/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
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
  EditorFactory,
  EditorInitArgs,
  KogitoEditorChannelApi,
  KogitoEditorEnvelopeApi,
  KogitoEditorEnvelopeContextType
} from "@kogito-tooling/editor/dist/api";
import { EditorEnvelopeViewApi, KogitoEditorEnvelopeApiImpl } from "@kogito-tooling/editor/dist/envelope";
import { EnvelopeApiFactoryArgs } from "@kogito-tooling/envelope";
import { editors, GwtEditorWrapper, GwtEditorWrapperFactory, GwtLanguageData } from "../common";

export interface BpmnEditor extends GwtEditorWrapper {
  myBpmnMethod(): string;
}

class BpmnEditorImpl extends GwtEditorWrapper implements BpmnEditor {
  public myBpmnMethod() {
    return "bpmn-method-return";
  }
}

export interface BpmnEditorEnvelopeApi extends KogitoEditorEnvelopeApi {
  myBpmnEnvelopeMethod(): Promise<string>;
}

export interface BpmnEditorChannelApi extends KogitoEditorChannelApi {
  myBpmnChannelMethod(): void;
}

class BpmnEditorFactory implements EditorFactory<BpmnEditor, BpmnEditorChannelApi> {
  public createEditor(
    envelopeContext: KogitoEditorEnvelopeContextType<BpmnEditorChannelApi>,
    initArgs: EditorInitArgs
  ): Promise<BpmnEditor> {
    const languageData = this.getBpmnLanguageData(initArgs);
    return new GwtEditorWrapperFactory<BpmnEditor>(languageData, self => {
      return this.newBpmnEditor(languageData, self, envelopeContext);
    }).createEditor(envelopeContext, initArgs);
  }

  private newBpmnEditor(
    languageData: GwtLanguageData,
    gwtEditorWrapperFactory: GwtEditorWrapperFactory<BpmnEditor>,
    envelopeContext: KogitoEditorEnvelopeContextType<BpmnEditorChannelApi>
  ) {
    return new BpmnEditorImpl(
      languageData.editorId,
      gwtEditorWrapperFactory.gwtAppFormerApi.getEditor(languageData.editorId),
      envelopeContext.channelApi,
      gwtEditorWrapperFactory.xmlFormatter,
      gwtEditorWrapperFactory.gwtStateControlService,
      gwtEditorWrapperFactory.kieBcEditorsI18n
    );
  }

  public getBpmnLanguageData(editorInitArgs: EditorInitArgs): GwtLanguageData {
    return {
      type: "gwt",
      editorId: editors.bpmn.id,
      gwtModuleName: editors.bpmn.name,
      resources: [
        {
          type: "css",
          paths: [`${editorInitArgs.resourcesPathPrefix}/${editors.bpmn.name}/css/patternfly.min.css`]
        },
        {
          type: "js",
          paths: [`${editorInitArgs.resourcesPathPrefix}/${editors.bpmn.name}/${editors.bpmn.name}.nocache.js`]
        }
      ]
    };
  }
}

export type BpmnEnvelopeApiFactoryArgs = EnvelopeApiFactoryArgs<
  BpmnEditorEnvelopeApi,
  BpmnEditorChannelApi,
  EditorEnvelopeViewApi<BpmnEditor>,
  KogitoEditorEnvelopeContextType<BpmnEditorChannelApi>
>;

export class BpmnEditorEnvelopeApiImpl
  extends KogitoEditorEnvelopeApiImpl<BpmnEditor, BpmnEditorEnvelopeApi, BpmnEditorChannelApi>
  implements BpmnEditorEnvelopeApi {
  constructor(private readonly bpmnArgs: BpmnEnvelopeApiFactoryArgs) {
    super(bpmnArgs, new BpmnEditorFactory());
  }

  public myBpmnEnvelopeMethod() {
    this.bpmnArgs.envelopeContext.channelApi.notifications.myBpmnChannelMethod();
    const editor = this.bpmnArgs.view().getEditor();
    const ret = editor?.myBpmnMethod() ?? "bpmn-return--default";
    return Promise.resolve(ret);
  }
}
