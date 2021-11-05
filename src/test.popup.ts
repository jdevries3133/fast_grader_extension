import { backendRequest as _br } from "./api";
const _br_tmp = <any>_br;
const backendRequest = <jest.MockedFunction<typeof _br>>_br_tmp;

import { exportedForTesting } from "./popup";
import { performSync } from "./messaging";
import { gradingSessionDetail } from "./mockResponses";

const { syncRequestHandler } = exportedForTesting;

jest.mock("./messaging", () => ({
  ...(jest.requireActual("./messaging") as {}),
  performSync: jest.fn(),
}));

jest.mock("./api", () => {
  const original = jest.requireActual("./api");
  return {
    ...original,
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

  function setupTabs(tabResponse: Array<object>) {
    browser.tabs.query.mockImplementation(async () => [...tabResponse]);
  }

  function setupResponseData(data?: object) {
    backendRequest.mockImplementation(async () => {
      const res = {
        json: async () => data || gradingSessionDetail,
      };
      return <Response>res;
    });
  }

  beforeEach(() => {
    backendRequest.mockClear();
    browser.tabs.query.mockClear();
  });

  it("fetches pk from backend", async () => {
    await syncRequestHandler(getEvent({ "data-pk": "2" }));
    expect(backendRequest).toHaveBeenCalledWith(`/grader/session/2/`);
  });
  it("sends response data to sendPerfSyncMsg", async () => {
    backendRequest.mockClear();
    backendRequest.mockImplementation(async () => {
      return <Response>{
        json: async () => ({
          foo: "bar",
        }),
      };
    });
    await syncRequestHandler(getEvent({ "data-pk": "2" }));
    expect(performSync).toHaveBeenCalledWith({ foo: "bar" });
  });
  it("catches errors", async () => {
    backendRequest.mockImplementation(() => {
      throw new Error("foo");
    });
    await syncRequestHandler(getEvent({ "data-pk": "2" }));
  });
  it("switches to the correct tab if the current one is wrong", async () => {
    setupTabs([
      {
        url: "https://facebook.com/",
        active: true,
      },
      {
        url: gradingSessionDetail.session.google_classroom_detail_view_url,
        active: false,
      },
    ]);
    setupResponseData({ foo: "bar" });
    await syncRequestHandler(getEvent({ "data-testid": "2" }));
    expect(browser.tabs.query).toHaveBeenCalledWith({ currentWindow: true });
    // TODO: finish implementing prepareToSync, and do the next three unit
    // tests
  });
  it("opens a new tab if there is not one already open", async () => {
    //
  });
  it("does not initiate syncing before confirming initialization of the content script", async () => {
    //
  });
});
