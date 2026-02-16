---
id: PHASE-05
type: phase
status: complete  # planned | active | complete
owner: ""
---

# PHASE-05: Rule Authoring & AI Assist

## Goal
Add an in-app workflow to create/edit `.copyignore` / `.copyinclude` files, with a built-in library of common snippets and an optional OpenAI-assisted rule generator.

## In Scope
- A second UI tab for rule authoring (open/edit/save)
- Built-in pattern/snippet library to import into rule files
- Guardrails when saving rule files (detect `.copyignore` + `.copyinclude` conflict in same folder; warn on overwrite)
- Optional OpenAI API integration for rule generation/modification

## Out of Scope
- Auto-applying rules without user review
- Cloud sync, user profiles, or complex template management
- Any changes to rule engine semantics (parser/matcher/context/copy plan)

## Sprints
- [SPRINT-06](../sprints/SPRINT-06.md) ✅

## Completion Criteria
- [x] Rules tab can open/edit/save `.copyignore` and `.copyinclude`
- [x] Save-time warnings work for conflict and overwrite scenarios
- [x] Snippet library can insert/apply examples into the editor
- [x] OpenAI generator works with GPT-5-mini when configured
