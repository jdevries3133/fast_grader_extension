/******************************************************************************
 * utils
 */

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function logError(...msg) {
  logToBackend(msg.join(" "));
  console.error(msg);
}

/******************************************************************************
 * DOM interaction
 */

/**
 * Return the table with all students in it.
 */
async function getParentTable(n_retries = 0) {
  if (n_retries > 5) {
    throw new Error("cannot find parent table");
  }

  return new Promise(async (resolve, reject) => {
    let possibleTables = document.querySelectorAll('[aria-label="Students"]');
    if (possibleTables.length === 0) {
      try {
        await wait(500);
        return resolve(await getParentTable(n_retries + 1));
      } catch (e) {
        logError("failed to get parent table");
      }
    }
    if (possibleTables.length === 1) {
      return resolve(possibleTables[0]);
    }
    // fallthrough means we have an unexpected number of tables and need to
    // get word to the backend, because the extension is broken.
    const msg = [
      `expected zero or one tables, but received ${possibleTables.length}.`,
    ];
    try {
      // try to send string representations of the elements for additional context
      const stringRepresentations = [];
      for (let i = 0; i < possibleTables.length; i++) {
        stringRepresentations.push(
          possibleTables[i].cloneNode(false).outerHTML
        );
      }
      msg.push(`tables: ${stringRepresentations.join(", ")}`);
    } catch (e) {}
    logError(...msg);
    reject();
  });
}

/******************************************************************************
 * api connectors
 */

/**
 * Ask background script for auth token
 *
 * @returns {string || null}
 */
async function getAuthToken() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage("GET_TOKEN", (response) => {
        resolve(response);
      });
    } catch (e) {}
  });
}

async function backendRequest(route, method, data, headers) {
  const tok = getAuthToken();
  if (tok) {
    headers = {
      Authorization: `Token ${await getAuthToken()}`,
      "Content-Type": "application/json",
      ...headers,
    };
  }
  return fetch(`http://localhost:8000${route}`, {
    method,
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Send log message with some standard context to the backend. The first
 * log will also dump the DOM to the backend for debugging.
 */
const wasDomDumped = false;
async function logToBackend(msg, json = null) {
  backendRequest("/ext/log_error/", "POST", {
    message: msg,
    extra_data: json,
    dom_dump: `<html>${document.head.outerHTML}${document.body.outerHTML}`,
  });
}

module.exports = {
  wait,
  getParentTable,
};
