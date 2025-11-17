import { render, screen } from "@testing-library/react";
import { ConfigField } from "../config-field";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";

// Mock the store
jest.mock("@/features/chat/hooks/use-config-store");

describe("ConfigField visible_if with arrays", () => {
  beforeEach(() => {
    (useConfigStore as jest.Mock).mockReturnValue({
      configsByAgentId: {
        "test-agent": {
          outputFormats: ["markdown", "json"],
        },
      },
      updateConfig: jest.fn(),
    });
  });

  it("shows field when visible_if array matches exactly", () => {
    render(
      <ConfigField
        id="dependentField"
        label="Dependent Field"
        type="text"
        agentId="test-agent"
        config={{
          visible_if: {
            field: "outputFormats",
            value: ["markdown", "json"],
          },
        }}
      />
    );

    expect(screen.getByLabelText("Dependent Field")).toBeVisible();
  });

  it("hides field when visible_if array doesn't match", () => {
    render(
      <ConfigField
        id="dependentField"
        label="Dependent Field"
        type="text"
        agentId="test-agent"
        config={{
          visible_if: {
            field: "outputFormats",
            value: ["html"],
          },
        }}
      />
    );

    expect(screen.queryByLabelText("Dependent Field")).not.toBeInTheDocument();
  });

  it("handles empty array comparison", () => {
    (useConfigStore as jest.Mock).mockReturnValue({
      configsByAgentId: {
        "test-agent": {
          outputFormats: [],
        },
      },
    });

    render(
      <ConfigField
        id="dependentField"
        label="Dependent Field"
        type="text"
        agentId="test-agent"
        config={{
          visible_if: {
            field: "outputFormats",
            value: [],
          },
        }}
      />
    );

    expect(screen.getByLabelText("Dependent Field")).toBeVisible();
  });
});
