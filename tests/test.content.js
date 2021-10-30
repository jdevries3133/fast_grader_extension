const { wait, getParentTable } = require("../src/content");

test("wait", async () => {
  let foo = "bar";
  const CHANGE_FOO_AFTER = 5;
  setTimeout(() => (foo = "baz"), CHANGE_FOO_AFTER);

  // foo has not yet changed
  await wait(CHANGE_FOO_AFTER - 1);
  expect(foo).toBe("bar");

  // now, it has
  await wait(CHANGE_FOO_AFTER + 1);
  expect(foo).toBe("baz");
});

describe("getParentTable", () => {
  const makeTables = (nTables) => {
    el = '<div aria-label="Students"></div>';
    Array(nTables - 1)
      .fill(null)
      .forEach(() => {
        el += el;
      });
    document.body.innerHTML = el;
  };
  it("retries if the table is missing at first", async () => {
    setTimeout(() => makeTables(1), 100);
    const res = await getParentTable();
    expect(res).toContainHTML('<div aria-label="Students"></div>');
  });
});
