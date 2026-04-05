import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatLog from "@/components/ChatLog";
import { type SiteMessage } from "@/lib/supabase";

function makeMessage(overrides: Partial<SiteMessage> = {}): SiteMessage {
  return {
    id: "msg-" + Math.random().toString(36).slice(2),
    project_id: "proj-1",
    direction: "inbound",
    message_type: "text",
    content: "Test message",
    media_urls: null,
    agent_intent: null,
    agent_actions: null,
    task_id: null,
    wa_message_id: null,
    sender_phone: "+5212345678",
    processed: true,
    created_at: "2026-04-04T10:00:00Z",
    ...overrides,
  };
}

describe("ChatLog", () => {
  const sampleMessages: SiteMessage[] = [
    makeMessage({
      id: "m1",
      direction: "inbound",
      content: "Terminamos el colado del segundo piso",
      created_at: "2026-04-04T10:00:00Z",
    }),
    makeMessage({
      id: "m2",
      direction: "outbound",
      content: "✓ Tarea registrada: Colado segundo piso",
      created_at: "2026-04-04T10:00:05Z",
    }),
    makeMessage({
      id: "m3",
      direction: "inbound",
      message_type: "image",
      content: "Avance de la losa",
      media_urls: ["https://example.com/photo.jpg"],
      created_at: "2026-04-04T11:30:00Z",
    }),
  ];

  it("renders message bubbles", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);
    expect(screen.getAllByTestId("message-inbound")).toHaveLength(2);
    expect(screen.getAllByTestId("message-outbound")).toHaveLength(1);
  });

  it("shows message content", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);
    expect(screen.getByText("Terminamos el colado del segundo piso")).toBeInTheDocument();
    expect(screen.getByText("✓ Tarea registrada: Colado segundo piso")).toBeInTheDocument();
  });

  it("shows sender name for inbound messages", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);
    const senderNames = screen.getAllByTestId("sender-name");
    expect(senderNames.length).toBeGreaterThan(0);
    expect(senderNames[0]).toHaveTextContent("Juan");
  });

  it("shows photo indicator for image messages", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);
    expect(screen.getByText("Foto")).toBeInTheDocument();
  });

  it("renders media thumbnails", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);
    expect(screen.getByTestId("message-media")).toBeInTheDocument();
  });

  it("groups messages by date", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);
    const dateDividers = screen.getAllByTestId("date-divider");
    expect(dateDividers.length).toBeGreaterThanOrEqual(1);
  });

  it("shows voice note indicator for voice messages", () => {
    const voiceMessages = [
      makeMessage({
        id: "v1",
        message_type: "voice",
        content: "Transcripción de nota de voz",
      }),
    ];
    render(<ChatLog messages={voiceMessages} residenteName="Juan" />);
    expect(screen.getByText("Nota de voz")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(<ChatLog messages={[]} residenteName="Juan" />);
    expect(screen.getByTestId("empty-chat")).toBeInTheDocument();
  });

  it("aligns inbound messages to the left and outbound to the right", () => {
    render(<ChatLog messages={sampleMessages} residenteName="Juan" />);

    const inbound = screen.getAllByTestId("message-inbound")[0];
    const outbound = screen.getAllByTestId("message-outbound")[0];

    expect(inbound.className).toContain("justify-start");
    expect(outbound.className).toContain("justify-end");
  });
});
