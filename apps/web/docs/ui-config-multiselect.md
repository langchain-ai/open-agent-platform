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
