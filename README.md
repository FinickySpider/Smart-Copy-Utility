# Smart Copy Utility

**Windows-only desktop utility for intelligent folder copying with hierarchical rule-based filtering**

Smart Copy Utility is an Electron-based desktop application that copies large folder trees efficiently using Windows `robocopy`, while intelligently filtering out disposable and generated files through `.copyignore` and `.copyinclude` rule files embedded in the directory structure.

## Features

- **Robocopy-Powered**: Fast, reliable copying using Windows built-in `robocopy` utility
- **Hierarchical Rule System**: Place `.copyignore` (blacklist) or `.copyinclude` (whitelist) files anywhere in your folder tree
- **Preview-First Workflow**: See exactly what will be copied before executing
- **Dry Run Mode**: Simulate the copy operation without writing files
- **Real-Time Progress**: Streaming logs and progress visualization during copy operations
- **Conflict Detection**: Identifies and prevents operations when both rule types exist in the same directory
- **Explainability**: Click any file/folder to understand why it was included or excluded
- **Root-Only Mode**: Optionally ignore nested rules and only apply root-level filters
- **Cancel Support**: Terminate long-running copy operations at any time
- **Path Safety Checks**: Prevents dangerous scenarios (same folder, recursive paths)

## Requirements

- **Windows 10 or later** (robocopy is Windows-only)
- **Node.js 18+** (for development/building)

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/FinickySpider/Smart-Copy-Utility.git
cd Smart-Copy-Utility

# Install dependencies
npm install

# Start the application
npm start
```

### Building

```bash
# Create distributable package
npm run make

# Output will be in the out/make directory
```

## Quick Start

### Basic Workflow

1. **Select Folders**
   - Click "Select Folder" for Source (folder to copy from)
   - Click "Select Folder" for Destination (where files will be copied to)

2. **Preview**
   - Click "Preview" to scan the source and build the file tree
   - Review included (✓) and excluded (✗) files in the tree view

3. **Optional: Dry Run**
   - Click "Dry Run" to simulate the copy without writing files
   - Review the log output and estimated file counts

4. **Copy**
   - Click "Copy" to execute the actual file copy operation
   - Monitor real-time progress and logs
   - Use "Cancel" if you need to stop early

### Creating Rule Files

Create `.copyignore` or `.copyinclude` files (case-insensitive) in any directory within your source folder.

## Rule File Syntax

### Pattern Types

| Pattern Type | Syntax | Example | Matches |
|--------------|--------|---------|---------|
| **Directory** | `name/` | `node_modules/` | Any directory named "node_modules" |
| **Glob** | `*.ext` | `*.log` | Any file ending in ".log" |
| **Relative Path** | `path/file.ext` | `build/output.txt` | Specific file at path relative to rule file |

### Pattern Matching Rules

- **Case-insensitive** on Windows (e.g., `*.LOG` matches `debug.log`)
- **Relative to rule file location**: Patterns are evaluated from the directory containing the rule file
- **No negation**: Patterns cannot be inverted (no `!` prefix)
- **Comments**: Lines starting with `#` are ignored
- **Blank lines**: Ignored

### Rule File Examples

#### Example 1: Node.js Project `.copyignore`

```
# Exclude dependencies
node_modules/

# Exclude build outputs
dist/
build/
.next/

# Exclude logs and temp files
*.log
*.tmp
.DS_Store

# Exclude environment files
.env
.env.local
```

#### Example 2: .NET Project `.copyignore`

```
# Build outputs
bin/
obj/

# IDE folders
.vs/
.vscode/

# NuGet packages
packages/

# User-specific files
*.user
*.suo
```

#### Example 3: Whitelist Mode `.copyinclude`

```
# Only include specific file types
*.cs
*.csproj
*.sln
*.md

# Only include specific directories
src/
docs/
```

## Understanding Modes

Smart Copy operates in three modes based on which rule files are present:

### NONE Mode (No Rule Files)
- **Behavior**: Copy everything
- **Use Case**: Default behavior when no rule files exist in a directory

### IGNORE Mode (`.copyignore` Present)
- **Behavior**: Blacklist mode - copy everything EXCEPT patterns listed
- **Stacking**: Child directories inherit parent patterns and add their own
- **Reset**: Overridden if a `.copyinclude` appears in a child directory

### INCLUDE Mode (`.copyinclude` Present)
- **Behavior**: Whitelist mode - copy ONLY patterns listed
- **Stacking**: Child directories inherit parent patterns and add their own
- **Reset**: Overridden if a `.copyignore` appears in a child directory

### ⚠️ Conflicts

If both `.copyignore` AND `.copyinclude` exist in the **same directory**, this is a **fatal error**. The application will:
- Highlight all conflicts in red
- Block Dry Run and Copy operations
- Display "Open in Explorer" and "Copy path" options for each conflict

**Resolution**: Delete one of the conflicting files in each affected directory.

## Advanced Features

### Root-Rules-Only Mode

Enable the **"Root rules only"** checkbox to:
- Ignore all nested `.copyignore`/`.copyinclude` files
- Only apply rule files found at the source root
- Useful for simple, non-hierarchical filtering

### Explain Panel

Click any file or folder in the preview tree to see:
- **Decision**: Included, Excluded, or Conflict
- **Mode**: NONE, IGNORE, or INCLUDE
- **Rule Chain**: All rule files affecting this item
- **Matching Patterns**: Exact pattern(s) causing inclusion/exclusion with line numbers
- **Actions**: Open rule folder in Explorer, Copy path to clipboard

### Path Safety

The application prevents these dangerous scenarios:
- **Same Folder**: Source and destination cannot be identical
- **Destination Inside Source**: Would cause infinite recursion (e.g., `C:\Projects` → `C:\Projects\backup`)
- **Source Inside Destination**: Would overwrite source during copy (e.g., `C:\Projects\backup` → `C:\Projects`)

Buttons are automatically disabled when these conditions are detected.

## Troubleshooting

### "Scan failed" Error

**Causes:**
- Source folder doesn't exist or is inaccessible
- Permission denied reading directory

**Solutions:**
- Verify the source path exists
- Check folder permissions
- Try running as administrator (if dealing with system folders)

### "Copy failed" Error

**Causes:**
- Destination is read-only or protected
- Disk full
- Robocopy encountered an error

**Solutions:**
- Check destination permissions
- Ensure adequate disk space
- Review the operation log for robocopy exit codes

### Conflicts Blocking Operation

**Cause:** Both `.copyignore` and `.copyinclude` exist in the same directory

**Solutions:**
1. Click "Open in Explorer" next to each conflict
2. Delete one of the two rule files
3. Run Preview again to verify resolution

### Unexpected Files Excluded

**Debugging:**
1. Click the excluded file in the preview tree
2. View the Explain Panel to see which pattern matched
3. Check the rule file chain and pattern line numbers
4. Modify or remove the problematic pattern

## Development

### Project Structure

```
src/
├── main/               # Electron main process
│   ├── rules/          # Rule parsing and pattern matching
│   ├── scanner/        # Filesystem scanning and tree building
│   ├── copier/         # Robocopy job planning and execution
│   └── ipc.ts          # IPC handlers
├── preload/            # Preload script (IPC bridge)
└── renderer/           # React UI
    └── components/     # UI components

tests/                  # Vitest test suite
docs/                   # Project documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Tech Stack

- **Electron 33**: Desktop application framework
- **React 19**: UI library
- **TypeScript 5.7**: Type-safe development
- **Vite 6**: Build tool
- **Vitest 3**: Testing framework
- **Robocopy**: Windows file copy utility

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture Decisions

Key design choices are documented in [ADRs](docs/decisions/):
- [ADR-0001: Electron + React Framework](docs/decisions/ADR-0001-electron-react-framework.md)
- [ADR-0002: Robocopy as Copy Backend](docs/decisions/ADR-0002-robocopy-copy-backend.md)
- [ADR-0003: Hierarchical Rule File System](docs/decisions/ADR-0003-hierarchical-rule-file-system.md)
- [ADR-0004: Multiple Robocopy Jobs](docs/decisions/ADR-0004-multiple-robocopy-jobs-for-subtree-rules.md)
- [ADR-0005: Lazy Tree Evaluation](docs/decisions/ADR-0005-lazy-tree-evaluation-for-preview.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or feature requests, please [open an issue](https://github.com/FinickySpider/Smart-Copy-Utility/issues) on GitHub.

---

**Built with ❤️ for Windows power users and developers**
