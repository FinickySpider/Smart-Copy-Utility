---
id: FEAT-026
type: feature
status: complete
priority: medium
phase: PHASE-06
sprint: SPRINT-09
owner: ""
depends_on: [FEAT-025]
---

# FEAT-026: User Preferences Persistence

## Description
Persist user preferences (settings, window size, last used paths, etc.) across app sessions using Electron's storage.

## Acceptance Criteria
- [ ] Settings saved to local storage
- [ ] Window size and position remembered
- [ ] Last used source/dest paths optional restore
- [ ] Theme preference persists
- [ ] Graceful handling of corrupted storage
- [ ] Migration path for settings schema changes

## Files Touched
| File | Change |
|------|--------|
| src/main/settings.ts | Enhanced with file persistence |
| src/main/index.ts | Restore window bounds on startup |
| src/renderer/components/MainScreen.tsx | Save/restore paths |

## Implementation Notes
- Use electron-store or native JSON file
- Store in userData directory
- Schema versioning for future updates
- Backup old settings before migration
- Never store sensitive data (API keys use safeStorage)

## Testing
- [ ] Settings survive app restart
- [ ] Window position restored correctly
- [ ] Corrupted settings fallback to defaults
- [ ] Multiple app instances don't conflict
- [ ] Settings migration works

## Done When
- [ ] Acceptance criteria met
- [ ] Settings reliably persist
- [ ] No data loss scenarios
- [ ] Packaged and tested
