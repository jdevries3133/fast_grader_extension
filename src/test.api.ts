import { fetchMock } from "./setupTestEnv";
import { logToBackend, backendRequest } from "./api";
import { sendMessage } from "./messaging";

jest.mock("./messaging");
const sendMessageAny = <any>sendMessage;
const mockSendMessage = <jest.Mock<typeof sendMessageAny>>sendMessageAny;

describe("logToBackend", () => {
  beforeAll(() => fetchMock.mockClear());
  afterEach(() => fetchMock.mockClear());

  it("causes a network request to /ext/log_error", async () => {
    await logToBackend("foo");
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/ext/log_error/", {
      body: '{"message":"foo"}',
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("responds to dumDom=true", async () => {
    await logToBackend("foo", null, true);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/ext/log_error/", {
      body: '{"message":"foo","dom_dump":"<html><head></head><body></body>"}',
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("responds to dumpDom=false", async () => {
    await logToBackend("foo", null, false);
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/ext/log_error/", {
      body: '{"message":"foo"}',
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("sends extra data when provided", async () => {
    await logToBackend("foo", {
      extra: "data",
    });
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/ext/log_error/", {
      body: '{"message":"foo","extra_data":{"extra":"data"}}',
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });
});

describe("backendRequest", () => {
  enum fetchOpts {
    "SUCCEED",
    "FAIL",
    "THROW",
  }
  function makeFetch(action: fetchOpts, errMsg?: string) {
    switch (action) {
      case fetchOpts.SUCCEED:
        fetchMock.mockImplementation(() => ({ status: 200 }));
        break;
      case fetchOpts.FAIL:
        fetchMock.mockImplementation(() => ({ status: 400 }));
        break;
      case fetchOpts.THROW:
        fetchMock.mockImplementation(() => {
          throw new Error(errMsg || "foo");
        });
    }
  }
  beforeAll(() => {
    fetchMock.mockClear();
  });
  afterEach(() => fetchMock.mockClear());

  it("sends request to backend with fetch api", async () => {
    makeFetch(fetchOpts.SUCCEED);
    const res = await backendRequest("", "GET");
    expect(res.status).toBe(200);
  });
  it("does not swallow thrown errors", async () => {
    makeFetch(fetchOpts.THROW);
    try {
      await backendRequest("", "GET");

      fail("backendRequest swallowed error thrown from fetch");
    } catch (e) {
      expect(e.message).toBe("foo");
    }
  });
  it("gets the auth token and includes it as a request header", async () => {
    makeFetch(fetchOpts.SUCCEED);
    mockSendMessage.mockImplementation(async () => "footoken");

    await backendRequest("", "GET");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000", {
      body: undefined,
      headers: {
        Authorization: "Token footoken",
        "Content-Type": "application/json",
      },
      method: "GET",
    });
  });
  it("still sends a request if the token is absent", async () => {
    makeFetch(fetchOpts.SUCCEED);
    mockSendMessage.mockImplementation(async () => null);

    await backendRequest("", "GET");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8000", {
      body: undefined,
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
    });
  });

  it("handles exceptions from sendMessage", async () => {
    makeFetch(fetchOpts.SUCCEED);
    mockSendMessage.mockImplementation(async () => {
      throw new Error("foo");
    });

    try {
      await backendRequest("", "GET");
      expect(fetch).toHaveBeenCalledWith("http://localhost:8000", {
        body: undefined,
        headers: {
          "Content-Type": "application/json",
        },
        method: "GET",
      });
    } catch (e) {
      throw new Error(
        `backendRequest failed to catch exception from sendMessage: ${e}`
      );
    }
  });
});
