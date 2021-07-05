/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
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
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownPosition,
  DropdownSeparator,
  DropdownToggle,
} from "@patternfly/react-core/dist/js/components/Dropdown";
import { Tooltip } from "@patternfly/react-core/dist/js/components/Tooltip";
import { ConnectedIcon } from "@patternfly/react-icons/dist/js/icons/connected-icon";
import { DisconnectedIcon } from "@patternfly/react-icons/dist/js/icons/disconnected-icon";
import { ExclamationTriangleIcon } from "@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon";
import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../common/GlobalContext";
import { useOnlineI18n } from "../../common/i18n";
import { isConfigValid } from "../deploy/ConnectionConfig";
import { useDeploy } from "../deploy/DeployContext";
import { DeployInstanceStatus } from "../deploy/DeployInstanceStatus";
import { DeploymentDropdownItem } from "../deploy/DeploymentDropdownItem";
import { useDmnRunner } from "../DmnRunner/DmnRunnerContext";
import { DmnRunnerStatus } from "../DmnRunner/DmnRunnerStatus";

export function DmnExtendedServicesDropdown() {
  const globalContext = useContext(GlobalContext);
  const dmnRunner = useDmnRunner();
  const deployContext = useDeploy();
  const { i18n } = useOnlineI18n();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isInstalled, setInstalled] = useState(dmnRunner.status === DmnRunnerStatus.RUNNING);

  useEffect(() => {
    setInstalled(dmnRunner.status === DmnRunnerStatus.RUNNING);
  }, [dmnRunner.status]);

  const onInstallDmnExtendedServices = useCallback(() => {
    dmnRunner.closeDmnTour();
    if (dmnRunner.status !== DmnRunnerStatus.RUNNING) {
      dmnRunner.setModalOpen(true);
    }
  }, [dmnRunner]);

  const onOpenCloseDmnRunner = useCallback(() => {
    dmnRunner.closeDmnTour();
    if (dmnRunner.isDrawerExpanded) {
      dmnRunner.setDrawerExpanded(false);
    } else {
      dmnRunner.setDrawerExpanded(true);
    }
  }, [dmnRunner]);

  const onDevSandboxSetup = useCallback(() => {
    setDropdownOpen(false);
    deployContext.setConfigModalOpen(true);
  }, [deployContext]);

  const onDevSandboxDeploy = useCallback(() => {
    setDropdownOpen(false);
    if (deployContext.instanceStatus === DeployInstanceStatus.DISCONNECTED) {
      if (!isConfigValid(deployContext.currentConfig)) {
        deployContext.setDeployIntroductionModalOpen(true);
        return;
      }
      deployContext.setConfigWizardOpen(true);
      return;
    }
    deployContext.setConfirmDeployModalOpen(true);
  }, [deployContext]);

  const dropdownItems = useCallback(
    (dropdownId: string) => {
      const items = [];

      items.push(
        <DropdownItem
          key={`dropdown-${dropdownId}-install`}
          component={"button"}
          onClick={onInstallDmnExtendedServices}
          isDisabled={isInstalled}
          ouiaId="install-dropdown-button"
        >
          {isInstalled ? `Connected on port ${dmnRunner.port}` : "Install"}
        </DropdownItem>
      );

      items.push(
        <DropdownGroup key={"dmn-runner-group"} label="DMN Runner">
          <DropdownItem
            key={`dropdown-${dropdownId}-dmn-runner-open-close`}
            component={"button"}
            onClick={onOpenCloseDmnRunner}
            isDisabled={!isInstalled}
            ouiaId="open-close-dmn-runner-dropdown-button"
          >
            {dmnRunner.isDrawerExpanded ? "Close" : "Open"}
          </DropdownItem>
        </DropdownGroup>
      );

      items.push(
        <DropdownGroup
          key={"dmn-dev-sandbox-group"}
          label={
            <>
              DMN Developer Sandbox
              {isInstalled && deployContext.instanceStatus === DeployInstanceStatus.DISCONNECTED && (
                <ExclamationTriangleIcon className="pf-u-ml-sm" />
              )}
            </>
          }
        >
          <DropdownItem
            key={`dropdown-${dropdownId}-dmn-dev-sandbox-setup`}
            component={"button"}
            onClick={onDevSandboxSetup}
            isDisabled={!isInstalled}
            ouiaId="setup-dmn-dev-sandbox-dropdown-button"
          >
            Setup
          </DropdownItem>
          <DropdownItem
            key={`dropdown-${dropdownId}-dmn-dev-sandbox-deploy`}
            component={"button"}
            onClick={onDevSandboxDeploy}
            isDisabled={!isInstalled || deployContext.instanceStatus !== DeployInstanceStatus.CONNECTED}
            ouiaId="deploy-to-dmn-dev-sandbox-dropdown-button"
          >
            Deploy
          </DropdownItem>
        </DropdownGroup>
      );

      items.push(<DropdownSeparator />);

      if (deployContext.deployments.length === 0) {
        items.push(
          <DropdownItem key="disabled link" isDisabled>
            {i18n.deploy.dropdown.noDeployments}
          </DropdownItem>
        );
      } else {
        deployContext.deployments
          .sort((a, b) => b.creationTimestamp.getTime() - a.creationTimestamp.getTime())
          .forEach((deployment, i) => {
            items.push(<DeploymentDropdownItem id={i} key={`deployment_item_${i}`} deployment={deployment} />);
          });
      }

      return items;
    },
    [
      deployContext.deployments,
      deployContext.instanceStatus,
      dmnRunner.isDrawerExpanded,
      dmnRunner.port,
      i18n.deploy.dropdown.noDeployments,
      isInstalled,
      onDevSandboxDeploy,
      onDevSandboxSetup,
      onInstallDmnExtendedServices,
      onOpenCloseDmnRunner,
    ]
  );

  return (
    <Dropdown
      onSelect={() => setDropdownOpen(false)}
      toggle={
        <DropdownToggle
          id={"extended-services-id-lg"}
          data-testid={"extended-services-menu"}
          onToggle={(isOpen) => setDropdownOpen(isOpen)}
          icon={
            <>
              {dmnRunner.outdated && (
                <Tooltip
                  className="kogito-editor__deploy-dropdown-tooltip"
                  key={"outdated"}
                  content={i18n.dmnRunner.button.tooltip.outdated}
                  flipBehavior={["left"]}
                  distance={20}
                  trigger={globalContext.isChrome ? "mouseenter focus" : ""}
                >
                  <ExclamationTriangleIcon id={"dmn-runner-outdated-icon"} />
                </Tooltip>
              )}
              {!dmnRunner.outdated && (
                <>
                  {dmnRunner.status === DmnRunnerStatus.RUNNING ? (
                    <Tooltip
                      className="kogito-editor__deploy-dropdown-tooltip"
                      key={"connected"}
                      content={i18n.dmnRunner.button.tooltip.connected}
                      flipBehavior={["left"]}
                      distance={20}
                    >
                      <ConnectedIcon className="blink-opacity" />
                    </Tooltip>
                  ) : (
                    <Tooltip
                      className="kogito-editor__deploy-dropdown-tooltip"
                      key={"disconnected"}
                      content={i18n.dmnRunner.button.tooltip.disconnected}
                      flipBehavior={["left"]}
                      distance={20}
                    >
                      <DisconnectedIcon />
                    </Tooltip>
                  )}
                </>
              )}
            </>
          }
        >
          KIE Tooling Extended Services
        </DropdownToggle>
      }
      className={"kogito--editor__toolbar dropdown"}
      isOpen={dropdownOpen}
      dropdownItems={dropdownItems("lg")}
      position={DropdownPosition.right}
    />
  );
}
