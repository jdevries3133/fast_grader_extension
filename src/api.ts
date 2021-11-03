import { sendMessage, MessageTypes } from "./messaging";
import { BACKEND_BASE_URL } from "./constants";

export async function backendRequest(
  route: string,
  method: string,
  data?: object,
  headers?: HeadersInit
): Promise<Response> {
  let tok: string = "";
  try {
    tok = await sendMessage({ kind: MessageTypes.GET_TOKEN });
  } catch (e) {}

  headers = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (tok) {
    headers = { Authorization: `Token ${tok}`, ...headers };
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
  json?: object,
  dumpDom: boolean = false
): Promise<void> {
  const payload: { [k: string]: string | object } = {
    message: msg,
  };
  if (json) {
    payload.extra_data = json;
  }
  if (dumpDom) {
    payload.dom_dump = `<html>${document.head.outerHTML}${document.body.outerHTML}`;
  }
  try {
    await backendRequest("/ext/log_error/", "POST", payload);
  } finally {
    // just cry; there's nothing more we can do
  }
}
