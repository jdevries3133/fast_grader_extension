//@ts-nocheck

import "@testing-library/jest-dom";
import "mockzilla-webextension";
import "mockzilla";

export const browserMocks = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getPlatformInfo: jest.fn(),
  },
  storage: {
    sync: {
      set: jest.fn(),
      get: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
  },
  windows: {
    update: jest.fn(),
  },
};

global.browser = browserMocks;

export const fetchMock = jest.fn();
global.fetch = fetchMock;
