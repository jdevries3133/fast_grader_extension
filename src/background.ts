import { logToBackend } from "./utils";
import { BACKEND_BASE_URL } from "./constants";

export enum MessageTypes {
  GET_TOKEN,
  PERFORM_SYNC,
}

/**
 * Other modules consume this in order to send messages to this module, with
 * constrained types. browser.runtime.sendMessage should never be used directly
 */
export async function askBackgroundTo(do_: MessageTypes) {
  return browser.runtime.sendMessage(null, do_);
}

/**
 * checks localStorage for a token, or calls the login function to get one.
 */
async function getToken() {
  let tok = await browser.storage.sync.get("token");
  if (!tok) {
    tok = await login();
    browser.storage.sync.set({ token: tok.token });
  }
  return tok.token;
}

/**
 * returns an access key for our API, derived from the user's oauth access
 * token.
 */
async function login() {
  // the chrome identity api seems much easier than the generic browser
  // identiy API. i.e., you can just grab the token at any time, since users
  // are always logged in to chrome. When the time comes to launch the
  // extension on other platforms, this log call will remind me if I forget
  // to fix this!
  if (global.chrome === undefined) {
    logToBackend("chrome identity API is not present");
    return "";
  }
  return new Promise(async (resolve, reject) => {
    chrome.identity.getAuthToken(
      {
        interactive: true,
      },
      async (token) => {
        if (chrome.runtime.lastError) {
          logToBackend(
            `error while getting oauth token: ${chrome.runtime.lastError}`
          );
          reject("chrome error");
        }
        try {
          // we intentionally cannot call utils.backendRequest because
          // it depends on this function to provide the token
          const res = await fetch(
            `${BACKEND_BASE_URL}/accounts/dj_rest_auth/google/`,
            {
              method: "POST",
              body: JSON.stringify({ access_token: token }),
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const jsn = await res.json();
          resolve(jsn.key);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

async function handleMessage(request: MessageTypes, _: any) {
  switch (request) {
    case MessageTypes.GET_TOKEN:
      return getToken();
  }
  return true;
}

browser.runtime.onMessage.addListener(handleMessage);
