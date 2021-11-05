import { MessageTypes, Message } from "./messaging";
import { logToBackend } from "./api";
import { wait } from "./util";

/**
 * If we can find the parent table, we are able to do the rest of the sync
 * operation
 */
async function isReady(): Promise<boolean> {
  try {
    await getParentTable();
    return true;
  } finally {
    return false;
  }
}

/**
 * Return the table with all students in it.
 */
async function getParentTable(n_retries = 0): Promise<Element> {
  if (n_retries > 5) {
    throw new Error("cannot find parent table");
  }

  let possibleTables = document.querySelectorAll('[aria-label="Students"]');
  if (possibleTables.length === 0) {
    try {
      await wait(500);
      return await getParentTable(n_retries + 1);
    } catch (e) {
      const msg = "failed to get parent table";
      logToBackend(msg);
      throw new Error(msg);
    }
  }
  if (possibleTables.length === 1) {
    return possibleTables[0];
  }
  // fallthrough means we have an unexpected number of tables and need to
  // get word to the backend, because the extension is broken.
  const msg = [
    `expected zero or one tables, but received ${possibleTables.length}.`,
  ];
  try {
    // try to send string representations of the elements for additional context
    const stringRepresentations = [];
    for (let i = 0; i < possibleTables.length; i++) {
      const el = <HTMLElement>possibleTables[i].cloneNode(false);
      stringRepresentations.push(el.outerHTML);
    }
    msg.push(`tables: ${stringRepresentations.join(", ")}`);
  } catch (e) {}
  logToBackend(msg.join(", "));
  throw new Error(msg.join(" "));
}

/**
 * Return a boolean indicating success or failure.
 */
async function performSync(gradeData: object): Promise<boolean> {
  return true;
}

async function handleMessage(request: Message<any>, _?: any) {
  switch (request.kind) {
    case MessageTypes.PERFORM_SYNC:
      return await performSync(request.payload);
    case MessageTypes.PING:
      return await isReady();
  }
}

browser.runtime.onMessage.addListener(handleMessage);

export const exportedForTesting = {
  getParentTable,
  performSync,
  handleMessage,
};
