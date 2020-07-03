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

import {
  EnvelopeBusMessage,
  EnvelopeBusMessagePurpose,
  KogitoChannelApi,
  KogitoChannelBus,
  KogitoEnvelopeMessageTypes
} from "../..";
import { ContentType, ResourceContent, StateControlCommand } from "@kogito-tooling/core-api";

let sentMessages: Array<EnvelopeBusMessage<unknown, any>>;
let channelBus: KogitoChannelBus;
let api: KogitoChannelApi;

beforeEach(() => {
  sentMessages = [];
  api = {
    receive_setContentError: jest.fn(),
    receive_ready: jest.fn(),
    receive_newEdit: jest.fn(),
    receive_openFile: jest.fn(),
    receive_stateControlCommandUpdate: jest.fn(),
    receive_guidedTourUserInteraction: jest.fn(),
    receive_guidedTourRegisterTutorial: jest.fn(),
    receive_languageRequest: jest.fn(),
    receive_contentRequest: jest.fn(),
    receive_resourceContentRequest: jest.fn(),
    receive_resourceListRequest: jest.fn()
  };

  channelBus = new KogitoChannelBus({ postMessage: msg => sentMessages.push(msg) }, api);
});

const delay = (ms: number) => {
  return new Promise(res => Promise.resolve().then(() => setTimeout(res, ms)));
};

describe("new instance", () => {
  test("does nothing", () => {
    expect(channelBus.initPolling).toBeFalsy();
    expect(channelBus.initPollingTimeout).toBeFalsy();
    expect(sentMessages.length).toEqual(0);
  });
});

describe("startInitPolling", () => {
  test("polls for init response", async () => {
    jest.spyOn(channelBus, "stopInitPolling");
    jest.spyOn(channelBus.manager, "generateRandomId").mockReturnValueOnce("reqId");

    channelBus.startInitPolling("tests");
    expect(channelBus.initPolling).toBeTruthy();
    expect(channelBus.initPollingTimeout).toBeTruthy();

    await delay(100); //waits for setInterval to kick in

    await incomingMessage({
      busId: channelBus.busId,
      requestId: "reqId",
      type: "receive_initRequest",
      purpose: EnvelopeBusMessagePurpose.RESPONSE,
      data: undefined
    });

    expect(channelBus.stopInitPolling).toHaveBeenCalled();
    expect(channelBus.initPolling).toBeFalsy();
    expect(channelBus.initPollingTimeout).toBeFalsy();
  });

  test("stops polling after timeout", async () => {
    jest.spyOn(channelBus, "stopInitPolling");
    KogitoChannelBus.INIT_POLLING_TIMEOUT_IN_MS = 200;

    channelBus.startInitPolling("tests");
    expect(channelBus.initPolling).toBeTruthy();
    expect(channelBus.initPollingTimeout).toBeTruthy();

    //more than the timeout
    await delay(300);

    expect(channelBus.stopInitPolling).toHaveBeenCalled();
    expect(channelBus.initPolling).toBeFalsy();
    expect(channelBus.initPollingTimeout).toBeFalsy();
  });
});

describe("receive", () => {
  test("any message with different busId", () => {
    channelBus.receive({
      busId: "unknown-id",
      purpose: EnvelopeBusMessagePurpose.REQUEST,
      requestId: "any",
      type: "receive_languageRequest",
      data: []
    });
    channelBus.receive({
      busId: "unknown-id",
      purpose: EnvelopeBusMessagePurpose.REQUEST,
      requestId: "any",
      type: "receive_contentRequest",
      data: []
    });
  });

  test("setContentError notification", async () => {
    jest.spyOn(api, "receive_setContentError");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_setContentError",
      data: ["this is the error"]
    });
    expect(api.receive_setContentError).toHaveBeenCalledWith("this is the error");
  });

  test("ready notification", async () => {
    jest.spyOn(api, "receive_ready");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_ready",
      data: []
    });
    expect(api.receive_ready).toHaveBeenCalledWith();
  });

  test("newEdit notification", async () => {
    jest.spyOn(api, "receive_newEdit");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_newEdit",
      data: [{ id: "edit-id" }]
    });
    expect(api.receive_newEdit).toHaveBeenCalledWith({ id: "edit-id" });
  });
  test("openFile notification", async () => {
    jest.spyOn(api, "receive_openFile");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_openFile",
      data: ["a/path"]
    });
    expect(api.receive_openFile).toHaveBeenCalledWith("a/path");
  });
  test("stateControlCommandUpdate notification", async () => {
    jest.spyOn(api, "receive_stateControlCommandUpdate");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_stateControlCommandUpdate",
      data: [StateControlCommand.REDO]
    });
    expect(api.receive_stateControlCommandUpdate).toHaveBeenCalledWith(StateControlCommand.REDO);
  });

  test("guidedTourRegisterTutorial notification", async () => {
    jest.spyOn(api, "receive_guidedTourRegisterTutorial");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_guidedTourRegisterTutorial",
      data: []
    });
    expect(api.receive_guidedTourRegisterTutorial).toHaveBeenCalledWith();
  });

  test("guidedTourUserInteraction notification", async () => {
    jest.spyOn(api, "receive_guidedTourUserInteraction");
    channelBus.receive({
      busId: channelBus.busId,
      purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
      type: "receive_guidedTourUserInteraction",
      data: []
    });
    expect(api.receive_guidedTourUserInteraction).toHaveBeenCalledWith();
  });

  test("language request", async () => {
    const languageData = { type: "a-language" };

    jest.spyOn(api, "receive_languageRequest").mockReturnValueOnce(Promise.resolve(languageData));

    await incomingMessage({
      busId: channelBus.busId,
      requestId: "requestId",
      purpose: EnvelopeBusMessagePurpose.REQUEST,
      type: "receive_languageRequest",
      data: []
    });

    expect(api.receive_languageRequest).toHaveBeenCalledWith();
    expect(sentMessages).toEqual([
      {
        requestId: "requestId",
        purpose: EnvelopeBusMessagePurpose.RESPONSE,
        type: "receive_languageRequest",
        data: languageData
      }
    ]);
  });

  test("content request", async () => {
    const content = { content: "the language", path: "the path" };

    jest.spyOn(api, "receive_contentRequest").mockReturnValueOnce(Promise.resolve(content));

    await incomingMessage({
      busId: channelBus.busId,
      requestId: "requestId",
      purpose: EnvelopeBusMessagePurpose.REQUEST,
      type: "receive_contentRequest",
      data: []
    });

    expect(api.receive_contentRequest).toHaveBeenCalledWith();
    expect(sentMessages).toEqual([
      {
        requestId: "requestId",
        purpose: EnvelopeBusMessagePurpose.RESPONSE,
        type: "receive_contentRequest",
        data: content
      }
    ]);
  });

  test("resourceContent request", async () => {
    const resourceContent = new ResourceContent("a/path", "the content", ContentType.TEXT);
    const resourceContentRequest = { path: "a/path", opts: { type: ContentType.TEXT } };

    jest.spyOn(api, "receive_resourceContentRequest").mockReturnValueOnce(Promise.resolve(resourceContent));

    await incomingMessage({
      busId: channelBus.busId,
      requestId: "requestId",
      purpose: EnvelopeBusMessagePurpose.REQUEST,
      type: "receive_resourceContentRequest",
      data: [resourceContentRequest]
    });

    expect(api.receive_resourceContentRequest).toHaveBeenCalledWith(resourceContentRequest);
    expect(sentMessages).toEqual([
      {
        requestId: "requestId",
        purpose: EnvelopeBusMessagePurpose.RESPONSE,
        type: "receive_resourceContentRequest",
        data: resourceContent
      }
    ]);
  });

  test("resourceList request", async () => {
    const resourceList = { pattern: "*", paths: ["a/resource/file.txt"] };
    const resourceListRequest = { path: "a/path", opts: { type: ContentType.TEXT } };

    jest.spyOn(api, "receive_resourceListRequest").mockReturnValueOnce(Promise.resolve(resourceList));

    await incomingMessage({
      busId: channelBus.busId,
      requestId: "requestId",
      purpose: EnvelopeBusMessagePurpose.REQUEST,
      type: "receive_resourceListRequest",
      data: [resourceListRequest]
    });

    expect(api.receive_resourceListRequest).toHaveBeenCalledWith(resourceListRequest);
    expect(sentMessages).toEqual([
      {
        requestId: "requestId",
        purpose: EnvelopeBusMessagePurpose.RESPONSE,
        type: "receive_resourceListRequest",
        data: resourceList
      }
    ]);
  });
});

describe("send", () => {
  test("request init", async () => {
    jest.spyOn(channelBus.manager, "generateRandomId").mockReturnValueOnce("1");
    const init = channelBus.request_initResponse("test-origin");
    expect(sentMessages).toEqual([
      {
        purpose: EnvelopeBusMessagePurpose.REQUEST,
        requestId: "1",
        type: "receive_initRequest",
        data: [{ busId: channelBus.busId, origin: "test-origin" }]
      }
    ]);

    await incomingMessage({
      busId: channelBus.busId,
      requestId: "1",
      type: "receive_initRequest",
      purpose: EnvelopeBusMessagePurpose.RESPONSE,
      data: undefined
    });

    expect(await init).toStrictEqual(undefined);
  });

  test("request contentResponse", async () => {
    jest.spyOn(channelBus.manager, "generateRandomId").mockReturnValueOnce("1");
    const content = channelBus.request_contentResponse();
    await incomingMessage({
      busId: channelBus.busId,
      requestId: "1",
      type: "receive_contentRequest",
      purpose: EnvelopeBusMessagePurpose.RESPONSE,
      data: { content: "the content", path: "the/path/" }
    });

    expect(await content).toStrictEqual({ content: "the content", path: "the/path/" });
  });

  test("request preview", async () => {
    jest.spyOn(channelBus.manager, "generateRandomId").mockReturnValueOnce("1");
    const preview = channelBus.request_previewResponse();
    await incomingMessage({
      busId: channelBus.busId,
      requestId: "1",
      type: "receive_previewRequest",
      purpose: EnvelopeBusMessagePurpose.RESPONSE,
      data: "the-svg-string"
    });

    expect(await preview).toStrictEqual("the-svg-string");
  });

  test("request guidedTourElementPositionResponse", async () => {
    jest.spyOn(channelBus.manager, "generateRandomId").mockReturnValueOnce("1");
    const position = channelBus.request_guidedTourElementPositionResponse("my-selector");
    await incomingMessage({
      busId: channelBus.busId,
      requestId: "1",
      type: "receive_guidedTourElementPositionRequest",
      purpose: EnvelopeBusMessagePurpose.RESPONSE,
      data: {}
    });

    expect(await position).toStrictEqual({});
  });

  test("notify contentChanged", () => {
    channelBus.notify_contentChanged({ content: "new-content" });
    expect(sentMessages).toEqual([
      {
        type: "receive_contentChanged",
        purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
        data: [{ content: "new-content" }]
      }
    ]);
  });

  test("notify editorUndo", () => {
    channelBus.notify_editorUndo();
    expect(sentMessages).toEqual([
      {
        type: "receive_editorUndo",
        purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
        data: []
      }
    ]);
  });

  test("notify editorRedo", () => {
    channelBus.notify_editorRedo();
    expect(sentMessages).toEqual([
      {
        type: "receive_editorRedo",
        purpose: EnvelopeBusMessagePurpose.NOTIFICATION,
        data: []
      }
    ]);
  });
});

async function incomingMessage(message: EnvelopeBusMessage<unknown, KogitoEnvelopeMessageTypes>) {
  channelBus.receive(message);
  await delay(0); // waits for next event loop iteration
}
