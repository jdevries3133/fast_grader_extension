import { logToBackend } from "./api";
import { BACKEND_BASE_URL } from "./constants";
import { MessageTypes, Message } from "./messaging";

/**
 * checks localStorage for a token, or calls the login function to get one.
 */
async function fetchToken(): Promise<string> {
  const result: { ["token"]: string } | undefined =
    await browser.storage.sync.get("token");
  let tok: string | undefined = result?.token;
  if (!tok) {
    tok = await login();
    browser.storage.sync.set({ token: tok });
  }
  return tok;
}

/**
 * Remove the localStorage token, which must be done, for example, in cases
 * where the token causes a 403 error.
 */
async function clearToken(): Promise<null> {
  try {
    return await browser.storage.sync.remove("token");
  } catch (e) {
    logToBackend("failed to remove token");
  }
}

/**
 * returns an access key for our API, derived from the user's oauth access
 * token.
 */
async function login(nRetries = 0): Promise<string> {
  // the chrome identity api seems much easier than the generic browser
  // identiy API. i.e., you can just grab the token at any time, since users
  // are always logged in to chrome. When the time comes to launch the
  // extension on other platforms, this log call will remind me if I forget
  // to fix this!
  if (global.chrome === undefined) {
    logToBackend("chrome API is not present");
    return "";
  }
  return new Promise(async (resolve) => {
    chrome.identity.getAuthToken(
      {
        interactive: true,
      },
      async (token) => {
        if (chrome.runtime.lastError) {
          logToBackend(
            `error while getting oauth token: ${chrome.runtime.lastError}`
          );
          resolve(null);
        }
        if (token === null || token === undefined) {
          logToBackend(
            "chrome identity api called callback with null or undefined token"
          );
          resolve(null);
        }
        try {
          // we intentionally cannot call api.backendRequest because
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
          if (nRetries < 5) {
            return login();
          } else {
            resolve(null);
          }
        }
      }
    );
  });
}

async function handleMessage(
  message: Message<any>,
  // TODO: this arg contains details about who the message is coming from,
  // which must be read to validate against XSS via out-of-band messages
  _: any
) {
  debugger;
  switch (message.kind) {
    case MessageTypes.GET_TOKEN:
      return fetchToken();
    case MessageTypes.CLEAR_TOKEN:
      await clearToken();
      return fetchToken();
  }
  return null;
}

browser.runtime.onMessage.addListener(handleMessage);
