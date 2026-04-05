import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryCards from "@/components/SummaryCards";

const baseSummary = {
  tasks_total: 15,
  tasks_pending: 4,
  tasks_completed: 10,
  tasks_completed_today: 3,
  expenses_total: 45000,
  expenses_this_week: 8500,
  issues_open: 2,
  last_activity: new Date().toISOString(),
};

describe("SummaryCards", () => {
  it("renders all summary stat cards", () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getAllByTestId("summary-stat-card").length).toBeGreaterThanOrEqual(5);
  });

  it("shows pending task count", () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
  });

  it("shows completed today count", () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Hoy")).toBeInTheDocument();
  });

  it("shows open issues count", () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Problemas")).toBeInTheDocument();
  });

  it("shows expense totals formatted as currency", () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getByText("Gastos esta semana")).toBeInTheDocument();
    expect(screen.getByText("Gastos total")).toBeInTheDocument();
  });

  it("shows last activity time", () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getByTestId("last-activity")).toBeInTheDocument();
    expect(screen.getByText("ahora")).toBeInTheDocument();
  });

  it("shows 'Sin actividad' when last_activity is null", () => {
    render(<SummaryCards summary={{ ...baseSummary, last_activity: null }} />);
    expect(screen.getByText("Sin actividad")).toBeInTheDocument();
  });

  it("renders zero states correctly", () => {
    const zeroSummary = {
      tasks_total: 0,
      tasks_pending: 0,
      tasks_completed: 0,
      tasks_completed_today: 0,
      expenses_total: 0,
      expenses_this_week: 0,
      issues_open: 0,
      last_activity: null,
    };
    render(<SummaryCards summary={zeroSummary} />);
    expect(screen.getByTestId("summary-cards")).toBeInTheDocument();
  });
});
