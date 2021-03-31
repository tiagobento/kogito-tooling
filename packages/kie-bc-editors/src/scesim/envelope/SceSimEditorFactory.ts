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

import { SceSimEditor, SceSimEditorImpl } from "./SceSimEditor";
import { SceSimEditorChannelApi } from "../api";
import { editors, GwtEditorWrapperFactory, GwtLanguageData } from "../../common";
import { EditorFactory, EditorInitArgs, KogitoEditorEnvelopeContextType } from "@kogito-tooling/editor/dist/api";

export class SceSimEditorFactory implements EditorFactory<SceSimEditor, SceSimEditorChannelApi> {
  public createEditor(
    envelopeContext: KogitoEditorEnvelopeContextType<SceSimEditorChannelApi>,
    initArgs: EditorInitArgs
  ): Promise<SceSimEditor> {
    const languageData = this.getSceSimLanguageData(initArgs);
    const gwtEditorWrapperFactory = new GwtEditorWrapperFactory<SceSimEditor>(
      languageData,
      self =>
        new SceSimEditorImpl(
          languageData.editorId,
          self.gwtAppFormerApi.getEditor(languageData.editorId),
          envelopeContext.channelApi,
          self.xmlFormatter,
          self.gwtStateControlService,
          self.kieBcEditorsI18n
        )
    );

    return gwtEditorWrapperFactory.createEditor(envelopeContext, initArgs);
  }
  public getSceSimLanguageData(editorInitArgs: EditorInitArgs): GwtLanguageData {
    return {
      type: "gwt",
      editorId: editors.scesim.id,
      gwtModuleName: editors.scesim.name,
      resources: [
        {
          type: "css",
          paths: [`${editorInitArgs.resourcesPathPrefix}/${editors.scesim.name}/css/patternfly.min.css`]
        },
        {
          type: "js",
          paths: [
            `${editorInitArgs.resourcesPathPrefix}/model/Jsonix-all.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/DC.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/DI.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/DMNDI12.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/DMN12.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/KIE.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/MainJs.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/SCESIM.js`,
            `${editorInitArgs.resourcesPathPrefix}/model/SCESIMMainJs.js`,
            `${editorInitArgs.resourcesPathPrefix}/${editors.scesim.name}/${editors.scesim.name}.nocache.js`
          ]
        }
      ]
    };
  }
}
