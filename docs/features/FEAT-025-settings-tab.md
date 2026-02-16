---
id: FEAT-025
type: feature
status: complete
priority: high
phase: PHASE-06
sprint: SPRINT-09
owner: ""
depends_on: []
---

# FEAT-025: Settings Tab

## Description
Add a dedicated Settings tab where users can configure app behavior, performance options, and UI preferences.

## Acceptance Criteria
- [ ] Third tab labeled "Settings" in main UI
- [ ] Organized sections: Performance, Appearance, Advanced
- [ ] Performance: Robocopy threads, Scanner threads
- [ ] Appearance: Theme (light/dark/auto), UI density
- [ ] Advanced: Developer tools, diagnostics
- [ ] Save and Reset to Defaults buttons
- [ ] Changes apply immediately or after confirmation
- [ ] Clear labels and helper text for all settings

## Files Touched
| File | Change |
|------|--------|
| src/renderer/components/SettingsScreen.tsx | New settings UI component |
| src/renderer/components/MainScreen.tsx | Add Settings tab |
| src/main/settings.ts | Settings management backend |

## Implementation Notes
- Use form pattern with validation
- Group related settings in cards
- Show current values and defaults
- Warn before applying performance changes
- Some settings may require app restart

## Testing
- [ ] All settings save correctly
- [ ] Reset to defaults works
- [ ] Settings persist across restarts
- [ ] Invalid values rejected gracefully
- [ ] UI updates reflect setting changes

## Done When
- [ ] Acceptance criteria met
- [ ] All planned settings available
- [ ] Clean, intuitive UI layout
- [ ] Packaged and tested
