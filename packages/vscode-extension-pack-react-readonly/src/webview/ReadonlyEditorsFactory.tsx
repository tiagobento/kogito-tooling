/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
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
import * as AppFormer from "appformer-js-core";
import * as MicroEditorEnvelope from "appformer-js-microeditor-envelope";
import { ReadonlyEditorsLanguageData } from "../common/ReadonlyEditorsLanguageData";

export class ReadonlyEditorsFactory implements MicroEditorEnvelope.EditorFactory<ReadonlyEditorsLanguageData> {
  public createEditor(languageData: ReadonlyEditorsLanguageData): Promise<AppFormer.Editor> {
    switch (languageData.type) {
      case "react":
        return Promise.resolve(new ReactReadonlyAppFormerEditor());
      default:
        throw new Error("Only react editors are supported on this extension.");
    }
  }
}

class ReactReadonlyAppFormerEditor extends AppFormer.Editor {
  private self: ReactReadonlyEditor;

  constructor() {
    super("readonly-react-editor");
    this.af_isReact = true;
  }

  public getContent(): Promise<string> {
    return this.self.getContent();
  }

  public isDirty(): boolean {
    return false;
  }

  public setContent(content: string): Promise<void> {
    return this.self.setContent(content);
  }

  public af_componentRoot(): AppFormer.Element {
    return <ReactReadonlyEditor exposing={s => (this.self = s)} />;
  }
}

interface Props {
  exposing: (s: ReactReadonlyEditor) => void;
}

interface State {
  content: string;
}

class ReactReadonlyEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    props.exposing(this);
    this.state = {
      content: ""
    };
  }

  public setContent(content: string) {
    return new Promise<void>(res => this.setState({ content: content }, res));
  }

  public getContent() {
    return Promise.resolve(this.state.content);
  }

  public render() {
    return (
      <div>
        <h1> This is the content: </h1>
        <br />

        <p>{this.state.content}</p>
      </div>
    );
  }
}
