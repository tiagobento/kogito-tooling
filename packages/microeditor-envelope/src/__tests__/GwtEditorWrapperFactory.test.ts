import { AppFormerGwtApi } from "../gwt/AppFormerGwtApi";
import { GwtEditorWrapperFactory } from "../gwt/GwtEditorWrapperFactory";
import { AssertionError } from "assert";
import { LanguageData, Resource } from "appformer-js-microeditor-router/src";

const delay = (ms: number) => {
  return new Promise(res => setTimeout(res, ms));
};

const appFormerGwtApi: AppFormerGwtApi = {
  setErraiDomain: jest.fn(),
  onFinishedLoading: (callback: () => Promise<any>) => window.appFormerGwtFinishedLoading = callback,
  getEditor: jest.fn(),
  setClientSideOnly: jest.fn()
};

const cssResource: Resource = {
  type: "css",
  paths: ["resource.css"]
};

const jsResource: Resource = {
  type: "js",
  paths: ["resource.js"]
}

const testLanguageData: LanguageData = {
  editorId: "editorID",
  gwtModuleName: "moduleName",
  erraiDomain: "erraiDomain",
  resources: [cssResource, jsResource]
}

const gwtEditorWrapperFactory: GwtEditorWrapperFactory = new GwtEditorWrapperFactory(appFormerGwtApi);

describe("GwtEditorWrapperFactory", () => {
  test("create editor", async () => {
    const res = jest.fn();

    gwtEditorWrapperFactory.createEditor(testLanguageData).then(res)

    const links = document.body.getElementsByTagName('link');
    const scripts = document.getElementsByTagName('script');
    expect(links.length).toBe(1);
    expect(scripts.length).toBe(1);
    expect(links[0].href).toContain(cssResource.paths[0]);
    expect(scripts[0].src).toContain(jsResource.paths[0]);

    window.appFormerGwtFinishedLoading();

    await delay(100);
    expect(res).toBeCalled();
  });
});