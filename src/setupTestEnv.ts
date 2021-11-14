//@ts-nocheck

import "@testing-library/jest-dom";
import "mockzilla-webextension";
import "mockzilla";

import { getMockTabQueryFunc } from "./testUtils";

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
    query: jest.fn().mockImplementation(getMockTabQueryFunc()),
    update: jest.fn(),
  },
  windows: {
    update: jest.fn(),
  },
  extension: {
    getBackgroundPage: jest.fn(),
  },
};

global.browser = browserMocks;

export const fetchMock = jest.fn();
global.fetch = fetchMock;
