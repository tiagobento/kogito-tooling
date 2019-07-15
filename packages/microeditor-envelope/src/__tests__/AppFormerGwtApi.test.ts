import { AppFormerGwtApi } from '../gwt/AppFormerGwtApi';
import { DummyEditor } from './DummyEditor';
import * as AppFormer from "appformer-js-core";
import { GwtEditor } from '../gwt/GwtEditor';

class DummyGwtEditor {
  private wrappedEditor: AppFormer.Editor;

  constructor(wrappedEditor: AppFormer.Editor) {
    this.wrappedEditor = wrappedEditor;
  }
  public get(): AppFormer.Editor {
    return this.wrappedEditor;
  }
}

const dummyEditor = new DummyEditor();
const dummyGwtEditor = new DummyGwtEditor(dummyEditor);
const editorId = "dummy editor";
const appFormerGwtApi = new AppFormerGwtApi();

window.gwtEditorBeans = new Map<string, { get(): GwtEditor }>();
window.gwtEditorBeans.set(editorId, dummyGwtEditor);

describe("AppFormerGwtApi", () => {
  test("get existing editor", () => {
    const possibleEditor = appFormerGwtApi.getEditor(editorId);
    expect(possibleEditor).toBeTruthy();
  });

  test("get non existing editor", () => {
    expect(() => appFormerGwtApi.getEditor("X")).toThrowError();
  });
});