import { serializeError } from "serialize-error";

import { HtmxEventDetail } from "./htmxTypes";
import { applyPatch } from "./vendor/macWorkaround";
import {
  backendRequest,
  GradingSessionDetailResponse,
  logToBackend,
} from "./api";
import { contentScriptReady, getToken, performSync } from "./messaging";
import { BACKEND_BASE_URL } from "./constants";

/**
 * Indicate to the user that the sync action was successful
 */
function syncSuccessful() {}

/**
 * Indicate to the user that the sync action did not succeed
 */
function syncFailed() {}

/**
 * Called after we have validated that the current tab location is correct
 * and the content script is ready to begin syncing.
 */
async function beginSync(data: GradingSessionDetailResponse) {
  const isSuccess = await performSync(data);
  if (isSuccess) {
    syncSuccessful();
  } else {
    throw new Error("sync failed");
  }
}

/**
 * Navigate user to the correct url, and verify that the content script is
 * running.
 */
async function prepareToSync(data: GradingSessionDetailResponse) {
  const res = await browser.tabs.query({
    url: data.session.google_classroom_detail_view_url,
  });
  if (res.length) {
    const { tabId, windowId } = res[0];
    if (tabId && windowId) {
      await browser.windows.update(windowId, { focused: true });
      await browser.tabs.update(tabId, { active: true });
      await contentScriptReady();
      return;
    }
  }
  // fallthrough means that we need to create a new tab
  await browser.tabs.create({
    url: data.session.google_classroom_detail_view_url,
  });
  await contentScriptReady();
}

/* inner handler that does not catch errors */
async function _syncRequestHandlerUnsafe(e: Event) {
  if (!(e.target instanceof Element)) {
    syncFailed();
    return;
  }
  const pk = e.target.getAttribute("data-pk");

  const res = await backendRequest(`/grader/session/${pk}/`);
  const data = <GradingSessionDetailResponse>await res.json();

  await prepareToSync(data);
  await beginSync(data);
}

async function syncRequestHandler(e: Event) {
  try {
    await _syncRequestHandlerUnsafe(e);
    syncSuccessful();
  } catch (err) {
    logToBackend(`sync failed due to exception: ${err}`, serializeError(err));
    syncFailed();
  }
}

function haltSync() {}

function openClassFast() {
  browser.tabs.create({
    url: BACKEND_BASE_URL,
  });
}

/**
 * Apparently content-security policies are so DAMN psychophantic that they
 * won't allow anything fun or dynamic. Instead, we register all the event
 * listeners that will eventually listen for something in the DOM below. After
 * every swap, we attach listeners for anything that has arrived in the DOM.
 *
 * The third argument to addEventListener is useCapture. That means that the
 * first event listener will capture the event and stop its' propagation.
 * This helps in case we leak a listener by accident.
 */
const eventRegistry: Array<{
  selector: string;
  handler: EventListener;
  event: keyof HTMLElementEventMap;
  active?: boolean;
}> = [
  {
    selector: ".syncSessionButton",
    handler: syncRequestHandler,
    event: "click",
  },
  {
    selector: "#exitLoading",
    handler: haltSync,
    event: "click",
  },
  {
    selector: ".openClassFast",
    handler: openClassFast,
    event: "click",
  },
];
// initialize the eventRegistry for every item to be inactive
eventRegistry.forEach((d, i) => (eventRegistry[i] = { ...d, active: false }));

// update event listeners and eventRegistry on every htmx:afterSwap event
document.body.addEventListener("htmx:afterSwap", () => {
  eventRegistry.forEach(({ selector, handler, event, active }, index) => {
    if (!active) {
      // add event listener
      const els = document.querySelectorAll(selector);
      if (els.length !== 0) {
        els.forEach((el: HTMLElement) => {
          el.addEventListener(event, handler);
          // update registry
        });
        eventRegistry[index].active = true;
      }
    } else if (
      // if the element is gone, update the registry, so that we will not
      // skip adding the event listener if the element comes back
      !document.querySelector(selector)
    ) {
      eventRegistry[index].active = false;
    }
  });
});

let AUTH_TOKEN: string = "";
getToken().then((tok) => (AUTH_TOKEN = tok));
document.body.addEventListener(
  "htmx:configRequest",
  (event: CustomEvent<HtmxEventDetail>) => {
    event.detail.headers["Authorization"] = `Token ${AUTH_TOKEN}`;
    event.detail.headers["Accept"] = "text/html";
  }
);

document.addEventListener("DOMContentLoaded", () => {
  applyPatch();
});

export const exportedForTesting = {
  syncRequestHandler,
  _syncRequestHandlerUnsafe,
};
