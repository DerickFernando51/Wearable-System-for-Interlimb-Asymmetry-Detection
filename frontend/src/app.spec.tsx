import { render, screen } from "@testing-library/react";
import App from "./App";
import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/database", () => {
  return {
    getDatabase: vi.fn(() => ({})),
    ref: vi.fn(),
    set: vi.fn(),
    onValue: vi.fn(() => () => {}),  
  };
});


global.WebSocket = vi.fn(() => ({
  close: vi.fn(),
  send: vi.fn(),
})) as any;

describe("App Component", () => {
  it("renders the heading", () => {
    render(<App />);
    const h1 = screen.getByText(
      /Wearable Device for Interlimb Asymmetry Detection/i
    );
    expect(h1).toBeInTheDocument();
  });
});
