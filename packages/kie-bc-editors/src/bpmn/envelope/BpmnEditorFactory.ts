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

import { GwtEditorWrapperFactory, GwtLanguageData } from "../../common";
import { BpmnEditorChannelApi, getBpmnLanguageData } from "../api";
import { EditorFactory, EditorInitArgs, KogitoEditorEnvelopeContextType } from "@kogito-tooling/editor/dist/api";
import { BpmnEditor, BpmnEditorImpl } from "./BpmnEditor";

export class BpmnEditorFactory implements EditorFactory<BpmnEditor, BpmnEditorChannelApi> {
  constructor(private readonly gwtEditorEnvelopeConfig: { shouldLoadResourcesDynamically: boolean }) {}

  public createEditor(
    envelopeContext: KogitoEditorEnvelopeContextType<BpmnEditorChannelApi>,
    initArgs: EditorInitArgs
  ): Promise<BpmnEditor> {
    const languageData = getBpmnLanguageData(initArgs.resourcesPathPrefix);
    return new GwtEditorWrapperFactory<BpmnEditor>(
      languageData,
      self => {
        return this.newBpmnEditor(languageData, self, envelopeContext);
      },
      this.gwtEditorEnvelopeConfig
    ).createEditor(envelopeContext, initArgs);
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
}
