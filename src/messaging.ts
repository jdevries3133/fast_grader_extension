export enum MessageTypes {
  GET_TOKEN,
  PERFORM_SYNC,
  CLEAR_TOKEN,
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
