import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivityFeed from "@/components/ActivityFeed";
import { type SiteTask } from "@/lib/supabase";

function makeTask(overrides: Partial<SiteTask> = {}): SiteTask {
  return {
    id: "task-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    title: "Test task",
    description: null,
    category: "progress",
    status: "completed",
    priority: "normal",
    expense_amount: null,
    expense_currency: "MXN",
    expense_vendor: null,
    expense_items: null,
    receipt_url: null,
    photos: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ActivityFeed", () => {
  const sampleTasks = [
    makeTask({ id: "t1", title: "Colado terminado", category: "progress" }),
    makeTask({ id: "t2", title: "Compra cemento", category: "expense", expense_amount: 1800 }),
    makeTask({ id: "t3", title: "Falta varilla", category: "issue", priority: "high" }),
  ];

  it("renders activity items", () => {
    render(<ActivityFeed tasks={sampleTasks} />);
    expect(screen.getAllByTestId("activity-item")).toHaveLength(3);
  });

  it("shows task titles", () => {
    render(<ActivityFeed tasks={sampleTasks} />);
    expect(screen.getByText("Colado terminado")).toBeInTheDocument();
    expect(screen.getByText("Compra cemento")).toBeInTheDocument();
    expect(screen.getByText("Falta varilla")).toBeInTheDocument();
  });

  it("shows expense amounts for expense tasks", () => {
    render(<ActivityFeed tasks={sampleTasks} />);
    expect(screen.getByTestId("feed-expense-amount")).toBeInTheDocument();
  });

  it("shows category badges", () => {
    render(<ActivityFeed tasks={sampleTasks} />);
    expect(screen.getByText("Avance")).toBeInTheDocument();
    expect(screen.getByText("Gasto")).toBeInTheDocument();
    expect(screen.getByText("Problema")).toBeInTheDocument();
  });

  it("shows priority indicator for high priority tasks", () => {
    render(<ActivityFeed tasks={sampleTasks} />);
    const feed = screen.getByTestId("activity-feed");
    expect(feed.textContent).toContain("🟡");
  });

  it("shows photo previews when task has photos", () => {
    const withPhotos = [
      makeTask({
        id: "t1",
        title: "Con fotos",
        photos: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
      }),
    ];
    render(<ActivityFeed tasks={withPhotos} />);
    expect(screen.getByTestId("feed-photos")).toBeInTheDocument();
  });

  it("shows +N indicator for more than 3 photos", () => {
    const manyPhotos = [
      makeTask({
        id: "t1",
        title: "Muchas fotos",
        photos: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
          "https://example.com/4.jpg",
          "https://example.com/5.jpg",
        ],
      }),
    ];
    render(<ActivityFeed tasks={manyPhotos} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("shows empty state when no tasks", () => {
    render(<ActivityFeed tasks={[]} />);
    expect(screen.getByTestId("empty-feed")).toBeInTheDocument();
  });
});
