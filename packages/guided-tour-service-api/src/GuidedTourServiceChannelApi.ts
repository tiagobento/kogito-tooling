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
import * as React from "react";

export class Step {
  constructor(
    public mode: Mode,
    public content?:
      | React.ReactNode
      | ((props: { dismiss?: () => void; nextStep?: () => void; prevStep?: () => void }) => React.ReactNode)
      | string,
    public selector?: string,
    public highlightEnabled?: boolean,
    public navigatorEnabled?: boolean,
    public position?: "right" | "bottom" | "center" | "left",
    public negativeReinforcementMessage?: string
  ) {}
}

export class DemoMode {
  // Each step shows something, and waits for the "Next step" click
}

export class Tutorial {
  constructor(public label: string, public steps: Step[]) {}
}

export class UserInteraction {
  constructor(public action: string, public target: string) {}
}

export class BlockMode {
  // Each step shows something, and waits for some user interaction
  constructor(public userInteraction: UserInteraction, public allowedSelectors: string[]) {}
}

export class AutoMode {
  // Each step shows something, stays opened for some time, and it's auto-skipped
  constructor(public delay: number) {}
}

export class SubTutorialMode {
  // This steps englobes an amount of other sub-steps
  constructor(public label: string) {}
}

export type Mode = BlockMode | AutoMode | DemoMode | SubTutorialMode;

export const NONE: Step = {
  mode: new DemoMode()
};

export interface GuidedTourServiceChannelApi {
  receive_guidedTourUserInteraction(userInteraction: UserInteraction): void;
  receive_guidedTourRegisterTutorial(tutorial: Tutorial): void;
}
