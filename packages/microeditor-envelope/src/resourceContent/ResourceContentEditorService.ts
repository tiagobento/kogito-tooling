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

import { ResourceContent } from "@kogito-tooling/core-api";
import { ResourcesList } from "@kogito-tooling/core-api/src";
import { EnvelopeBusInnerMessageHandler } from "../EnvelopeBusInnerMessageHandler";
import {ResourceContentEditorServiceApi} from "./ResourceContentEditorServiceApi";

export class ResourceContentEditorService {
  // TODO: correct any type
  public pendingResourceRequests = new Map<string, any>();
  public pendingResourceListRequests = new Map<string, any>();

  public resolvePending(resourceContent: ResourceContent) {
    const resourceContentCallback = this.pendingResourceRequests.get(resourceContent.path);
    if (resourceContentCallback) {
      resourceContentCallback(resourceContent.content);
      this.pendingResourceRequests.delete(resourceContent.path);
    }
  }

  public resolvePendingList(resourcesList: ResourcesList) {
    const resourceListCallback = this.pendingResourceListRequests.get(resourcesList.pattern);
    if (resourceListCallback) {
      resourceListCallback(resourcesList.paths);
      this.pendingResourceRequests.delete(resourcesList.pattern);
    }
  }

  public exposed(messageBus: EnvelopeBusInnerMessageHandler) {
    return {
      get(uri: string) {
        const promise = new Promise<string>(res => {
          const previousCallback = this.pendingResourceRequests.get(uri);
          this.pendingResourceRequests.set(uri, (value: string) => {
            res(value);
            if (previousCallback) {
              previousCallback(value);
            }
          });
        });

        messageBus.request_resourceContent(uri);
        return promise;
      },

      list(pattern: string) {
        const promise = new Promise<string[]>(res => {
          const previousCallback = this.pendingResourceListRequests.get(pattern);
          this.pendingResourceListRequests.set(pattern, (value: string[]) => {
            res(value);
            if (previousCallback) {
              previousCallback(value);
            }
          });
        });

        messageBus.request_resourceList(pattern);
        return promise;
      }
    };
  }
}
