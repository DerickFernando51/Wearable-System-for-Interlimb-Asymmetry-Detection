import '@testing-library/jest-dom';

declare global {
  var ResizeObserver: typeof ResizeObserver;
}

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
