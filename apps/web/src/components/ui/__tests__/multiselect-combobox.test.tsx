import { render, screen, fireEvent } from "@testing-library/react";
import { MultiselectCombobox } from "../multiselect-combobox";

const mockOptions = [
  { label: "Option 1", value: "opt1" },
  { label: "Option 2", value: "opt2" },
  { label: "Option 3", value: "opt3" },
];

describe("MultiselectCombobox", () => {
  it("renders with placeholder when no value selected", () => {
    render(
      <MultiselectCombobox
        options={mockOptions}
        placeholder="Select options..."
      />
    );
    expect(screen.getByText("Select options...")).toBeInTheDocument();
  });

  it("handles single selection", () => {
    const handleChange = jest.fn();
    render(
      <MultiselectCombobox
        options={mockOptions}
        value={undefined}
        setValue={handleChange}
        multiple={false}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Select option
    fireEvent.click(screen.getByText("Option 1"));

    expect(handleChange).toHaveBeenCalledWith("opt1");
  });

  it("handles multiple selection", () => {
    const handleChange = jest.fn();
    render(
      <MultiselectCombobox
        options={mockOptions}
        value={[]}
        setValue={handleChange}
        multiple={true}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Select first option
    fireEvent.click(screen.getByText("Option 1"));
    expect(handleChange).toHaveBeenCalledWith(["opt1"]);

    // Select second option
    fireEvent.click(screen.getByText("Option 2"));
    expect(handleChange).toHaveBeenCalledWith(["opt1", "opt2"]);
  });

  it("displays count when multiple items selected", () => {
    render(
      <MultiselectCombobox
        options={mockOptions}
        value={["opt1", "opt2"]}
        multiple={true}
      />
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("prevents deselection when disableDeselect is true", () => {
    const handleChange = jest.fn();
    render(
      <MultiselectCombobox
        options={mockOptions}
        value={["opt1"]}
        setValue={handleChange}
        multiple={true}
        disableDeselect={true}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Try to deselect the only item
    fireEvent.click(screen.getByText("Option 1"));

    // Should not call setValue since it's the last item
    expect(handleChange).not.toHaveBeenCalled();
  });
});
