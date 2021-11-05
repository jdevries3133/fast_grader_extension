import { backendRequest as _br, logToBackend } from "./api";
const _br_tmp = <any>_br;
const backendRequest = <jest.MockedFunction<typeof _br>>_br_tmp;

import { contentScriptReady as _cs, performSync as _ps } from "./messaging";
const _ps_tmp = <any>_ps;
const performSync = <jest.MockedFunction<typeof _ps>>_ps_tmp;

const _cs_tmp = <any>_cs;
const contentScriptReady = <jest.MockedFunction<typeof _cs>>_cs_tmp;

import { exportedForTesting } from "./popup";
import { gradingSessionDetail } from "./mockResponses";
import { getMockTabQueryFunc } from "./testUtils";

const { syncRequestHandler, _syncRequestHandlerUnsafe } = exportedForTesting;

/**
 * Note: in most cases, we test against _syncRequestHandlerUnsafe.
 * syncRequestHandler is a simple wrapper around _syncRequestHandlerUnsafe
 * that catches exception, which is detrimental for testing
 */

jest.mock("./messaging", () => ({
  ...(jest.requireActual("./messaging") as {}),
  performSync: jest.fn(),
  contentScriptReady: jest.fn().mockImplementation(async () => true),
}));

jest.mock("./api", () => {
  const original = jest.requireActual("./api");
  return {
    ...original,
    logToBackend: jest.fn(),
    backendRequest: jest.fn(),
  };
});

describe("syncRequestHandler", () => {
  function getEvent(data: { [key: string]: string }): Event {
    let el = document.createElement("div");
    Object.keys(data).forEach((k) => {
      el.setAttribute(k, data[k]);
    });
    const event = <Event>(<unknown>{
      target: el,
    });
    return event;
  }

  function setupTabs(tabResponse?: Array<object>) {
    browser.tabs.query.mockImplementation(async () => {
      return tabResponse
        ? tabResponse
        : [
            {
              url: "https://facebook.com/",
              active: true,
              windowId: 1,
              tabId: 2,
            },
            {
              url: gradingSessionDetail.session
                .google_classroom_detail_view_url,
              active: false,
              windowId: 1,
              tabId: 2,
            },
          ];
    });
  }

  function setupResponseData(data?: object) {
    backendRequest.mockImplementation(async () => {
      // @ts-ignore
      if (data?.throwError) {
        throw new Error();
      }
      const res = {
        json: async () => data || gradingSessionDetail,
      };
      return <Response>res;
    });
  }

  function setupPerfSync(returnValue: boolean = true) {
    performSync.mockImplementation(async () => returnValue);
  }

  beforeEach(() => {
    setupResponseData(gradingSessionDetail);
    setupPerfSync();
    setupTabs();
  });

  afterEach(() => {
    backendRequest.mockClear();
    browser.tabs.query.mockClear();
  });

  it("fetches pk from backend", async () => {
    await _syncRequestHandlerUnsafe(getEvent({ "data-pk": "2" }));
    expect(backendRequest).toHaveBeenCalledWith(`/grader/session/2/`);
  });

  it("sends response data to sendPerfSyncMsg", async () => {
    backendRequest.mockClear();
    setupResponseData({ session: { google_classroom_detail_view_url: "foo" } });
    setupTabs();
    await _syncRequestHandlerUnsafe(getEvent({ "data-pk": "2" }));
    expect(performSync).toHaveBeenCalledWith({
      session: { google_classroom_detail_view_url: "foo" },
    });
  });

  it("catches and logs errors", async () => {
    // this time, we test against the wrapper, to check error handling
    // behavior
    setupResponseData({ throwError: true });
    await syncRequestHandler(getEvent({ "data-pk": "2" }));
    expect(logToBackend).toHaveBeenCalled();
  });

  it("switches to the correct tab if the current one is wrong", async () => {
    const tabs = [
      {
        url: "https://facebook.com/",
        active: true,
        windowId: 1,
        tabId: 2,
      },
      {
        url: gradingSessionDetail.session.google_classroom_detail_view_url,
        active: false,
        windowId: 1,
        tabId: 1,
      },
    ];
    setupTabs(tabs);
    browser.tabs.query.mockImplementation(getMockTabQueryFunc(tabs));

    await _syncRequestHandlerUnsafe(getEvent({ "data-testid": "2" }));
    expect(browser.tabs.query).toHaveBeenCalledWith({
      url: "https://classroom.google.com/c/MzgxNTMyMDA3ODU5/a/MzE5ODM3MTMwNjQ4/submissions/by-status/and-sort-first-name/all",
    });
    expect(browser.tabs.update).toHaveBeenCalledWith(1, { active: true });
  });

  it("opens a new tab if there is not one already open", async () => {
    const tabs = [
      {
        url: "https://facebook.com/",
        active: true,
        windowId: 1,
        tabId: 2,
      },
    ];
    setupTabs(tabs);
    browser.tabs.query.mockImplementation(getMockTabQueryFunc(tabs));

    await _syncRequestHandlerUnsafe(getEvent({ "data-testid": "2" }));
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: "https://classroom.google.com/c/MzgxNTMyMDA3ODU5/a/MzE5ODM3MTMwNjQ4/submissions/by-status/and-sort-first-name/all",
    });
  });

  it("does not initiate syncing before confirming initialization of the content script", async () => {
    const err = new Error("content script did not prepare");
    contentScriptReady.mockImplementation(async () => {
      throw err;
    });
    expect(
      _syncRequestHandlerUnsafe(getEvent({ "data-testid": "2" }))
    ).rejects.toThrowError(err);
  });
});
