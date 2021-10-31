import { logToBackend, wait } from "./utils";

/**
 * Return the table with all students in it.
 */
export async function getParentTable(n_retries = 0): Promise<Element> {
  if (n_retries > 5) {
    throw new Error("cannot find parent table");
  }

  return new Promise(async (resolve, reject) => {
    let possibleTables = document.querySelectorAll('[aria-label="Students"]');
    if (possibleTables.length === 0) {
      try {
        await wait(500);
        return resolve(await getParentTable(n_retries + 1));
      } catch (e) {
        logToBackend("failed to get parent table");
      }
    }
    if (possibleTables.length === 1) {
      return resolve(possibleTables[0]);
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
    reject(new Error(msg.join(" ")));
  });
}
