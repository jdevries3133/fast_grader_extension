import { wait } from "./util";
import { getParentTable } from "./content";
import { logToBackend } from "./api";

jest.mock("./util");
jest.mock("./api");

// placate typescript
const _mockWait = <any>wait;
const mockWait = <jest.Mock<typeof wait>>_mockWait;

const { wait: originalWait } = jest.requireActual("./util");

mockWait.mockImplementation((n) => originalWait(Math.floor(n / 4)));

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

  afterEach(() => {
    document.getElementsByTagName("html")[0].innerHTML = "";
  });

  it("finds the table", async () => {
    insertTables(1);
    const res = await getParentTable().catch((e) => {
      throw new Error(e);
    });
    expect(res).toContainHTML('<table aria-label="Students>');
  });

  it("retries if the table is missing at first", async () => {
    // the func will be called before the table has been created
    setTimeout(() => insertTables(1), 200);

    // nonetheless, the result should be accurate due to internal re-trying
    const res = await getParentTable();
    expect(res).toContainHTML('<table aria-label="Students>');
  });

  it("resolves to an error and logs the error if there are too many tables", async () => {
    insertTables(3);
    await expect(getParentTable()).rejects.toThrow();
  });

  it("stops recursing after 5 tries, and throws an error", async () => {
    // @ts-ignore
    mockWait.mockImplementation(async () => null);

    await expect(getParentTable()).rejects.toThrow();
    expect(logToBackend).toHaveBeenCalledWith("failed to get parent table");
  });
});
