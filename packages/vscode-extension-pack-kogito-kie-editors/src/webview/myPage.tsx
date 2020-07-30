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

import { PageApi, PageFactory } from "@kogito-tooling/page-envelope";
import { KogitoPageChannelApi, PageInitArgs, SvgDiagram } from "@kogito-tooling/page-envelope-protocol";
import { MessageBusClient } from "@kogito-tooling/envelope-bus";
import * as React from "react";
import { useCallback, useEffect, useImperativeHandle, useState } from "react";

// tslint:disable-next-line:no-empty-interface
export interface MyPageRef extends PageApi {}

export class MyPageFactory implements PageFactory {
  public create(initArgs: PageInitArgs, channelApi: MessageBusClient<KogitoPageChannelApi>) {
    const ref = React.createRef<MyPageRef>();
    return {
      setText: (text: string) => ref.current!.setText(text),
      af_componentRoot: () => {
        return <MyPage initArgs={initArgs} channelApi={channelApi} ref={ref} />;
      }
    };
  }
}

interface Props {
  initArgs: PageInitArgs;
  channelApi: MessageBusClient<KogitoPageChannelApi>;
}

export const MyPage = React.forwardRef<MyPageRef, Props>((props, forwardedRef) => {
  const [text, setText] = useState<string>();
  const [files, setFiles] = useState<string[]>([]);
  const [diagramSvgs, setDiagramSvgs] = useState<SvgDiagram[]>([]);

  useImperativeHandle(forwardedRef, () => ({ setText }), []);

  useEffect(() => {
    const requestOpenDiagrams = async () => {
      const svgs = await props.channelApi.request("getOpenDiagrams");
      setDiagramSvgs(svgs);
    };

    props.channelApi.subscribe("receive_ready", () => {
      requestOpenDiagrams();
    });

    props.channelApi.subscribe("receive_newEdit", requestOpenDiagrams);

    props.channelApi.request("receive_resourceListRequest", { pattern: "**" }).then(f => {
      setFiles(f.paths);
    });

    requestOpenDiagrams();
  }, []);

  const openFile = useCallback((path: string) => {
    props.channelApi.notify("receive_openFile", path);
  }, []);

  return (
    <>
      {props.initArgs.filePath && (
        <>
          <p>
            <b>The following file was open when this Page was open:</b>
          </p>
          <p>{props.initArgs.filePath}</p>
          <br />
          <br />
        </>
      )}
      {text && (
        <>
          <p>
            <b>This is the text set by default by the Envelope:</b>
          </p>
          <p>
            <i>"{text}"</i>
          </p>
          <br />
          <br />
        </>
      )}
      {files.length > 0 && (
        <>
          <p>
            <b>Files on workspace:</b>
          </p>
          <ul>
            {files.map(path => (
              <li key={path}>
                {path} <button onClick={() => openFile(path)}>Open</button>
              </li>
            ))}
          </ul>
          <br />
          <br />
        </>
      )}
      {diagramSvgs.length > 0 && (
        <>
          <p>
            <b>Open diagrams:</b>
          </p>
          {diagramSvgs.map(svg => {
            const url = URL.createObjectURL(new Blob([svg.img], { type: "image/svg+xml" }));
            return (
              <>
                <div style={{ background: "white", border: "1px solid black" }} key={svg.path}>
                  <p style={{ fontSize: "0.8em", color: "black" }}>{svg.path}</p>
                  <img style={{ height: "100px" }} src={url} onLoad={() => URL.revokeObjectURL(url)} />
                </div>
                <br />
              </>
            );
          })}
        </>
      )}
    </>
  );
});
