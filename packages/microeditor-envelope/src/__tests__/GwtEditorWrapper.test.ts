import { GwtEditor } from "../gwt/GwtEditor";
import { GwtEditorWrapper } from "../gwt/GwtEditorWrapper";
import { DummyEditor } from "./DummyEditor";

const MockEditor = jest.fn(() => ({
  getContent: jest.fn(),
  setContent: jest.fn(),
  isDirty: jest.fn()
}));

const mockEditor = new MockEditor();
const wrapper = new GwtEditorWrapper(mockEditor);

describe("GwtEditorWrapper", () => {
  test("set content", () => {
    wrapper.setContent(" a content ");
    expect(mockEditor.setContent).toHaveBeenCalledWith("a content");
  });

  test("af_onOpen removes header", () => {
    const parent = document.createElement("div");
    const workbenchHeaderPanel = document.createElement("div");
    const listBarHeading = document.createElement("div");
    listBarHeading.className = ".panel-heading.uf-listbar-panel-header";
    workbenchHeaderPanel.id = "workbenchHeaderPanel";
    parent.appendChild(workbenchHeaderPanel);
    document.body.appendChild(parent);

    wrapper.af_onOpen();
    
    const removedHeaderPanel = document.getElementById("workbenchHeaderPanel");
    const removedListBarHeader = document.querySelector(".panel-heading.uf-listbar-panel-header");
    expect(removedHeaderPanel).toBeFalsy();
    expect(removedListBarHeader).toBeFalsy();
  });

  test("af_onOpen no element to remove", () => {
    let removedHeaderPanel = document.getElementById("workbenchHeaderPanel");
    expect(removedHeaderPanel).toBeFalsy();
    wrapper.af_onOpen();
    removedHeaderPanel = document.getElementById("workbenchHeaderPanel");
    expect(removedHeaderPanel).toBeFalsy();
  });
});