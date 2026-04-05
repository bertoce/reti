import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskCreationForm from "@/components/TaskCreationForm";

describe("TaskCreationForm", () => {
  it("renders the form with title input and category/priority selectors", () => {
    render(<TaskCreationForm onSubmit={() => {}} onClose={() => {}} />);

    expect(screen.getByTestId("task-creation-form")).toBeInTheDocument();
    expect(screen.getByTestId("task-title-input")).toBeInTheDocument();
    expect(screen.getByTestId("category-select")).toBeInTheDocument();
    expect(screen.getByTestId("priority-select")).toBeInTheDocument();
  });

  it("submit button is disabled when title is empty", () => {
    render(<TaskCreationForm onSubmit={() => {}} onClose={() => {}} />);

    const submitBtn = screen.getByTestId("submit-task");
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when title is filled", () => {
    render(<TaskCreationForm onSubmit={() => {}} onClose={() => {}} />);

    fireEvent.change(screen.getByTestId("task-title-input"), {
      target: { value: "Nueva tarea" },
    });

    expect(screen.getByTestId("submit-task")).not.toBeDisabled();
  });

  it("calls onSubmit with form data", () => {
    const onSubmit = vi.fn();
    render(<TaskCreationForm onSubmit={onSubmit} onClose={() => {}} />);

    fireEvent.change(screen.getByTestId("task-title-input"), {
      target: { value: "Comprar cemento" },
    });

    // Select expense category
    fireEvent.click(screen.getByText("Gasto"));

    // Select high priority
    fireEvent.click(screen.getByText("Alta"));

    fireEvent.click(screen.getByTestId("submit-task"));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Comprar cemento",
      category: "expense",
      priority: "high",
    });
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<TaskCreationForm onSubmit={() => {}} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("close-creation-form"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows all category options", () => {
    render(<TaskCreationForm onSubmit={() => {}} onClose={() => {}} />);

    expect(screen.getByText("Avance")).toBeInTheDocument();
    expect(screen.getByText("Problema")).toBeInTheDocument();
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Inspección")).toBeInTheDocument();
    expect(screen.getByText("Gasto")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("shows all priority options", () => {
    render(<TaskCreationForm onSubmit={() => {}} onClose={() => {}} />);

    expect(screen.getByText("Baja")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });
});
