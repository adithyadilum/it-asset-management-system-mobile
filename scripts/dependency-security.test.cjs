const test = require("node:test");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { dirname, delimiter } = require("node:path");
const projectRoot = dirname(require.resolve("../package.json"));
const { spawnSync } = require("node:child_process");

const jestRequire = createRequire(require.resolve("jest-config"));
const merge = jestRequire("deepmerge");
const routerRequire = createRequire(require.resolve("query-string"));
const decode = routerRequire("decode-uri-component");

test("merge backport prevents prototype poisoning from target and source objects", () => {
  const input = JSON.parse(
    '{"__proto__":{"polluted":true},"nested":{"__proto__":{"inherited":true},"valid":1}}',
  );
  for (const result of [
    merge(input, { other: 2 }),
    merge({}, input),
    merge.all([input, { other: 2 }]),
  ]) {
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.polluted, undefined);
    assert.equal(Object.getPrototypeOf(result.nested), Object.prototype);
    assert.equal(result.nested.inherited, undefined);
    assert.equal(result.nested.valid, 1);
  }
  assert.equal({}.polluted, undefined);
});
test("merge preserves config arrays, symbols, special values and custom array merging", () => {
  const symbol = Symbol("setting"),
    date = new Date("2026-11-06T00:00:00Z");
  const left = {
    list: [{ enabled: true }],
    nested: { existing: 1 },
    date,
    [symbol]: "value",
  };
  const right = { list: ["new"], nested: { added: 2 } };
  const result = merge(left, right);
  assert.deepEqual(result.list, [{ enabled: true }, "new"]);
  assert.notEqual(result.list[0], left.list[0]);
  assert.deepEqual(result.nested, { existing: 1, added: 2 });
  assert.equal(result.date, date);
  assert.equal(result[symbol], "value");
  assert.deepEqual(
    merge(left, right, { arrayMerge: (_target, source) => source }).list,
    ["new"],
  );
  assert.deepEqual(left.list, [{ enabled: true }]);
});
test("decoder remains a CommonJS function with tolerant UTF-8 decoding", () => {
  assert.equal(typeof decode, "function");
  assert.equal(decode("Nimasha%20Perera"), "Nimasha Perera");
  assert.equal(decode("%E0%B6%85"), "\u0d85");
  assert.equal(decode("%41%FF%42"), "A%FFB");
  assert.throws(() => decode(null), TypeError);
});
test("malformed URI runs complete within a bounded subprocess", () => {
  const script = `const {createRequire}=require('node:module'); const decode=createRequire(require.resolve('query-string'))('decode-uri-component'); for(const input of ['%FE%FF'.repeat(20000), '%41%FF'.repeat(20000), '%C2'.repeat(20000)]) { if(typeof decode(input)!=='string') process.exit(1); }`;
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: projectRoot,
    timeout: 5000,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});
test("fingerprint glob implementation respects an already aborted scan", async () => {
  const fingerprintRequire = createRequire(
    require.resolve("@expo/fingerprint"),
  );
  const { glob } = fingerprintRequire("glob");
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    glob("**/*", { cwd: projectRoot, signal: controller.signal }),
    { name: "AbortError" },
  );
});
test(
  "Expo can fingerprint the project with patched glob and minimatch APIs",
  { timeout: 120000 },
  async () => {
    const { createFingerprintAsync } = require("@expo/fingerprint");
    const originalPath = process.env.PATH;
    // Fingerprint starts helper processes using `node` from PATH. Keep the same
    // native executable when CI or a version manager launches this test.
    process.env.PATH = `${dirname(process.execPath)}${delimiter}${originalPath ?? ""}`;
    try {
      const result = await createFingerprintAsync(projectRoot, {
        platforms: ["android"],
        concurrentIoLimit: 4,
        silent: true,
      });
      assert.match(result.hash, /^[a-f0-9]{40}$/);
      assert.ok(
        result.sources.some(
          (source) => source.type === "contents" && source.id === "expoConfig",
        ),
      );
    } finally {
      if (originalPath === undefined) delete process.env.PATH;
      else process.env.PATH = originalPath;
    }
  },
);
