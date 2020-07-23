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

import { ApiDefinition } from "@kogito-tooling/microeditor-envelope-protocol";
import { EditorEnvelopeView } from "./editor/EditorEnvelopeView";
import { EnvelopeContextType } from "@kogito-tooling/editor-api";
import { EnvelopeBusController } from "./EnvelopeBusController";

export interface EnvelopeApiFactoryArgs<
  ApiToProvide extends ApiDefinition<ApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>
> {
  view: EditorEnvelopeView; //FIXME: This should be generic
  envelopeContext: EnvelopeContextType; //FIXME: This should be generic
  envelopeBusController: EnvelopeBusController<ApiToProvide, ApiToConsume>;
}

export interface EnvelopeApiFactory<
  ApiToProvide extends ApiDefinition<ApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>
> {
  createNew<T extends ApiToProvide & ApiDefinition<T>>(args: EnvelopeApiFactoryArgs<T, ApiToConsume>): ApiToProvide;
}
