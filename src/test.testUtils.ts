import { getMockTabQueryFunc } from "./testUtils";

test("getMockTabQueryFunc", async () => {
  const tabs = [
    {
      url: "https://facebook.com/",
      active: true,
      windowId: 1,
      tabId: 2,
    },
    {
      url: "foo",
      active: false,
      windowId: 1,
      tabId: 1,
    },
  ];
  const func = getMockTabQueryFunc(tabs);
  expect(await func({ windowId: 1 })).toStrictEqual([
    {
      url: "https://facebook.com/",
      active: true,
      windowId: 1,
      tabId: 2,
    },
    {
      url: "foo",
      active: false,
      windowId: 1,
      tabId: 1,
    },
  ]);
  expect(await func({ tabId: 2 })).toStrictEqual([
    {
      url: "https://facebook.com/",
      active: true,
      windowId: 1,
      tabId: 2,
    },
  ]);
});
