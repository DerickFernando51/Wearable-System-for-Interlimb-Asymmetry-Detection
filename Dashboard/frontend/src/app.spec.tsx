import { render, screen } from "@testing-library/react";
import App from "./App";
import { describe, it, expect } from "vitest";


describe("App Component", () => {
  it("renders the heading", () => {
    render(<App />);
    const h1 = screen.getByText(
      /Wearable System for Interlimb Asymmetry Detection/i
    );
    expect(h1).toBeInTheDocument();
  });
});
