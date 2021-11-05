import { wait } from "./util";

export enum MessageTypes {
  GET_TOKEN,
  PERFORM_SYNC,
  CLEAR_TOKEN,
  PING,
}

export type Message<T> = {
  kind: MessageTypes;
  payload?: T;
};

async function _sendMessage(do_: Message<any>) {
  return await browser.runtime.sendMessage(null, do_);
}

export async function getToken(): Promise<string> {
  return _sendMessage({ kind: MessageTypes.GET_TOKEN });
}

export async function getNewToken(): Promise<string> {
  return _sendMessage({ kind: MessageTypes.CLEAR_TOKEN });
}

export async function performSync(payload: any): Promise<boolean> {
  return _sendMessage({ payload, kind: MessageTypes.PERFORM_SYNC });
}

async function _pingContentScript() {
  try {
    return <boolean>await _sendMessage({ kind: MessageTypes.PING });
  } finally {
    return false;
  }
}

export async function contentScriptReady(
  retries: number = 0
): Promise<boolean> {
  const RETRY_INTERVAL = 200; // ms
  const MAX_RETRIES = 5;
  if (await _pingContentScript()) {
    return true;
  }
  await wait(RETRY_INTERVAL);
  if (retries > 5) {
    throw new Error(
      `content script did not prepare itself within ${
        RETRY_INTERVAL * MAX_RETRIES
      }`
    );
  }
  return await contentScriptReady(retries + 1);
}
