import { test, expect } from "vitest";
import { formatSize } from "./format.ts";

test("formats bytes into human-readable units", () => {
  expect(formatSize(512)).toBe("512 B");
  expect(formatSize(2048)).toBe("2 KB");
  expect(formatSize(1536)).toBe("1.5 KB");
  expect(formatSize(5_000_000)).toBe("4.8 MB");
});
