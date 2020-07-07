/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as __path from "path";
import { VsCodeNodeWorkspaceService } from "../VsCodeNodeWorkspaceService";
import { ContentType } from "@kogito-tooling/workspace-service-api";

const testWorkspace = __path.resolve(__dirname, "test-workspace") + __path.sep;

let workspaceService: VsCodeNodeWorkspaceService;

describe("VsCodeNodeWorkspaceService", () => {
  beforeEach(() => {
    workspaceService = new VsCodeNodeWorkspaceService(testWorkspace, "some/path");
  });

  test("Test list", async () => {
    const txtPattern = "*.txt";

    const resourcesListWithAssets = await workspaceService.receive_resourceListRequest(txtPattern);

    expect(resourcesListWithAssets).not.toBeNull();
    expect(resourcesListWithAssets).toHaveLength(2);
    expect(resourcesListWithAssets).toContain(testWorkspace + "resource1.txt");
    expect(resourcesListWithAssets).toContain(testWorkspace + "resource2.txt");

    const pdfPattern = "*.pdf";
    const resourcesListEmpty = await workspaceService.receive_resourceListRequest(pdfPattern);
    expect(resourcesListEmpty).not.toBeNull();
    expect(resourcesListEmpty).toHaveLength(0);
  });

  test("Test list with errors", async () => {
    workspaceService = new VsCodeNodeWorkspaceService("/probably/an/unexisting/path/", "some/path");

    const pattern = "*.txt";
    const resourcesList = await workspaceService.receive_resourceListRequest(pattern);

    expect(resourcesList).not.toBeNull();
    expect(resourcesList).toHaveLength(0);
  });

  test("Test get", async () => {
    const resource1Path = "resource1.txt";
    const resource1Content = await workspaceService.receive_resourceContentRequest(resource1Path);

    expect(resource1Content).not.toBeNull();
    expect(resource1Content).toBe("content for resource 1");

    const resource2Path = "resource2.txt";
    const resource2Content = await workspaceService.receive_resourceContentRequest(resource2Path);

    expect(resource2Content).not.toBeNull();
    expect(resource2Content).toBe("content for resource 2");

    const iconPath = "icon.png";
    const iconContent = await workspaceService.receive_resourceContentRequest(iconPath, {
      type: ContentType.BINARY
    });

    expect(iconContent).not.toBeNull();
  });

  test("Test get with errors", async () => {
    workspaceService = new VsCodeNodeWorkspaceService("/probably/an/unexisting/path/", "some/path");

    const txtResourcePath = "resource1.txt";
    const txtResourceContent = await workspaceService.receive_resourceContentRequest(txtResourcePath);

    expect(txtResourceContent).not.toBeNull();
    expect(txtResourceContent).toBe(undefined);

    const binaryPath = "icon.png";
    const binaryContent = await workspaceService.receive_resourceContentRequest(binaryPath, {
      type: ContentType.BINARY
    });

    expect(binaryContent).not.toBeNull();
    expect(binaryContent).toBe(undefined);
  });
});
