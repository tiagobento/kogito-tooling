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

export interface DmnEditor extends GwtEditorWrapper {
  myDmnMethod(): string;
}

class DmnEditorImpl extends GwtEditorWrapper implements DmnEditor {
  public myDmnMethod() {
    return "dmn-method-return";
  }
}

export interface DmnEditorEnvelopeApi extends KogitoEditorEnvelopeApi {
  myDmnEnvelopeMethod(): Promise<string>;
}

export interface DmnEditorChannelApi extends KogitoEditorChannelApi {
  myDmnChannelMethod(): void;
}

class DmnEditorFactory implements EditorFactory<DmnEditor, DmnEditorChannelApi> {
  public createEditor(
    envelopeContext: KogitoEditorEnvelopeContextType<DmnEditorChannelApi>,
    initArgs: EditorInitArgs
  ): Promise<DmnEditor> {
    const languageData = this.getDmnLanguageData(initArgs);
    return new GwtEditorWrapperFactory<DmnEditor>(languageData, self => {
      return this.newDmnEditor(languageData, self, envelopeContext);
    }).createEditor(envelopeContext, initArgs);
  }

  private newDmnEditor(
    languageData: GwtLanguageData,
    gwtEditorWrapperFactory: GwtEditorWrapperFactory<DmnEditor>,
    envelopeContext: KogitoEditorEnvelopeContextType<DmnEditorChannelApi>
  ) {
    return new DmnEditorImpl(
      languageData.editorId,
      gwtEditorWrapperFactory.gwtAppFormerApi.getEditor(languageData.editorId),
      envelopeContext.channelApi,
      gwtEditorWrapperFactory.xmlFormatter,
      gwtEditorWrapperFactory.gwtStateControlService,
      gwtEditorWrapperFactory.kieBcEditorsI18n
    );
  }

  public getDmnLanguageData(editorInitArgs: EditorInitArgs): GwtLanguageData {
    return {
      type: "gwt",
      editorId: editors.dmn.id,
      gwtModuleName: editors.dmn.name,
      resources: [
        {
          type: "css",
          paths: [`${editorInitArgs.resourcesPathPrefix}/${editors.dmn.name}/css/patternfly.min.css`]
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
            `${editorInitArgs.resourcesPathPrefix}/${editors.dmn.name}/${editors.dmn.name}.nocache.js`
          ]
        }
      ]
    };
  }
}

export type DmnEnvelopeApiFactoryArgs = EnvelopeApiFactoryArgs<
  DmnEditorEnvelopeApi,
  DmnEditorChannelApi,
  EditorEnvelopeViewApi<DmnEditor>,
  KogitoEditorEnvelopeContextType<DmnEditorChannelApi>
>;

export class DmnEditorEnvelopeApiImpl
  extends KogitoEditorEnvelopeApiImpl<DmnEditor, DmnEditorEnvelopeApi, DmnEditorChannelApi>
  implements DmnEditorEnvelopeApi {
  constructor(private readonly dmnArgs: DmnEnvelopeApiFactoryArgs) {
    super(dmnArgs, new DmnEditorFactory());
  }

  public myDmnEnvelopeMethod() {
    this.dmnArgs.envelopeContext.channelApi.notifications.myDmnChannelMethod();
    const editor = this.dmnArgs.view().getEditor();
    const ret = editor?.myDmnMethod() ?? "dmn-return--default";
    return Promise.resolve(ret);
  }
}
