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

import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DecisionResult, DmnRunner, EvaluationStatus, Result } from "../../common/DmnRunner";
import { AutoForm } from "uniforms-patternfly";
import {
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DrawerCloseButton,
  DrawerPanelContent,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Page,
  PageSection,
  Text,
  TextContent,
  TextVariants,
  Title
} from "@patternfly/react-core";
import { CheckCircleIcon, CubesIcon, ExclamationIcon, ExclamationCircleIcon, InfoCircleIcon } from "@patternfly/react-icons";
import { diff } from "deep-object-diff";
import { ErrorBoundary } from "../../common/ErrorBoundry";
import { useDmnRunner } from "./DmnRunnerContext";

enum ButtonPosition {
  INPUT,
  OUTPUT
}

interface Props {
  editor: any;
  onStopRunDmn: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const DMN_RUNNER_MIN_WIDTH_TO_ROW_DIRECTION = 711;
const WINDOW_MIN_WIDTH_TO_COLUMN_DIRECTION = 1200;

export function DmnRunnerDrawer(props: Props) {
  const dmnRunner = useDmnRunner();
  const [dmnRunnerResults, setDmnRunnerResults] = useState<DecisionResult[]>();
  const autoFormRef = useRef<HTMLFormElement>();
  const [dmnRunnerResponseDiffs, setDmnRunnerResponseDiffs] = useState<object[]>();
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition>(() =>
    window.innerWidth <= WINDOW_MIN_WIDTH_TO_COLUMN_DIRECTION ? ButtonPosition.INPUT : ButtonPosition.OUTPUT
  );
  const [dmnRunnerContentStyles, setDmnRunnerContentStyles] = useState<{ width: string; height: string }>({
    width: "50%",
    height: "100%"
  });
  const [dmnRunnerFlexDirection, setDmnRunnerFlexDirection] = useState<{ flexDirection: "row" | "column" }>({
    flexDirection: "row"
  });
  const [formContext, setFormContext] = useState();
  const errorBoundaryRef = useRef<ErrorBoundary>(null);

  const onResize = useCallback((width: number) => {
    const iframe = document.getElementById("kogito-iframe");
    if (iframe) {
      iframe.style.pointerEvents = "visible";
    }

    // FIXME: Patternfly bug. The first interaction without resizing the splitter will result in width === 0.
    if (width === 0) {
      return;
    }

    if (width > DMN_RUNNER_MIN_WIDTH_TO_ROW_DIRECTION) {
      setButtonPosition(ButtonPosition.OUTPUT);
      setDmnRunnerFlexDirection({ flexDirection: "row" });
      setDmnRunnerContentStyles({ width: "50%", height: "100%" });
    } else {
      setButtonPosition(ButtonPosition.INPUT);
      setDmnRunnerFlexDirection({ flexDirection: "column" });
      setDmnRunnerContentStyles({ width: "100%", height: "50%" });
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth < WINDOW_MIN_WIDTH_TO_COLUMN_DIRECTION) {
      setButtonPosition(ButtonPosition.INPUT);
      setDmnRunnerFlexDirection({ flexDirection: "column" });
      setDmnRunnerContentStyles({ width: "100%", height: "50%" });
    }
  }, []);

  const onSubmit = useCallback(
    async data => {
      setFormContext(data);
      if (props.editor) {
        try {
          const content = await props.editor.getContent();
          const result = await DmnRunner.result({ context: data, model: content });
          if (Object.hasOwnProperty.call(result, "details") && Object.hasOwnProperty.call(result, "stack")) {
            // DMN Runner Error
            return;
          }
          const differences = result?.decisionResults?.map((decisionResult, index) =>
            diff(dmnRunnerResults?.[index] ?? {}, decisionResult ?? {})
          );
          if (differences?.length !== 0) {
            setDmnRunnerResponseDiffs(differences);
          }

          setDmnRunnerResults(result?.decisionResults);
        } catch (err) {
          setDmnRunnerResults(undefined);
        }
      }
    },
    [props.editor, dmnRunnerResults]
  );

  useLayoutEffect(() => {
    autoFormRef.current?.change("context", formContext);
  }, []);

  useEffect(() => {
    errorBoundaryRef.current?.reset();
  }, [dmnRunner.jsonSchemaBridge]);

  useEffect(() => {
    const iframe = document.getElementById("kogito-iframe");
    const drawerResizableSplitter = document.querySelector(".pf-c-drawer__splitter");

    if (iframe && drawerResizableSplitter) {
      const removePointerEvents = () => (iframe.style.pointerEvents = "none");
      drawerResizableSplitter.addEventListener("mousedown", removePointerEvents);

      return () => {
        drawerResizableSplitter.removeEventListener("mousedown", removePointerEvents);
      };
    }
  }, []);

  useEffect(() => {
    if (props.editor) {
      let timeout: any;
      const subscription = props.editor.getStateControl().subscribe(() => {
        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          autoFormRef.current?.submit();
        }, 200);
      });

      return () => {
        props.editor.getStateControl().unsubscribe(subscription);
      };
    }
  }, [props.editor]);

  const renderForm = useMemo(() => {
    return (
      dmnRunner.jsonSchemaBridge &&
      Object.keys(dmnRunner.jsonSchemaBridge?.schema.properties ?? {}).length !== 0
    );
  }, [dmnRunner.jsonSchemaBridge]);

  return (
    <DrawerPanelContent
      id={"kogito-panel-content"}
      className={"kogito--editor__drawer-content-panel"}
      defaultSize={"711px"}
      onResize={onResize}
      isResizable={true}
    >
      <div className={"kogito--editor__dmn-runner"} style={dmnRunnerFlexDirection}>
        <div className={"kogito--editor__dmn-runner-content"} style={dmnRunnerContentStyles}>
          <Page className={"kogito--editor__dmn-runner-content-page"}>
            <PageSection className={"kogito--editor__dmn-runner-content-header"}>
              <TextContent>
                <Text component={"h2"}>Inputs</Text>
              </TextContent>
              {buttonPosition === ButtonPosition.INPUT && (
                <DrawerCloseButton onClick={(e: any) => props.onStopRunDmn(e)} />
              )}
            </PageSection>

            <div className={"kogito--editor__dmn-runner-drawer-content-body"}>
              <PageSection className={"kogito--editor__dmn-runner-drawer-content-body-input"}>
                {renderForm ? (
                  <ErrorBoundary
                    ref={errorBoundaryRef}
                    error={
                      <div>
                        <EmptyState>
                          <EmptyStateIcon icon={ExclamationIcon} />
                          <TextContent>
                            <Text component={"h2"}>Oops!</Text>
                          </TextContent>
                          <EmptyStateBody>
                            <TextContent>Form cannot be rendered because of an error.</TextContent>
                          </EmptyStateBody>
                        </EmptyState>
                      </div>
                    }
                  >
                    <AutoForm
                      id={"form"}
                      ref={autoFormRef}
                      showInlineError={true}
                      autosave={true}
                      autosaveDelay={500}
                      schema={dmnRunner.jsonSchemaBridge}
                      onSubmit={onSubmit}
                      errorsField={() => <></>}
                      submitField={() => <></>}
                    />
                  </ErrorBoundary>
                ) : (
                  <div>
                    <EmptyState>
                      <EmptyStateIcon icon={CubesIcon} />
                      <TextContent>
                        <Text component={"h2"}>No Form</Text>
                      </TextContent>
                      <EmptyStateBody>
                        <TextContent>
                          <Text component={TextVariants.p}>Associated DMN doesn't have any inputs.</Text>
                        </TextContent>
                      </EmptyStateBody>
                    </EmptyState>
                  </div>
                )}
              </PageSection>
            </div>
          </Page>
        </div>
        <div className={"kogito--editor__dmn-runner-content"} style={dmnRunnerContentStyles}>
          <Page className={"kogito--editor__dmn-runner-content-page"}>
            <PageSection className={"kogito--editor__dmn-runner-content-header"}>
              <TextContent>
                <Text component={"h2"}>Outputs</Text>
              </TextContent>
              {buttonPosition === ButtonPosition.OUTPUT && (
                <DrawerCloseButton onClick={(e: any) => props.onStopRunDmn(e)} />
              )}
            </PageSection>
            <div className={"kogito--editor__dmn-runner-drawer-content-body"}>
              <PageSection className={"kogito--editor__dmn-runner-drawer-content-body-output"}>
                <DmnRunnerResult results={dmnRunnerResults!} differences={dmnRunnerResponseDiffs} />
              </PageSection>
            </div>
          </Page>
        </div>
      </div>
    </DrawerPanelContent>
  );
}

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface DmnRunnerResponseProps {
  results?: DecisionResult[];
  differences?: Array<DeepPartial<DecisionResult>>;
}

function DmnRunnerResult(props: DmnRunnerResponseProps) {
  useEffect(() => {
    props.differences?.forEach((difference, index) => {
      if (Object.keys(difference).length === 0) {
        return;
      }

      const updatedResult = document.getElementById(`${index}-dmn-runner-result`);
      updatedResult?.classList.add("kogito--editor__dmn-runner-drawer-output-leaf-updated");
    });
  }, [props.differences]);

  const onAnimationEnd = useCallback((e: React.AnimationEvent<HTMLElement>, index) => {
    e.preventDefault();
    e.stopPropagation();

    const updatedResult = document.getElementById(`${index}-dmn-runner-result`);
    updatedResult?.classList.remove("kogito--editor__dmn-runner-drawer-output-leaf-updated");
  }, []);

  const resultStatus = useCallback((evaluationStatus: EvaluationStatus) => {
    switch (evaluationStatus) {
      case EvaluationStatus.SUCCEEDED:
        return (
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <CheckCircleIcon />
              <p style={{ paddingLeft: "5px" }}>Evaluated with success</p>
            </div>
          </>
        );
      case EvaluationStatus.SKIPPED:
        return (
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <InfoCircleIcon />
              <p style={{ paddingLeft: "5px" }}>Evaluation skipped</p>
            </div>
          </>
        );
      case EvaluationStatus.FAILED:
        return (
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <ExclamationCircleIcon />
              <p style={{ paddingLeft: "5px" }}>Evaluation failed</p>
            </div>
          </>
        );
    }
  }, []);

  const result = useCallback((dmnRunnerResult: Result) => {
    switch (typeof dmnRunnerResult) {
      case "boolean":
        return dmnRunnerResult ? <i>true</i> : <i>false</i>;
      case "number":
      case "string":
        return dmnRunnerResult;
      case "object":
        return (
          dmnRunnerResult !== null && (
            <DescriptionList>
              {Object.entries(dmnRunnerResult).map(([key, value]) => (
                <DescriptionListGroup>
                  <DescriptionListTerm>{key}</DescriptionListTerm>
                  <DescriptionListDescription>{value}</DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          )
        );
      default:
        return <i>(null)</i>;
    }
  }, []);

  const resultsToRender = useMemo(
    () =>
      props.results?.map((dmnRunnerResult, index) => (
        <div key={`${index}-dmn-runner-result`} style={{ padding: "10px" }}>
          <Card
            id={`${index}-dmn-runner-result`}
            isFlat={true}
            className={"kogito--editor__dmn-runner-drawer-content-body-output-card"}
            onAnimationEnd={e => onAnimationEnd(e, index)}
          >
            <CardTitle>
              <Title headingLevel={"h2"}>{dmnRunnerResult.decisionName}</Title>
            </CardTitle>
            <CardBody isFilled={true}>{result(dmnRunnerResult.result)}</CardBody>
            <CardFooter>{resultStatus(dmnRunnerResult.evaluationStatus)}</CardFooter>
          </Card>
        </div>
      )),
    [props.results]
  );

  return (
    <div>
      {resultsToRender && resultsToRender.length > 0 ? (
        resultsToRender
      ) : (
        <EmptyState>
          <EmptyStateIcon icon={InfoCircleIcon} />
          <TextContent>
            <Text component={"h2"}>No response</Text>
          </TextContent>
          <EmptyStateBody>
            <TextContent>
              <Text>Response appears after decisions are evaluated.</Text>
            </TextContent>
          </EmptyStateBody>
        </EmptyState>
      )}
    </div>
  );
}