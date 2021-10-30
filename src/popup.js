let AUTH_TOKEN = null;

async function getTabs() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function isLocationValid() {
  const tabs = await getTabs();
  console.log(tabs);
}

function performSync(e) {
  const pk = e.target.getAttribute("data-pk");
  chrome.runtime.sendMessage("PERFORM_SYNC", (res) => {});
}

function haltSync() {}

function openClassFast() {
  chrome.tabs.create({
    url: "http://localhost:8000/",
  });
}
document.body.addEventListener("htmx:configRequest", (event) => {
  if (AUTH_TOKEN) {
    event.detail.headers["Authorization"] = `Token ${AUTH_TOKEN}`;
    event.detail.headers["Accept"] = "text/html";
  }
});

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
const eventRegistry = [
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
        els.forEach((el) => {
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

chrome.runtime.sendMessage("GET_TOKEN", (res) => {
  AUTH_TOKEN = res;
});
