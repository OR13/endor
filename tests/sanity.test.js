const endor = require("../src/index.js");

it("module exposes functions", () => {
  expect(endor.help).toBeDefined();
});
