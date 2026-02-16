---
id: FEAT-020
type: feature
status: complete  # planned | in_progress | blocked | review | complete | deprecated
priority: medium # high | medium | low
phase: PHASE-05
sprint: SPRINT-06
owner: ""
depends_on:
  - ADR-0006
---

# FEAT-020: OpenAI Rule Generator

## Description
Provide an optional OpenAI-powered assistant that can generate or modify `.copyignore` / `.copyinclude` contents based on user intent and selected files/folders.

## Acceptance Criteria
- [x] User can configure an OpenAI API key from the Rules tab.
- [x] API key is stored locally using Electron safeStorage encryption.
- [x] User can provide an instruction prompt and optional file selections.
- [x] App calls OpenAI Responses API using model `gpt-5-mini` and returns generated rule text.
- [x] Output is plain rule lines (no markdown); app strips code fences if present.
- [x] Errors (missing key, API failures) are shown to the user.
- [x] User can scan a folder (optionally recursive) to provide project structure to AI.

## Files Touched
| File | Change |
|------|--------|
| src/main/ipc.ts | Add OpenAI key + generate handlers, folder scanning |
| src/main/openai.ts | New helper for OpenAI calls (fixed type: 'input_text') |
| src/main/settings.ts | Persist encrypted API key |
| src/main/folderScanner.ts | New folder structure scanner for AI context |
| src/preload/index.ts | Expose generator APIs |
| src/renderer/components/RulesScreen.tsx | Add prompt + generate UI + folder scanning |

## Implementation Notes
- Fixed OpenAI API call to use `type: 'input_text'` instead of `type: 'text'`
- Added folder scanning feature with recursive option (max depth 10 to prevent hanging)
- Folder structure is formatted as tree view and included in AI prompt
- Default to sending file paths; allow small text file contents with size limits.
- Never run generated output automatically; user must apply it to the editor.

## Testing
- [x] With key configured, generator returns output
- [x] Without key, generator shows error
- [x] Folder scanning works with recursive option
- [x] Build succeeds with new features

## Done When
- [x] Acceptance criteria met
- [x] Verified build succeeds
