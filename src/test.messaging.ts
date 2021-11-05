import {
  MessageTypes,
  Message,
  getToken,
  getNewToken,
  performSync,
} from "./messaging";

jest.mock("./messaging", () => {
  const original = jest.requireActual("./messaging");
  return {
    ...original,
    _pingContentScript: jest.fn(),
  };
});

describe("messaging methods", () => {
  test("getToken", async () => {
    const expectedMsg: Message<void> = {
      kind: MessageTypes.GET_TOKEN,
    };
    await getToken();
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(null, expectedMsg);
  });
  test("getNewToken", async () => {
    const expectedMsg: Message<void> = {
      kind: MessageTypes.CLEAR_TOKEN,
    };
    await getNewToken();
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(null, expectedMsg);
  });
  test("performSync", async () => {
    const expectedMsg: Message<object> = {
      kind: MessageTypes.PERFORM_SYNC,
      payload: {
        submissions: [
          {
            name: "john",
            grade: 45,
            comment: "wohoo",
          },
        ],
      },
    };
    await performSync(expectedMsg.payload);
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith(null, expectedMsg);
  });
});
