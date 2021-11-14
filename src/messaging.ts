import { GradingSessionDetailResponse } from "./api";
import { wait } from "./util";

/**
 * Messages received from the background script
 */
export enum BackgroundMessageTypes {
  GET_TOKEN,
  CLEAR_TOKEN,
  PERFORM_SYNC,
}

/**
 * Messages received by the content script
 */
export enum ContentMessageTypes {
  PING,
  SYNC,
}

export type RuntimeMsg = {
  kind: BackgroundMessageTypes;
  payload?: any;
};

export type TabMsg = {
  kind: ContentMessageTypes;
  payload?: any;
};

async function tabMessage(msg: TabMsg, tabId: number) {
  return await browser.tabs.sendMessage(tabId, msg);
}

async function runtimeMessage(msg: RuntimeMsg) {
  return await browser.runtime.sendMessage(null, msg);
}

export async function getTokenMsg(): Promise<string> {
  return runtimeMessage({ kind: BackgroundMessageTypes.GET_TOKEN });
}

export async function getNewTokenMsg(): Promise<string> {
  return runtimeMessage({ kind: BackgroundMessageTypes.CLEAR_TOKEN });
}

export async function performSyncMsg(pk: string): Promise<boolean> {
  return runtimeMessage({
    payload: { pk },
    kind: BackgroundMessageTypes.PERFORM_SYNC,
  });
}

export async function beginContentScriptSyncMsg(
  data: GradingSessionDetailResponse,
  tabId: number
) {
  const msg: TabMsg = {
    kind: ContentMessageTypes.SYNC,
    payload: data,
  };
  return await tabMessage(msg, tabId);
}

async function _pingContentScript(tabId: number): Promise<boolean> {
  try {
    return <boolean>await tabMessage({ kind: ContentMessageTypes.PING }, tabId);
  } finally {
    return false;
  }
}

export async function contentScriptReady(
  tabId: number,
  retries: number = 0
): Promise<boolean> {
  const RETRY_INTERVAL = 200; // ms
  const MAX_RETRIES = 5;
  if (await _pingContentScript(tabId)) {
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
