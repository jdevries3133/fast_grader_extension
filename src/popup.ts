import { HtmxEventDetail } from "./htmxTypes";
import { applyPatch } from "./macWorkaround";

let AUTH_TOKEN: null | string = null;

async function isLocationValid() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  console.log(tabs);
}

function performSync(e: Event): void {
  if (e instanceof Element) {
    browser.runtime.sendMessage("PERFORM_SYNC");
  }
}

function haltSync() {}

function openClassFast() {
  browser.tabs.create({
    url: "http://localhost:8000/",
  });
}

document.body.addEventListener(
  "htmx:configRequest",
  async (event: CustomEvent<HtmxEventDetail>) => {
    while (!AUTH_TOKEN) {
      await wait(100);
    }
    if (AUTH_TOKEN) {
      event.detail.headers["Authorization"] = `Token ${AUTH_TOKEN}`;
      event.detail.headers["Accept"] = "text/html";
    }
  }
);

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
  AUTH_TOKEN = await browser.runtime.sendMessage("GET_TOKEN");
  applyPatch();
});
