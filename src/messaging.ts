export enum MessageTypes {
  GET_TOKEN,
  PERFORM_SYNC,
  CLEAR_TOKEN,
}

export type Message<T> = {
  kind: MessageTypes;
  payload?: T;
};

/**
 * Other modules consume this in order to send messages to this module, with
 * constrained types. browser.runtime.sendMessage should never be used directly
 */
export async function sendMessage(do_: Message<any>) {
  return await browser.runtime.sendMessage(null, do_);
}

export async function getToken(): Promise<string> {
  return sendMessage({ kind: MessageTypes.GET_TOKEN });
}

export async function getNewToken(): Promise<string> {
  return sendMessage({ kind: MessageTypes.CLEAR_TOKEN });
}
