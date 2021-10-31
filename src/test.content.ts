import { getParentTable } from "./content";

describe("getParentTable", () => {
  const getMockTable = () => {
    const el = document.createElement("table");
    el.setAttribute("aria-label", "Students");
    return el;
  };

  const insertTables = (nTables: number) => {
    Array(nTables)
      .fill(null)
      .forEach(() => {
        document.body.appendChild(getMockTable());
      });
  };

  it("finds the table", async () => {
    insertTables(1);
    const res = await getParentTable();
    expect(res).toContainHTML('<table aria-label="Students>');
  });

  it("retries if the table is missing for up to 1000ms", async () => {
    // the func will be called before the table has been created
    setTimeout(() => insertTables(1), 1000);

    // nonetheless, the result should be accurate due to internal re-trying
    const res = await getParentTable();
    expect(res).toContainHTML('<table aria-label="Students>');
  });

  it("resolves to an error and logs the error if there are too many tables", async () => {
    insertTables(3);
    expect(getParentTable).rejects.toThrowError();
  });
});
