import {
  GradingSessionDetailResponse,
  logToBackend,
  backendRequest,
} from "./api";
import { BACKEND_BASE_URL } from "./constants";
import {
  BackgroundMessageTypes,
  contentScriptReady,
  RuntimeMsg,
  beginContentScriptSyncMsg,
} from "./messaging";
import { focusTab } from "./util";

/**
 * Any exported functions in this module should be guarded by this, because
 * they cannot be called outside the background script context.
 */
export function inBackgroundScript() {
  return browser.extension.getBackgroundPage() === window;
}

/**
 * checks localStorage for a token, or calls the login function to get one.
 */
export async function fetchToken(): Promise<string> {
  if (!inBackgroundScript()) {
    throw new Error("cannot call this method outside the background script");
  }
  try {
    const result: { ["token"]: string } | undefined =
      await browser.storage.sync.get("token");
    let tok: string | undefined = result?.token;
    if (!tok) {
      tok = await login();
      browser.storage.sync.set({ token: tok });
    }
    return tok;
  } catch (e) {
    logToBackend("failed to get token", null, e);
    return "";
  }
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

/**
 * Focus the user on the correct tab or create a new one such that they can
 * see the assignment they want to sync. await a ping from the content
 * script to confirm its readiness.
 */
async function prepareToSync(data: GradingSessionDetailResponse) {
  // first, try to find an existing tab we can switch to. We want to check
  // both the explicit UI url from the Classroom API, but also have the
  // flexibility to detect the `/u/<number>/` portion of google's url
  // patterns.
  const userUrlPattern = data.session.google_classroom_detail_view_url.replace(
    "/c/",
    "/u/*/c/"
  );
  const tab = await focusTab(
    [userUrlPattern],
    data.session.google_classroom_detail_view_url
  );
  return tab;
}

async function _unsafePerformSync(pk: string) {
  const res = await backendRequest(`/grader/session/${pk}/`);
  const gradingSessionData = <GradingSessionDetailResponse>await res.json();
  const tab = await prepareToSync(gradingSessionData);
  await contentScriptReady(tab.id);
  await beginContentScriptSyncMsg(gradingSessionData, tab.id);
}

async function performSync(pk: string): Promise<boolean> {
  try {
    await _unsafePerformSync(pk);
    return true;
  } catch (e) {
    logToBackend("failed to sync due to error", null, e);
    return false;
  }
}

async function handleMessage(msg: RuntimeMsg, _: any) {
  switch (msg.kind) {
    case BackgroundMessageTypes.GET_TOKEN:
      return fetchToken();
    case BackgroundMessageTypes.CLEAR_TOKEN:
      await clearToken();
      return fetchToken();
    case BackgroundMessageTypes.PERFORM_SYNC:
      return await performSync(msg.payload.pk);
  }
}

browser.runtime.onMessage.addListener(handleMessage);

export const exportedForTesting = {
  performSync,
  _unsafePerformSync,
};
