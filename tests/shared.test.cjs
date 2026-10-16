const assert = require("node:assert/strict");
const test = require("node:test");

require("../shared.js");
const { findMatch, mapPageUrl, normalizeBaseUrl, validateApps } = globalThis.EnvSwitcher;

test("normalizes valid site-root URLs", () => {
  assert.equal(normalizeBaseUrl(" https://localhost:3000/ "), "https://localhost:3000");
});

test("rejects unsupported protocols and non-root URLs", () => {
  assert.throws(() => normalizeBaseUrl("file:///tmp/app"), /http:\/\/ or https:\/\//);
  assert.throws(() => normalizeBaseUrl("https://example.com/app"), /site root/);
});

test("finds the matching app and environment by exact origin", () => {
  const apps = [{
    name: "Storefront",
    environments: [
      { name: "Dev", url: "https://devserver" },
      { name: "Local", url: "https://localhost:3000" }
    ]
  }];

  assert.deepEqual(findMatch("https://devserver/products/1", apps), {
    app: apps[0],
    environment: apps[0].environments[0]
  });
  assert.equal(findMatch("https://devserver.example/products/1", apps), null);
});

test("maps a page while preserving path, query, and hash", () => {
  assert.equal(
    mapPageUrl(
      "https://devserver/random-page?view=compact#details",
      "https://localhost:3000/"
    ),
    "https://localhost:3000/random-page?view=compact#details"
  );
});

test("rejects duplicate environment base URLs", () => {
  assert.match(
    validateApps([{
      name: "App",
      environments: [
        { name: "Dev", url: "https://example.com" },
        { name: "Local", url: "https://example.com/" }
      ]
    }]),
    /already assigned/
  );
});
