import { describe, expect, it } from "bun:test";
import { relativeTime } from "./relativeTime";

const sec = 1_000;
const min = 60 * sec;
const hour = 60 * min;
const day = 24 * hour;
const month = 30 * day;

describe("relativeTime", () => {
  it.each<{ desc: string; offsetMs: number; expected: string }>([
    { desc: "just now (0 seconds)",  offsetMs: 0,          expected: "now" },
    { desc: "30 seconds ago",        offsetMs: -30 * sec,  expected: "30 seconds ago" },
    { desc: "1 minute ago",          offsetMs: -min,       expected: "1 minute ago" },
    { desc: "45 minutes ago",        offsetMs: -45 * min,  expected: "45 minutes ago" },
    { desc: "1 hour ago",            offsetMs: -hour,      expected: "1 hour ago" },
    { desc: "5 hours ago",           offsetMs: -5 * hour,  expected: "5 hours ago" },
    { desc: "yesterday",             offsetMs: -day,       expected: "yesterday" },
    { desc: "3 days ago",            offsetMs: -3 * day,   expected: "3 days ago" },
    { desc: "last month",            offsetMs: -month,     expected: "last month" },
    { desc: "3 months ago",          offsetMs: -3 * month, expected: "3 months ago" },
  ])("$desc", ({ offsetMs, expected }) => {
    expect(relativeTime(Date.now() + offsetMs)).toBe(expected);
  });
});
