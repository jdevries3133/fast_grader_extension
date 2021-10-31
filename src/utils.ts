import { BACKEND_BASE_URL } from "./constants";
/**
 * Ask background script for auth token
 */
async function getAuthToken(): Promise<string> {
  return new Promise((resolve) => {
    try {
      browser.runtime.sendMessage("GET_TOKEN", (response: string) => {
        resolve(response);
      });
    } catch (e) {}
  });
}

export async function backendRequest(
  route: string,
  method: string,
  data?: object,
  headers?: HeadersInit
): Promise<Response> {
  const tok = getAuthToken();
  if (tok) {
    headers = {
      Authorization: `Token ${await getAuthToken()}`,
      "Content-Type": "application/json",
      ...headers,
    };
  }
  const uri = BACKEND_BASE_URL + route;
  return fetch(uri, {
    method,
    headers,
    body: JSON.stringify(data),
  });
}

/**
 * Send log message with some standard context to the backend. The first
 * log will also dump the DOM to the backend for debugging.
 */
export async function logToBackend(
  msg: string,
  json: object,
  dump_dom: boolean = false
): Promise<void> {
  const payload: { [k: string]: string | object } = {
    message: msg,
    extra_data: json,
  };
  if (dump_dom) {
    payload.dom_dump = `<html>${document.head.outerHTML}${document.body.outerHTML}`;
  }
  backendRequest("/ext/log_error/", "POST", payload);
}
