import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DraftReviewModal from "@/components/DraftReviewModal";

describe("DraftReviewModal", () => {
  it("renders with draft text in textarea", () => {
    render(
      <DraftReviewModal
        draft="Borrador de prueba"
        onSend={() => {}}
        onClose={() => {}}
        sending={false}
      />
    );
    const textarea = screen.getByTestId("draft-textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Borrador de prueba");
  });

  it("allows editing the draft text", () => {
    render(
      <DraftReviewModal
        draft="Original"
        onSend={() => {}}
        onClose={() => {}}
        sending={false}
      />
    );
    const textarea = screen.getByTestId("draft-textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Editado" } });
    expect(textarea.value).toBe("Editado");
  });

  it("calls onSend with the edited message", () => {
    const onSend = vi.fn();
    render(
      <DraftReviewModal
        draft="Original"
        onSend={onSend}
        onClose={() => {}}
        sending={false}
      />
    );
    const textarea = screen.getByTestId("draft-textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Mensaje editado" } });
    fireEvent.click(screen.getByTestId("send-draft"));

    expect(onSend).toHaveBeenCalledWith("Mensaje editado");
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <DraftReviewModal
        draft="Test"
        onSend={() => {}}
        onClose={onClose}
        sending={false}
      />
    );
    fireEvent.click(screen.getByTestId("cancel-draft"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("disables send button when sending", () => {
    render(
      <DraftReviewModal
        draft="Test"
        onSend={() => {}}
        onClose={() => {}}
        sending={true}
      />
    );
    expect(screen.getByTestId("send-draft")).toBeDisabled();
    expect(screen.getByText("Enviando...")).toBeInTheDocument();
  });

  it("disables send button when textarea is empty", () => {
    render(
      <DraftReviewModal
        draft=""
        onSend={() => {}}
        onClose={() => {}}
        sending={false}
      />
    );
    expect(screen.getByTestId("send-draft")).toBeDisabled();
  });
});
