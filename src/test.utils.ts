import { wait } from "./utils";

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
