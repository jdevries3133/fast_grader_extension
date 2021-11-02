import { HtmxEventDetail } from "./htmxTypes";
import { applyPatch } from "./macWorkaround";
import { getToken, sendMessage, MessageTypes } from "./messaging";
import { BACKEND_BASE_URL } from "./constants";

async function performSync(e: Event) {
  if (e instanceof Element) {
    const result = await sendMessage({
      kind: MessageTypes.PERFORM_SYNC,
      payload: {},
    });
    console.log(result);
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
type EventName = keyof HTMLElementEventMap;
const eventRegistry: Array<{
  selector: string;
  handler: EventListener;
  event: EventName;
  active?: boolean;
}> = [
  {
    selector: ".syncSessionButton",
    handler: performSync,
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

document.addEventListener("DOMContentLoaded", async () => {
  applyPatch();
});

document.body.addEventListener(
  "htmx:configRequest",
  async (event: CustomEvent<HtmxEventDetail>) => {
    try {
      const token = await getToken();
      event.detail.headers["Authorization"] = `Token ${token}`;
      event.detail.headers["Accept"] = "text/html";
    } catch (e) {
      console.error(e);
    }
  }
);
