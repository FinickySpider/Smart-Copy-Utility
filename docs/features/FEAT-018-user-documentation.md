---
id: FEAT-018
type: feature
status: complete
priority: high
phase: PHASE-04
sprint: SPRINT-04
owner: ""
depends_on: []
---

# FEAT-018: User Documentation

## Description
Write comprehensive README.md with setup instructions, usage guide, rule file syntax, and examples. This is the primary user-facing documentation.

## Acceptance Criteria
- [x] README.md includes project description and goals
- [x] Installation/setup instructions (Windows-only note)
- [x] Usage workflow: select folders → preview → dry run → copy
- [x] Rule file syntax reference (.copyignore and .copyinclude)
- [x] Pattern examples: directory (`node_modules/`), glob (`*.log`), relative path (`build/output.txt`)
- [x] Stacking/reset semantics explained
- [x] Conflict resolution guide
- [x] Root-only mode explanation
- [x] Troubleshooting section
- [x] License information

## Files Touched
| File | Change |
|------|--------|
| `README.md` | Complete rewrite with user documentation |

## Implementation Notes
- Structure:
  - **Overview**: What is Smart Copy Utility
  - **Features**: Key capabilities
  - **Installation**: How to build and run
  - **Quick Start**: Basic workflow
  - **Rule Files**: Syntax, semantics, examples
  - **Advanced**: Root-only mode, conflict resolution
  - **Troubleshooting**: Common issues
  - **Development**: How to contribute, run tests
  - **License**: MIT or similar
- Include real-world examples of .copyignore files for common scenarios:
  - Node.js projects (exclude node_modules, dist, .env)
  - .NET projects (exclude bin, obj)
  - General development (exclude .git, .vscode)
- Explain stacking: child rules add to parent rules
- Explain reset: .copyinclude resets to whitelist mode

## Testing
- [x] README renders correctly on GitHub
- [x] Instructions are clear and actionable
- [x] Examples are accurate and helpful

## Done When
- [x] Acceptance criteria met
- [x] README reviewed for clarity and completeness
- [x] All examples tested
