import { sendMessage, MessageTypes } from "./messaging";
import { BACKEND_BASE_URL } from "./constants";

export async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function backendRequest(
  route: string,
  method: string,
  data?: object,
  headers?: HeadersInit
): Promise<Response> {
  const tok = await sendMessage({ kind: MessageTypes.GET_TOKEN });
  if (tok) {
    headers = {
      Authorization: `Token ${tok}`,
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
let wasDomDumped = false;
export async function logToBackend(
  msg: string,
  json?: object,
  dump_dom: boolean = false
): Promise<void> {
  const payload: { [k: string]: string | object } = {
    message: msg,
    extra_data: json,
  };
  if (dump_dom || !wasDomDumped) {
    wasDomDumped = true;
    payload.dom_dump = `<html>${document.head.outerHTML}${document.body.outerHTML}`;
  }
  try {
    const res = await backendRequest("/ext/log_error/", "POST", payload);
    console.log(await res.json());
  } catch (e) {
    console.log(e);
  }
}

/**
 * Check the current tab's location.
 */
export async function isLocationValid(): Promise<boolean> {
  // TODO: complete me
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  console.log(tabs);
  throw new Error("not implemented");
}
