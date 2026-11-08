import { describe, expect, it } from "vitest";
import { moveRecipeLine } from "./recipeEditor";

describe("recipe editor list controls", () => {
  it("moves a selected line while keeping the other lines ordered", () => {
    expect(moveRecipeLine(["milk", "coffee", "sugar"], 1, -1)).toEqual(["coffee", "milk", "sugar"]);
  });

  it("keeps a line in place when moving beyond either end", () => {
    expect(moveRecipeLine(["milk", "coffee"], 0, -1)).toEqual(["milk", "coffee"]);
    expect(moveRecipeLine(["milk", "coffee"], 1, 1)).toEqual(["milk", "coffee"]);
  });
});
