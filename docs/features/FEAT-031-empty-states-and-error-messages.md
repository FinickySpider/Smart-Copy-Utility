---
id: FEAT-031
type: feature
status: complete
priority: medium
phase: PHASE-06
sprint: SPRINT-11
owner: ""
depends_on: [FEAT-027]
---

# FEAT-031: Empty States & Error Messages

## Description
Create helpful empty states for first-time users and rewrite error messages to be friendly, actionable, and human-readable.

## Acceptance Criteria
- [ ] Empty state when no folders selected (illustration + guidance)
- [ ] Empty state when no scan results yet
- [ ] Empty state when no rules exist
- [ ] All error messages rewritten (friendly tone)
- [ ] Error messages include what, why, and how-to-fix
- [ ] Confirmation dialogs for destructive actions
- [ ] Toast notifications for success/info messages
- [ ] Helpful icons for all message types

## Files Touched
| File | Change |
|------|--------|
| src/renderer/components/EmptyState.tsx | New component |
| src/renderer/components/Toast.tsx | Toast system |
| All components | Replace error text with friendly messages |
| src/main/errors.ts | Centralized error message formatting |

## Implementation Notes
- Empty states: center-aligned, illustration, clear CTA
- Error messages: avoid jargon, blame-free language
- Use "Oops", "Hmm" instead of "Error", "Failed"
- Provide specific actions to resolve
- Icons: ℹ️ info, ⚠️ warning, ❌ error, ✅ success
- Toast duration: 4s success, 6s error, persist warning
- Confirmation dialogs for overwrites, deletions

## Testing
- [ ] Empty states guide new users
- [ ] Error messages are understandable
- [ ] No technical jargon in user-facing text
- [ ] All destructive actions require confirmation
- [ ] Toasts appear and dismiss correctly
- [ ] Messages tested with real users

## Done When
- [ ] Acceptance criteria met
- [ ] UX writing follows voice & tone guide
- [ ] User confusion reduced
- [ ] Packaged and tested
