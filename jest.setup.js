import '@testing-library/jest-dom/extend-expect';

// Allow router mocks.
// eslint-disable-next-line no-undef
jest.mock('next/router', () => require('next-router-mock'));

// Polyfill Request/Response for Next.js App Router API route tests
// Node 18+ has these, but Jest environment may not expose them
if (typeof global.Request === 'undefined') {
  // Simple polyfill for Request
  global.Request = class Request {
    constructor(input, _init) {
      this.url = typeof input === 'string' ? input : input.url;
    }
  };
}

if (typeof global.Response === 'undefined') {
  // Simple polyfill for Response
  global.Response = class Response {
    constructor(body, init) {
      this.body = body ?? null;
      this.ok = (init?.status ?? 200) < 400;
      this.status = init?.status ?? 200;
    }
    async json() {
      return this.body ? JSON.parse(this.body) : {};
    }
  };
}
