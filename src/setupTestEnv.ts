//@ts-nocheck

import "@testing-library/jest-dom";
import "mockzilla-webextension";
import "mockzilla";

global.browser = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
  },
};
