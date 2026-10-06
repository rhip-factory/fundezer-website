import { describe, expect, test } from "bun:test";
import { getSiteNavigation } from "./site-navigation";

describe("signed-in navigation", () => {
  test("moves How it works into More only after login", () => {
    expect(getSiteNavigation(false).primary.map((link) => link.to)).toContain("/how-it-works");
    expect(getSiteNavigation(true).primary.map((link) => link.to)).not.toContain("/how-it-works");
    expect(getSiteNavigation(true).more.map((link) => link.to)).toContain("/how-it-works");
  });
  test("moves Partner hospitals into More only after login", () => {
    expect(getSiteNavigation(false).primary.map((link) => link.to)).toContain("/hospitals");
    expect(getSiteNavigation(true).primary.map((link) => link.to)).not.toContain("/hospitals");
    expect(getSiteNavigation(true).more.map((link) => link.to)).toContain("/hospitals");
  });
});