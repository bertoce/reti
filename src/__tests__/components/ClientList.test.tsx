import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClientList from "@/components/ClientList";
import { type Client } from "@/lib/supabase";

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    name: "Juan López",
    phone: "+5215551234567",
    unit: null,
    opted_in: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ClientList", () => {
  it("shows empty state when no clients", () => {
    render(<ClientList clients={[]} selectedIds={[]} onToggleSelect={() => {}} />);
    expect(screen.getByTestId("no-clients")).toBeInTheDocument();
  });

  it("renders client items", () => {
    const clients = [
      makeClient({ id: "c1", name: "Juan" }),
      makeClient({ id: "c2", name: "María" }),
    ];
    render(<ClientList clients={clients} selectedIds={[]} onToggleSelect={() => {}} />);
    expect(screen.getAllByTestId("client-item")).toHaveLength(2);
  });

  it("shows client name and phone", () => {
    render(
      <ClientList
        clients={[makeClient({ name: "Juan López", phone: "+5215551234567" })]}
        selectedIds={[]}
        onToggleSelect={() => {}}
      />
    );
    expect(screen.getByText("Juan López")).toBeInTheDocument();
    expect(screen.getByText(/5215551234567/)).toBeInTheDocument();
  });

  it("shows unit when provided", () => {
    render(
      <ClientList
        clients={[makeClient({ unit: "Casa 3" })]}
        selectedIds={[]}
        onToggleSelect={() => {}}
      />
    );
    expect(screen.getByText(/Casa 3/)).toBeInTheDocument();
  });

  it("shows opted-out badge for non-opted clients", () => {
    render(
      <ClientList
        clients={[makeClient({ opted_in: false })]}
        selectedIds={[]}
        onToggleSelect={() => {}}
      />
    );
    expect(screen.getByTestId("opted-out-badge")).toBeInTheDocument();
  });

  it("checks selected clients", () => {
    const client = makeClient({ id: "c1" });
    render(
      <ClientList clients={[client]} selectedIds={["c1"]} onToggleSelect={() => {}} />
    );
    const checkbox = screen.getByTestId("client-checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("calls onToggleSelect when checkbox is clicked", () => {
    const onToggle = vi.fn();
    const client = makeClient({ id: "c1" });
    render(
      <ClientList clients={[client]} selectedIds={[]} onToggleSelect={onToggle} />
    );
    fireEvent.click(screen.getByTestId("client-checkbox"));
    expect(onToggle).toHaveBeenCalledWith("c1");
  });
});
