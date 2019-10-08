import { EnvelopeBusInnerMessageHandler } from "./EnvelopeBusInnerMessageHandler";

export class ResourceContentEditorService {

  private envelopeBusInnerMessageHandler: EnvelopeBusInnerMessageHandler;

  constructor(envelopeBusInnerMessageHandler: EnvelopeBusInnerMessageHandler) {
    this.envelopeBusInnerMessageHandler = envelopeBusInnerMessageHandler;
  }

  public get(uri: string): Promise<string | undefined> {
    const pendingResourceRequests = this.envelopeBusInnerMessageHandler.pendingResourceRequests;

    const promise: Promise<string> = new Promise((success, failure) => {
      const previousCallback = pendingResourceRequests.get(uri);
      pendingResourceRequests.set(uri, (value: string) => {
        success(value);
        if (previousCallback) {
          previousCallback(value);
        }
      });
    });

    this.envelopeBusInnerMessageHandler.request_resourceContent(uri);
    return promise;
  };

  public list(pattern: string): Promise<string[]> {
    const pendingResourceListRequests = this.envelopeBusInnerMessageHandler.pendingResourceListRequests;

    const promise: Promise<string[]> = new Promise((success, failure) => {
      const previousCallback = pendingResourceListRequests.get(pattern);
      pendingResourceListRequests.set(pattern, (value: string[]) => {
        success(value);
        if (previousCallback) {
          previousCallback(value);
        }
      });
    });

    this.envelopeBusInnerMessageHandler.request_resourceList(pattern);
    return promise;
  }

}