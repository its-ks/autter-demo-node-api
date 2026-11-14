import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const lockfile = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
) as { packages: Record<string, { version?: string }> };

const fixedVersions: Record<string, string> = {
  tinypool: "2.1.1",
  "fast-uri": "3.1.4",
  fastify: "5.12.2",
  "find-my-way": "9.7.0",
  postcss: "8.5.18",
  "source-map-js": "1.2.2",
  vite: "7.3.7",
  zod: "4.6.6",
};

function versionAtLeast(actual: string, minimum: string): boolean {
  const parse = (value: string) =>
    value.split("-")[0].split(".").map((part) => Number(part));
  const a = parse(actual);
  const b = parse(minimum);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left > right;
  }
  return true;
}

describe("dependency security pins", () => {
  for (const [name, minimum] of Object.entries(fixedVersions)) {
    test(`${name} resolves to ${minimum} or newer`, () => {
      const versions = Object.entries(lockfile.packages)
        .filter(
          ([path]) =>
            path === `node_modules/${name}` ||
            path.endsWith(`/node_modules/${name}`),
        )
        .map(([, entry]) => entry.version)
        .filter((version): version is string => Boolean(version));

      expect(versions.length).toBeGreaterThan(0);
      for (const version of versions) {
        expect(
          versionAtLeast(version, minimum),
          `${name} resolved to ${version}, expected >= ${minimum}`,
        ).toBe(true);
      }
    });
  }
});