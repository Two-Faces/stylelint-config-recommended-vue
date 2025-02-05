"use strict";

const { fail } = require("assert");
const cp = require("child_process");
const path = require("path");
const fs = require("fs");
const semver = require("semver");

cp.execSync("npm pack", { stdio: "inherit" });
const orgTgzName = path.resolve(
  `two-faces-stylelint-config-recommended-vue-${
    require("../../package.json").version
  }.tgz`,
);
const tgzName = path.resolve(
  `two-faces-stylelint-config-recommended-vue-test.tgz`,
);
if (fs.existsSync(tgzName)) {
  fs.unlinkSync(tgzName);
}
fs.renameSync(orgTgzName, tgzName);

const STYLELINT = `.${path.sep}node_modules${path.sep}.bin${path.sep}stylelint`;

const FIXTURES_ROOT_DIR = path.join(__dirname, "../fixtures/integrations");
for (const entry of fs.readdirSync(FIXTURES_ROOT_DIR, {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) {
    continue;
  }
  const fixtureDir = path.join(FIXTURES_ROOT_DIR, entry.name);
  const pkg = JSON.parse(
    fs.readFileSync(path.join(fixtureDir, "package.json"), "utf8"),
  );

  if (pkg.engines && pkg.engines.node) {
    if (!semver.satisfies(process.version, pkg.engines.node)) {
      continue;
    }
  }

  describe(`Integration for ${entry.name}`, () => {
    let originalCwd;

    before(() => {
      originalCwd = process.cwd();
      process.chdir(fixtureDir);
      cp.execSync(`npm i ${tgzName}`, { stdio: "inherit" });
      cp.execSync(
        "npx rimraf ./node_modules/two-faces-stylelint-config-recommended-vue",
        { stdio: "inherit" },
      );
      cp.execSync("npm i", { stdio: "inherit" });
    });
    after(() => {
      process.chdir(originalCwd);
    });

    it("should lint without errors", () => {
      cp.execSync(`${STYLELINT} src/valid.vue`, { stdio: "inherit" });
    });
    it("should lint with errors", () => {
      try {
        cp.execSync(`${STYLELINT} src/invalid.vue`, {
          stdio: "inherit",
        });
      } catch {
        // Expected!
        return;
      }
      fail("Expect an error, but without errors");
    });
  });
}
