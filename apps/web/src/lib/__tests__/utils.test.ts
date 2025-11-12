import { deepEqual } from "../utils";

describe("deepEqual", () => {
  it("returns true for identical primitive values", () => {
    expect(deepEqual("test", "test")).toBe(true);
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
  });

  it("returns false for different primitive values", () => {
    expect(deepEqual("test", "other")).toBe(false);
    expect(deepEqual(42, 43)).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it("returns true for identical arrays", () => {
    expect(deepEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("returns false for arrays with different values", () => {
    expect(deepEqual(["a", "b"], ["a", "c"])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("returns false for arrays with same values in different order", () => {
    expect(deepEqual(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("handles null and undefined correctly", () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, "value")).toBe(false);
  });

  it("handles empty arrays", () => {
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual([], ["a"])).toBe(false);
  });

  it("returns false for reference equality on objects", () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(false);
  });
});
