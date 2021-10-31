/**
 * Promise-based wrapper for chrome.storage.sync.get
 */
function getStorageValue(key) {
  return new Promise((resolve) =>
    chrome.storage.sync.get([key], (val) => resolve(val[key]))
  );
}

/**
 * Promise-based wrapper for chrome.storage.sync.set
 */
function setStorageValue(key, value) {
  return new Promise((resolve) =>
    chrome.storage.sync.set({ [key]: value }, (result) => resolve(result))
  );
}

/**
 * checks localStorage for a token, or calls the login function to get one.
 */
async function getToken() {
  let tok = await getStorageValue("token");
  if (!tok) {
    tok = await login();
    setStorageValue("token", tok);
  }
  return tok;
}

/**
 * returns an access key for our API, derived from the user's oauth access
 * token.
 */
async function login() {
  return new Promise(async (resolve, reject) => {
    chrome.identity.getAuthToken(
      {
        interactive: true,
      },
      async (token) => {
        if (chrome.runtime.lastError) {
          return;
        }
        try {
          res = await fetch(
            "http://localhost:8000/accounts/dj_rest_auth/google/",
            {
              method: "POST",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                access_token: token,
              }),
            }
          );
          jsn = await res.json();
          resolve(jsn.key);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

function handleMessage(request, sender, sendResponse) {
  switch (request) {
    case "GET_TOKEN":
      getToken().then((tok) => sendResponse(tok));
      break;
  }
  return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
