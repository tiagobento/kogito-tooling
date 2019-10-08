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

import { ResourceContentService, ResourceContent } from "@kogito-tooling/core-api";
import { ResourcesList } from "@kogito-tooling/core-api";

export class ChromeResourceContentService implements ResourceContentService {

  private DEF: string = `
  [
    [
      "name" : "Email",
      "parameters" : [
        "From" : new StringDataType(),
        "To" : new StringDataType(),
        "Subject" : new StringDataType(),
        "Body" : new StringDataType()
      ],
      "displayName" : "Email",
      "icon" : "defaultemailicon.gif"
    ],
  
    [
      "name" : "Log",
      "parameters" : [
        "Message" : new StringDataType()
      ],
      "displayName" : "Log",
      "icon" : "defaultlogicon.gif"
    ],
  
    [
      "name" : "WebService",
      "parameters" : [
          "Url" : new StringDataType(),
           "Namespace" : new StringDataType(),
           "Interface" : new StringDataType(),
           "Operation" : new StringDataType(),
           "Parameter" : new StringDataType(),
           "Endpoint" : new StringDataType(),
           "Mode" : new StringDataType()
      ],
      "results" : [
          "Result" : new ObjectDataType(),
      ],
      "displayName" : "WS",
      "icon" : "defaultservicenodeicon.png"
    ],
  
    [
      "name" : "Rest",
      "parameters" : [
          "ContentData" : new StringDataType(),
          "Url" : new StringDataType(),
          "Method" : new StringDataType(),
          "ConnectTimeout" : new StringDataType(),
          "ReadTimeout" : new StringDataType(),
          "Username" : new StringDataType(),
          "Password" : new StringDataType()
      ],
      "results" : [
          "Result" : new ObjectDataType(),
      ],
      "displayName" : "REST",
      "icon" : "defaultservicenodeicon.png"
    ],
  
    [
       "name" : "BusinessRuleTask",
       "parameters" : [
         "Language" : new StringDataType(),
         "KieSessionName" : new StringDataType(),
         "KieSessionType" : new StringDataType()
       ],
       "displayName" : "Business Rule Task",
       "icon" : "defaultbusinessrulesicon.png",
       "category" : "Decision tasks"
     ],
  
     [
       "name" : "DecisionTask",
       "parameters" : [
         "Language" : new StringDataType(),
         "Namespace" : new StringDataType(),
         "Model" : new StringDataType(),
         "Decision" : new StringDataType()
       ],
       "displayName" : "Decision Task",
       "icon" : "defaultdecisionicon.png",
       "category" : "Decision tasks"
     ],
  
     [
      "name" : "Milestone",
      "parameters" : [
          "Condition" : new StringDataType()
      ],
      "displayName" : "Milestone",
      "icon" : "defaultmilestoneicon.png",
      "category" : "Milestone"
      ]
  ]
  `;

  public read(uri: string): Promise<ResourceContent | undefined> {
    if (uri === "WorkDefinitions.wid") {
      return Promise.resolve(new ResourceContent(uri, this.DEF));
    }
    return Promise.resolve(undefined);
  }

  public list(pattern: string): Promise<ResourcesList> {
    return Promise.resolve(new ResourcesList(pattern, []));
  }

}