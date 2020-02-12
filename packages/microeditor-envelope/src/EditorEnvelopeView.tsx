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
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import * as AppFormer from "@kogito-tooling/core-api";
import { LoadingScreen } from "./LoadingScreen";
import { KeyBindingService } from "./DefaultKeyBindingService";

interface Props {
  exposing: (self: EditorEnvelopeView) => void;
  loadingScreenContainer: HTMLElement;
  keyBindingService: KeyBindingService;
}

interface State {
  editor?: AppFormer.Editor;
  loading: boolean;
}

export class EditorEnvelopeView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { editor: undefined, loading: true };
    this.props.exposing(this);
  }

  public getEditor() {
    return this.state.editor;
  }

  public setEditor(editor: AppFormer.Editor) {
    return new Promise(res => this.setState({ editor: editor }, res));
  }

  public setLoadingFinished() {
    return new Promise(res => this.setState({ loading: false }, res));
  }

  public setLoading() {
    return this.setState({ loading: true });
  }

  private LoadingScreenPortal() {
    return ReactDOM.createPortal(<LoadingScreen visible={this.state.loading} />, this.props.loadingScreenContainer!);
  }

  public render() {
    return (
      <>
        <KeyBindingsMenuHelp keyBindingService={this.props.keyBindingService} />
        {this.LoadingScreenPortal()}
        {this.state.editor && this.state.editor.af_isReact && this.state.editor.af_componentRoot()}
      </>
    );
  }
}

function KeyBindingsMenuHelp(props: { keyBindingService: KeyBindingService }) {
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    const id = props.keyBindingService.register("shift+/", "Show keyboard shortcuts", async () => setShowing(true));
    return () => props.keyBindingService.deregister(id);
  }, []);

  useEffect(() => {
    let id: number;
    if (showing) {
      id = props.keyBindingService.registerOnce("esc", async () => setShowing(false));
    }
    return () => {
      if (showing) {
        props.keyBindingService.deregister(id);
      }
    };
  }, [showing]);

  return (
    <>
      <div
        onClick={() => setShowing(!showing)}
        style={{
          userSelect: "none",
          zIndex: 999,
          right: 0,
          bottom: 0,
          position: "fixed",
          padding: "7px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "35px",
          height: "35px",
          fontSize: "1.2em",
          cursor: "pointer"
        }}
      >
        <b>{showing ? "x" : "?"}</b>
      </div>
      {showing && (
        <div
          style={{
            userSelect: "none",
            zIndex: 998,
            top: 0,
            left: 0,
            position: "fixed",
            width: "100vw",
            height: "100vh",
            padding: "40px",
            backdropFilter: "blur(5px)",
            background: "#cacacaa6"
          }}
        >
          <h1>Keyboard shortcuts</h1>
          {props.keyBindingService.registered().map(keyBinding => (
            <h5 key={keyBinding.combination}>
              {keyBinding.combination
                .split("+")
                .map(w => w.replace(/^\w/, c => c.toUpperCase()))
                .join(" + ")}{" "}
              - {keyBinding.label}
            </h5>
          ))}
        </div>
      )}
    </>
  );
}
