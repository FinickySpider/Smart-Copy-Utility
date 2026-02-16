---
id: ADR-0006
type: decision
status: complete  # planned | complete | deprecated
date: 2026-02-15
supersedes: ""
superseded_by: ""
---

# ADR-0006: Optional OpenAI API Integration for Rule Generation

## Context
Users want an optional AI-assisted rule generator to help create/modify `.copyignore` / `.copyinclude` files based on a natural language request and selected project files.

The original design document lists network access and auto rule generation as out of scope; this ADR explicitly expands scope to allow optional network access for OpenAI usage.

## Decision
- Add optional integration with the OpenAI API from the Electron main process.
- Store the OpenAI API key locally using Electron `safeStorage` encryption.
- Keep the feature opt-in: no calls are made unless the user configures an API key and requests generation.
- The generator returns plain text rule lines; the user reviews and applies output to the editor.

## Consequences
### Positive
- Faster creation of practical rules for common project layouts.
- Keeps rule authoring inside the app, aligned with preview/explain workflow.

### Negative
- Introduces optional network access and associated privacy/security concerns.
- Requires clear user affordances for what data is sent (paths and optional file contents).

## Links
- Related items:
  - FEAT-019
  - FEAT-020
