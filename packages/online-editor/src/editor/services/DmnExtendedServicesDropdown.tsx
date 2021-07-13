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
  DropdownItem,
  DropdownPosition,
  DropdownSeparator,
  DropdownToggle,
} from "@patternfly/react-core/dist/js/components/Dropdown";
import { ExclamationTriangleIcon } from "@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon";
import * as React from "react";
import { useCallback, useContext, useMemo, useState } from "react";
import { GlobalContext } from "../../common/GlobalContext";
import { useOnlineI18n } from "../../common/i18n";
import { isConfigValid } from "../deploy/ConnectionConfig";
import { useDeploy } from "../deploy/DeployContext";
import { DeployInstanceStatus } from "../deploy/DeployInstanceStatus";
import { DeploymentDropdownItem } from "../deploy/DeploymentDropdownItem";
import { useDmnRunner } from "../DmnRunner/DmnRunnerContext";
import { DmnRunnerStatus } from "../DmnRunner/DmnRunnerStatus";
import { Tooltip } from "@patternfly/react-core/dist/js/components/Tooltip";
import { ConnectedIcon } from "@patternfly/react-icons/dist/js/icons/connected-icon";
import { DisconnectedIcon } from "@patternfly/react-icons/dist/js/icons/disconnected-icon";

export function DmnExtendedServicesDropdown() {
  const globalContext = useContext(GlobalContext);
  const dmnRunner = useDmnRunner();
  const deployContext = useDeploy();
  const { i18n } = useOnlineI18n();

  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const dmnDevSandboxItems = useMemo(() => {
    const items = [];
    items.push(
      <>
        {deployContext.instanceStatus !== DeployInstanceStatus.CONNECTED && (
          <DropdownItem
            key={`dropdown-dmn-dev-sandbox-setup`}
            component={"button"}
            onClick={onDevSandboxSetup}
            isDisabled={dmnRunner.status !== DmnRunnerStatus.RUNNING}
            ouiaId={"setup-dmn-dev-sandbox-dropdown-button"}
          >
            Setup
          </DropdownItem>
        )}
        <DropdownItem
          key={`dropdown-dmn-dev-sandbox-deploy`}
          component={"button"}
          onClick={onDevSandboxDeploy}
          isDisabled={
            dmnRunner.status !== DmnRunnerStatus.RUNNING ||
            deployContext.instanceStatus !== DeployInstanceStatus.CONNECTED
          }
          ouiaId={"deploy-to-dmn-dev-sandbox-dropdown-button"}
        >
          Deploy
        </DropdownItem>
        {deployContext.instanceStatus === DeployInstanceStatus.CONNECTED && (
          <>
            <DropdownSeparator />
            <DropdownItem
              key={`dropdown-dmn-dev-sandbox-setup-as`}
              component={"button"}
              isDisabled={true}
              ouiaId={"setup-as-dmn-dev-sandbox-dropdown-button"}
            >
              Setup as "{deployContext.currentConfig.username}"
            </DropdownItem>
            <DropdownItem
              key={`dropdown-dmn-dev-sandbox-setup`}
              component={"button"}
              onClick={onDevSandboxSetup}
              isDisabled={dmnRunner.status !== DmnRunnerStatus.RUNNING}
              ouiaId={"setup-dmn-dev-sandbox-dropdown-button"}
            >
              Change
            </DropdownItem>
          </>
        )}
      </>
    );

    items.push(<DropdownSeparator />);

    if (deployContext.deployments.length === 0) {
      items.push(
        <DropdownItem key="disabled link" isDisabled>
          <i>{i18n.deploy.dropdown.noDeployments}</i>
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
  }, [
    deployContext.deployments,
    deployContext.instanceStatus,
    i18n.deploy.dropdown.noDeployments,
    dmnRunner.status,
    onDevSandboxDeploy,
    onDevSandboxSetup,
    onInstallDmnExtendedServices,
    onOpenCloseDmnRunner,
  ]);

  const dropdownToggleIcon = (
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
              content={i18n.dmnRunner.button.tooltip.connected(dmnRunner.port)}
              flipBehavior={["left"]}
              distance={20}
            >
              <ConnectedIcon color={"var(--pf-global--palette--green-300)"} />
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
  );

  return (
    <>
      <Dropdown
        toggle={
          <DropdownToggle onToggle={onInstallDmnExtendedServices} toggleIndicator={null}>
            {dropdownToggleIcon}&nbsp;&nbsp;KIE Tooling Extended Services
          </DropdownToggle>
        }
        isPlain={true}
        className={"kogito--editor__toolbar dropdown"}
        position={DropdownPosition.right}
        style={
          dmnRunner.status === DmnRunnerStatus.RUNNING
            ? { marginRight: "2px", borderBottom: "solid transparent 2px", paddingBottom: 0 }
            : { marginRight: "2px", borderBottom: "solid var(--pf-global--palette--red-300) 2px", paddingBottom: 0 }
        }
      />
      <FeatureDependentOnKieToolingExtendedServices>
        <Dropdown
          onSelect={() => setDropdownOpen(false)}
          toggle={
            <DropdownToggle isDisabled={dmnRunner.status !== DmnRunnerStatus.RUNNING} onToggle={setDropdownOpen}>
              DMN Dev Sandbox
            </DropdownToggle>
          }
          isOpen={dropdownOpen}
          isPlain={true}
          className={"kogito--editor__toolbar dropdown"}
          position={DropdownPosition.right}
          dropdownItems={dmnDevSandboxItems}
          style={
            deployContext.instanceStatus === DeployInstanceStatus.CONNECTED
              ? { marginRight: "2px", borderBottom: "solid var(--pf-global--palette--blue-300) 2px", paddingBottom: 0 }
              : { marginRight: "2px" }
          }
        />
      </FeatureDependentOnKieToolingExtendedServices>
      <FeatureDependentOnKieToolingExtendedServices>
        <Dropdown
          toggle={
            <DropdownToggle
              isDisabled={dmnRunner.status !== DmnRunnerStatus.RUNNING}
              toggleIndicator={null}
              onToggle={onOpenCloseDmnRunner}
            >
              {i18n.names.dmnRunner}
            </DropdownToggle>
          }
          isPlain={true}
          className={"kogito--editor__toolbar dropdown"}
          position={DropdownPosition.right}
          isOpen={false}
          style={
            dmnRunner.isDrawerExpanded
              ? { marginRight: "2px", borderBottom: "solid var(--pf-global--palette--blue-300) 2px", paddingBottom: 0 }
              : { marginRight: "2px" }
          }
        />
      </FeatureDependentOnKieToolingExtendedServices>
    </>
  );
}

function FeatureDependentOnKieToolingExtendedServices(props: { children: any }) {
  const dmnRunner = useDmnRunner();
  if (dmnRunner.status === DmnRunnerStatus.RUNNING) {
    return props.children;
  } else {
    return (
      <Tooltip
        content={"Please install KIE Tooling Extended Services to use this feature."}
        flipBehavior={["bottom"]}
        className="kogito-editor__deploy-dropdown-tooltip"
      >
        {props.children}
      </Tooltip>
    );
  }
}
