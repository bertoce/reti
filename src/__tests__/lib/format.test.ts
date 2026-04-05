import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatRelativeTime,
  getCategoryLabel,
  getCategoryColor,
  getStatusLabel,
  getPriorityIndicator,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats MXN amounts", () => {
    const result = formatCurrency(1800);
    expect(result).toContain("1,800");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats large amounts", () => {
    const result = formatCurrency(150000);
    expect(result).toContain("150,000");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'ahora' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("ahora");
  });

  it("returns minutes for recent past", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("hace 5m");
  });

  it("returns hours for same-day past", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("hace 3h");
  });

  it("returns days for recent past", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe("hace 2d");
  });
});

describe("getCategoryLabel", () => {
  it("returns Spanish labels for all categories", () => {
    expect(getCategoryLabel("progress")).toBe("Avance");
    expect(getCategoryLabel("issue")).toBe("Problema");
    expect(getCategoryLabel("material")).toBe("Material");
    expect(getCategoryLabel("inspection")).toBe("Inspección");
    expect(getCategoryLabel("expense")).toBe("Gasto");
    expect(getCategoryLabel("general")).toBe("General");
  });

  it("returns the raw value for unknown categories", () => {
    expect(getCategoryLabel("unknown")).toBe("unknown");
  });
});

describe("getCategoryColor", () => {
  it("returns Tailwind classes for all categories", () => {
    const categories = ["progress", "issue", "material", "inspection", "expense", "general"];
    for (const cat of categories) {
      const color = getCategoryColor(cat);
      expect(color).toContain("bg-");
      expect(color).toContain("text-");
    }
  });

  it("returns gray for unknown categories", () => {
    expect(getCategoryColor("unknown")).toContain("gray");
  });
});

describe("getStatusLabel", () => {
  it("returns Spanish labels for all statuses", () => {
    expect(getStatusLabel("pending")).toBe("Pendiente");
    expect(getStatusLabel("in_progress")).toBe("En progreso");
    expect(getStatusLabel("completed")).toBe("Completado");
    expect(getStatusLabel("blocked")).toBe("Bloqueado");
  });
});

describe("getPriorityIndicator", () => {
  it("returns red circle for urgent", () => {
    expect(getPriorityIndicator("urgent")).toBe("🔴");
  });

  it("returns yellow circle for high", () => {
    expect(getPriorityIndicator("high")).toBe("🟡");
  });

  it("returns null for normal and low", () => {
    expect(getPriorityIndicator("normal")).toBeNull();
    expect(getPriorityIndicator("low")).toBeNull();
  });
});
