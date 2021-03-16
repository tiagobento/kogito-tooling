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
  ApiDefinition,
  EnvelopeBus,
  EnvelopeBusMessage,
  EnvelopeBusMessagePurpose,
  FunctionPropertyNames
} from "../api";
import { EnvelopeBusMessageManager } from "../common";

export class EnvelopeBusController<
  ApiToProvide extends ApiDefinition<ApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>
> {
  public targetOrigin?: string;
  public associatedEnvelopeServerId?: string;
  public eventListener?: any;
  public readonly manager: EnvelopeBusMessageManager<ApiToProvide, ApiToConsume>;

  public get channelApi() {
    return this.manager.clientApi;
  }

  constructor(
    private readonly bus: EnvelopeBus,
    private readonly envelopeId?: string
  ) {
    this.manager = new EnvelopeBusMessageManager(message => this.send(message), "KogitoEnvelopeBus");
  }

  public associate(origin: string, envelopeServerId: string) {
    this.targetOrigin = origin;
    this.associatedEnvelopeServerId = envelopeServerId;
  }

  public startListening(apiImpl: ApiToProvide) {
    if (this.eventListener) {
      return;
    }

    this.eventListener = (event: any) => this.receive(event.data, apiImpl);
    window.addEventListener("message", this.eventListener);
  }

  public stopListening() {
    window.removeEventListener("message", this.eventListener);
  }

  public send<T>(
    message: EnvelopeBusMessage<T, FunctionPropertyNames<ApiToProvide> | FunctionPropertyNames<ApiToConsume>>
  ) {
    if (!this.targetOrigin || !this.associatedEnvelopeServerId) {
      throw new Error("Tried to send message without associated Envelope Server set");
    }
    this.bus.postMessage({ ...message, targetEnvelopeServerId: this.associatedEnvelopeServerId }, this.targetOrigin);
  }

  public receive(
    message: EnvelopeBusMessage<any, FunctionPropertyNames<ApiToProvide> | FunctionPropertyNames<ApiToConsume>>,
    apiImpl: ApiToProvide
  ) {
    if (this.envelopeId && this.envelopeId !== message.targetEnvelopeId) {
      // When an envelopeId is defined, the message should be ignored if it contains a different targetEnvelopeId
      return;
    }

    if (!message.targetEnvelopeServerId) {
      // Message was sent directly from the Channel to this Envelope
      this.manager.server.receive(message, apiImpl);
    } else if (message.targetEnvelopeServerId && message.purpose === EnvelopeBusMessagePurpose.NOTIFICATION) {
      // Message was redirected by the Channel from another Envelope
      this.manager.server.receive(message, {} as any);
    }
  }
}
