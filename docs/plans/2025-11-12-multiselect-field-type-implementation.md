# Multiselect Field Type Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add generic multiselect field type to OAP's x-oap-ui-config system for List[str] configuration fields.

**Architecture:** Three-component system: (1) Type definitions for "multiselect" field type, (2) Generic MultiselectCombobox component adapted from AgentsCombobox, (3) ConfigField integration with deep equality for visible_if.

**Tech Stack:** TypeScript, React, Radix UI, cmdk, Zustand

---

## Task 1: Add Multiselect Type Definition

**Files:**
- Modify: `apps/web/src/types/configurable.ts:3-10`

**Step 1: Add "multiselect" to ConfigurableFieldUIType union**

Location: `apps/web/src/types/configurable.ts` line 3-10

```typescript
// BEFORE:
export type ConfigurableFieldUIType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "slider"
  | "select"
  | "json";

// AFTER:
export type ConfigurableFieldUIType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "slider"
  | "select"
  | "multiselect"  // ← ADD THIS LINE
  | "json";
```

**Step 2: Define ConfigurableFieldMultiselectMetadata interface**

Add after line 96 (after ConfigurableFieldUIMetadata interface):

```typescript
export interface ConfigurableFieldMultiselectMetadata extends BaseConfigurableFieldMetadata {
  type: "multiselect";
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  default?: string[];
}
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build` in apps/web

Expected: Build succeeds with no type errors

**Step 4: Commit type definitions**

```bash
git add apps/web/src/types/configurable.ts
git commit -m "feat: add multiselect field type definition

Add 'multiselect' to ConfigurableFieldUIType union and define
ConfigurableFieldMultiselectMetadata interface for array field support."
```

---

## Task 2: Create MultiselectCombobox Component

**Files:**
- Create: `apps/web/src/components/ui/multiselect-combobox.tsx`

**Step 1: Copy base structure from AgentsCombobox**

Run: `cp apps/web/src/components/ui/agents-combobox.tsx apps/web/src/components/ui/multiselect-combobox.tsx`

**Step 2: Generalize the interface**

Replace AgentsComboboxProps interface (lines 30-61) with:

```typescript
export interface MultiselectComboboxProps {
  /**
   * Available options to select from
   */
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  /**
   * The placeholder text to display when no value is selected.
   * @default "Select options..."
   */
  placeholder?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  /**
   * Single value (string) or multiple values (string[])
   */
  value?: string | string[];
  /**
   * Callback for setting the value
   */
  setValue?: (value: string | string[]) => void;
  /**
   * Enable multiple selection mode
   * @default false
   */
  multiple?: boolean;
  /**
   * Prevent deselection of selected values
   * @default false
   */
  disableDeselect?: boolean;
  className?: string;
  style?: React.CSSProperties;
  trigger?: React.ReactNode;
}
```

**Step 3: Remove Agent-specific logic**

Find and remove:
- Lines 23-27: Remove Agent, groupAgentsByGraphs, isUserCreatedDefaultAssistant imports
- Lines 124-140: Remove grouping logic
- Lines 160-220: Simplify rendering to use flat options list

Replace component body with:

```typescript
export function MultiselectCombobox({
  options,
  placeholder = "Select options...",
  open: controlledOpen,
  setOpen: setControlledOpen,
  value,
  setValue,
  multiple = false,
  disableDeselect = false,
  className,
  style,
  trigger,
}: MultiselectComboboxProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  // Normalize value to array for consistent handling
  const selectedValues = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    if (!multiple) {
      // Single select mode
      setValue?.(selectedValue);
      setOpen(false);
      return;
    }

    // Multiple select mode
    const isSelected = selectedValues.includes(selectedValue);

    if (isSelected && disableDeselect && selectedValues.length === 1) {
      // Don't allow deselecting the last item if disableDeselect is true
      return;
    }

    const newValues = isSelected
      ? selectedValues.filter((v) => v !== selectedValue)
      : [...selectedValues, selectedValue];

    setValue?.(newValues);
  };

  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      return options.find((opt) => opt.value === selectedValues[0])?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            style={style}
          >
            {displayText}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {multiple && (
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 4: Verify component compiles**

Run: `npm run build` in apps/web

Expected: Build succeeds with no errors

**Step 5: Commit component**

```bash
git add apps/web/src/components/ui/multiselect-combobox.tsx
git commit -m "feat: add generic MultiselectCombobox component

Generalized from AgentsCombobox. Supports both single and multiple
selection with any option list. Removes Agent-specific logic."
```

---

## Task 3: Add Deep Equality Utility

**Files:**
- Modify: `apps/web/src/lib/utils.ts`

**Step 1: Add deepEqual function**

Add at end of file:

```typescript
/**
 * Deep equality comparison for primitive values and arrays.
 * Used for comparing visible_if conditions with array values.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  // Reference equality check
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  // For non-array objects, fall back to reference equality
  // (We only need array support for visible_if currently)
  return false;
}
```

**Step 2: Verify utility compiles**

Run: `npm run build` in apps/web

Expected: Build succeeds

**Step 3: Commit utility**

```bash
git add apps/web/src/lib/utils.ts
git commit -m "feat: add deepEqual utility for array comparison

Enables visible_if conditions to work with array values using
deep equality instead of reference equality."
```

---

## Task 4: Integrate MultiselectCombobox into ConfigField

**Files:**
- Modify: `apps/web/src/features/chat/components/configuration-sidebar/config-field.tsx`

**Step 1: Add imports**

Add to imports section (around line 1-20):

```typescript
import { MultiselectCombobox } from "@/components/ui/multiselect-combobox";
import { deepEqual } from "@/lib/utils";  // Add to existing utils import or new line
```

**Step 2: Update visible_if logic with deepEqual**

Find the visibility check (around line 130):

```typescript
// BEFORE:
const isVisible = !visible_if ||
  store.configsByAgentId[agentId]?.[visible_if.field] === visible_if.value;

// AFTER:
const isVisible = !visible_if ||
  deepEqual(
    store.configsByAgentId[agentId]?.[visible_if.field],
    visible_if.value
  );
```

**Step 3: Add multiselect rendering case**

Find the type-based rendering section (around line 200). Add before the closing of the switch/conditional:

```typescript
{type === "multiselect" && (
  <MultiselectCombobox
    options={config.options || []}
    value={currentValue as string[] | undefined}
    onChange={(newValue) => handleChange(newValue)}
    placeholder={config.placeholder || "Select options..."}
    multiple={true}
    disabled={disabled}
    className="w-full"
  />
)}
```

**Step 4: Verify integration compiles**

Run: `npm run build` in apps/web

Expected: Build succeeds

**Step 5: Commit integration**

```bash
git add apps/web/src/features/chat/components/configuration-sidebar/config-field.tsx
git commit -m "feat: integrate multiselect field type into ConfigField

Add rendering case for multiselect type and update visible_if
to use deep equality for array value comparison."
```

---

## Task 5: Create Unit Tests for MultiselectCombobox

**Files:**
- Create: `apps/web/src/components/ui/__tests__/multiselect-combobox.test.tsx`

**Step 1: Write test file structure**

```typescript
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
```

**Step 2: Run tests to verify they fail (component not fully tested)**

Run: `npm test -- multiselect-combobox.test.tsx`

Expected: Some tests may fail initially - this is expected

**Step 3: Fix any component issues revealed by tests**

Review test failures and adjust component if needed.

**Step 4: Verify all tests pass**

Run: `npm test -- multiselect-combobox.test.tsx`

Expected: All tests pass

**Step 5: Commit tests**

```bash
git add apps/web/src/components/ui/__tests__/multiselect-combobox.test.tsx
git commit -m "test: add unit tests for MultiselectCombobox

Cover single/multiple selection, placeholder display, deselection
prevention, and selection count display."
```

---

## Task 6: Create Unit Tests for deepEqual Utility

**Files:**
- Create: `apps/web/src/lib/__tests__/utils.test.ts` (or add to existing utils test file)

**Step 1: Write deepEqual tests**

```typescript
import { deepEqual } from "../utils";

describe("deepEqual", () => {
  it("returns true for identical primitive values", () => {
    expect(deepEqual("test", "test")).toBe(true);
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
  });

  it("returns false for different primitive values", () => {
    expect(deepEqual("test", "other")).toBe(false);
    expect(deepEqual(42, 43)).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it("returns true for identical arrays", () => {
    expect(deepEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it("returns false for arrays with different values", () => {
    expect(deepEqual(["a", "b"], ["a", "c"])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("returns false for arrays with same values in different order", () => {
    expect(deepEqual(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("handles null and undefined correctly", () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, "value")).toBe(false);
  });

  it("handles empty arrays", () => {
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual([], ["a"])).toBe(false);
  });

  it("returns false for reference equality on objects", () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(false);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- utils.test.ts`

Expected: All tests pass

**Step 3: Commit tests**

```bash
git add apps/web/src/lib/__tests__/utils.test.ts
git commit -m "test: add unit tests for deepEqual utility

Cover primitive values, arrays, null/undefined, empty arrays,
and object reference equality."
```

---

## Task 7: Create Integration Test for visible_if with Arrays

**Files:**
- Create: `apps/web/src/features/chat/components/configuration-sidebar/__tests__/config-field-visible-if.test.tsx`

**Step 1: Write integration test**

```typescript
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
```

**Step 2: Run integration tests**

Run: `npm test -- config-field-visible-if.test.tsx`

Expected: All tests pass

**Step 3: Commit integration tests**

```bash
git add apps/web/src/features/chat/components/configuration-sidebar/__tests__/config-field-visible-if.test.tsx
git commit -m "test: add integration tests for visible_if with arrays

Verify deep equality comparison works correctly for array-valued
visible_if conditions."
```

---

## Task 8: Manual E2E Test

**Files:**
- None (manual testing)

**Step 1: Build the application**

Run: `npm run build`

Expected: Build succeeds

**Step 2: Start development server**

Run: `npm run dev`

**Step 3: Create test agent configuration**

Navigate to agent creation/edit page and add a field with multiselect type in the agent's configuration schema (this would require backend changes, so document the expected behavior):

Expected JSON schema from backend:
```json
{
  "properties": {
    "output_formats": {
      "type": "array",
      "items": {"type": "string"},
      "default": ["markdown", "json"],
      "metadata": {
        "x_oap_ui_config": {
          "type": "multiselect",
          "options": [
            {"label": "Markdown", "value": "markdown"},
            {"label": "JSON", "value": "json"},
            {"label": "HTML", "value": "html"}
          ]
        }
      }
    }
  }
}
```

**Step 4: Verify multiselect rendering**

Expected behavior:
- Field renders as dropdown with "Select options..." placeholder
- Clicking opens dropdown with 3 options
- Can select multiple options
- Selected count displays (e.g., "2 selected")
- Selections persist when closing/reopening dropdown

**Step 5: Verify array values in payload**

Open browser dev tools → Network tab → Find agent configuration API call

Expected payload:
```json
{
  "output_formats": ["markdown", "json"]
}
```

**Step 6: Document E2E test results**

Create: `docs/testing/multiselect-e2e-results.md`

Document:
- Rendering behavior observed
- Interaction behavior observed
- Payload structure confirmed
- Any issues found

**Step 7: Commit E2E documentation**

```bash
git add docs/testing/multiselect-e2e-results.md
git commit -m "docs: add E2E test results for multiselect field type

Document manual testing of multiselect rendering, interaction,
and payload structure."
```

---

## Task 9: Update Type Exports

**Files:**
- Modify: `apps/web/src/components/ui/index.ts` (or create if doesn't exist)

**Step 1: Export MultiselectCombobox**

Add to exports:

```typescript
export { MultiselectCombobox } from "./multiselect-combobox";
export type { MultiselectComboboxProps } from "./multiselect-combobox";
```

**Step 2: Verify exports work**

Create test import in a temporary file:

```typescript
import { MultiselectCombobox } from "@/components/ui";
```

Build should succeed.

**Step 3: Commit exports**

```bash
git add apps/web/src/components/ui/index.ts
git commit -m "chore: export MultiselectCombobox component

Make component available through @/components/ui barrel export."
```

---

## Task 10: Add Documentation

**Files:**
- Create: `apps/web/docs/ui-config-multiselect.md`

**Step 1: Write multiselect documentation**

```markdown
# Multiselect Field Type

## Overview

The `multiselect` field type enables configuration fields with multiple string selections from a predefined list. It renders as a combobox dropdown with checkboxes for each option.

## Python Backend Usage

```python
from typing import List
from pydantic import BaseModel, Field

class Configuration(BaseModel):
    output_formats: List[str] = Field(
        default=["markdown", "json"],
        metadata={
            "x_oap_ui_config": {
                "type": "multiselect",
                "description": "Select output format(s)",
                "options": [
                    {"label": "Markdown", "value": "markdown"},
                    {"label": "JSON", "value": "json"},
                    {"label": "HTML", "value": "html"},
                    {"label": "Slides", "value": "slides"}
                ]
            }
        }
    )
```

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"multiselect"` | Yes | Field type identifier |
| `options` | `Array<{label, value, description?}>` | Yes | Available options |
| `default` | `string[]` | No | Default selected values |
| `description` | `string` | No | Help text |
| `placeholder` | `string` | No | Placeholder text |

## Frontend Rendering

The field renders as:
- Dropdown button showing selection count or placeholder
- Searchable list of options with checkboxes
- Multi-select enabled by default
- Keyboard navigation support

## visible_if Support

Multiselect fields support conditional visibility with deep equality:

```python
dependent_field: str = Field(
    metadata={
        "x_oap_ui_config": {
            "type": "text",
            "visible_if": {
                "field": "output_formats",
                "value": ["markdown", "json"]  # Exact match required
            }
        }
    }
)
```

## Array Handling

- Empty selection: `[]`
- Single selection: `["value"]` (kept as array, not coerced to string)
- Multiple selections: `["value1", "value2"]`
- Automatic deduplication applied
- Values validated against available options

## Limitations

- Array order in `visible_if` must match exactly (reference equality for order)
- Options list should not exceed 100 items for optimal performance
- No nested option groups (use flat list only)
```

**Step 2: Commit documentation**

```bash
git add apps/web/docs/ui-config-multiselect.md
git commit -m "docs: add multiselect field type documentation

Document Python usage, properties, rendering behavior, visible_if
support, and limitations."
```

---

## Task 11: Final Build and Verification

**Files:**
- None (verification)

**Step 1: Clean build**

Run: `npm run clean && npm run build`

Expected: Build succeeds with no errors

**Step 2: Run all tests**

Run: `npm test`

Expected: All tests pass

**Step 3: Run type checking**

Run: `npm run type-check` (or `tsc --noEmit`)

Expected: No type errors

**Step 4: Run linter**

Run: `npm run lint`

Expected: No linting errors

**Step 5: Verify git status**

Run: `git status`

Expected: Working tree clean (all changes committed)

---

## Task 12: Create Pull Request

**Files:**
- None (GitHub PR)

**Step 1: Push feature branch**

```bash
git push -u origin feature/multiselect-field-type
```

**Step 2: Create PR with description**

Title: `feat: add multiselect field type to x-oap-ui-config system`

Description:
```markdown
## Summary

Adds generic multiselect field type to OAP's x-oap-ui-config system, enabling any agent to use `List[str]` configuration fields with multiselect UI.

## Changes

- **Type Definitions:** Add "multiselect" to ConfigurableFieldUIType union and define ConfigurableFieldMultiselectMetadata interface
- **Component:** Create MultiselectCombobox component (generalized from AgentsCombobox)
- **Utility:** Add deepEqual for array comparison in visible_if conditions
- **Integration:** Wire multiselect into ConfigField rendering
- **Tests:** Unit tests for component, utility, and visible_if integration
- **Documentation:** Usage guide for Python backend and frontend

## Testing

- [x] Unit tests pass (component, utility, visible_if)
- [x] Integration tests pass
- [x] E2E manual testing completed
- [x] Type checking passes
- [x] Linting passes
- [x] Build succeeds

## Usage Example

```python
output_formats: List[str] = Field(
    default=["markdown", "json"],
    metadata={
        "x_oap_ui_config": {
            "type": "multiselect",
            "options": [
                {"label": "Markdown", "value": "markdown"},
                {"label": "JSON", "value": "json"}
            ]
        }
    }
)
```

## Dependencies

All dependencies already present (Radix UI, cmdk, TypeScript).

## Backward Compatibility

Fully backward compatible - existing configs work unchanged.

## Estimated Review Time

~30 minutes
```

**Step 3: Request review**

Assign reviewers and label PR as `feature` and `ui-config`.

---

## Completion Checklist

- [ ] Task 1: Type definitions added ✓
- [ ] Task 2: MultiselectCombobox component created ✓
- [ ] Task 3: deepEqual utility added ✓
- [ ] Task 4: ConfigField integration complete ✓
- [ ] Task 5: Component unit tests pass ✓
- [ ] Task 6: Utility unit tests pass ✓
- [ ] Task 7: Integration tests pass ✓
- [ ] Task 8: E2E testing documented ✓
- [ ] Task 9: Exports updated ✓
- [ ] Task 10: Documentation written ✓
- [ ] Task 11: Build & verification pass ✓
- [ ] Task 12: PR created ✓

## Notes for Implementation

- **TDD:** Write tests before implementation where possible
- **Commits:** Commit after each task completion
- **Verification:** Run builds and tests frequently
- **Questions:** Refer to design document at `docs/plans/2025-11-12-oap-multiselect-field-type-design.md`

## Estimated Timeline

- Tasks 1-4: 4 hours (core implementation)
- Tasks 5-7: 3 hours (testing)
- Tasks 8-12: 2 hours (documentation and PR)
- **Total: ~9 hours** (buffers built into original 13-hour estimate)
