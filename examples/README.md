# Example README for .copyignore Files

This folder contains example `.copyignore` and `.copyinclude` rule files for various project types.

## How to Use

1. **Choose the appropriate template** for your project type
2. **Copy to your project root** or any subdirectory
3. **Rename to `.copyignore`** (remove the suffix like `-nodejs`, `-python`, etc.)
4. **Customize** as needed for your specific project

## Available Templates

### `.copyignore-nodejs`
For Node.js, JavaScript, and TypeScript projects. Excludes:
- `node_modules/`, build outputs (`dist/`, `.next/`, `.vite/`)
- Logs, environment files, IDE folders

### `.copyignore-dotnet`
For .NET and C# projects. Excludes:
- `bin/`, `obj/`, NuGet packages, Visual Studio files
- Build outputs, user-specific files

### `.copyignore-python`
For Python projects. Excludes:
- Virtual environments (`venv/`, `env/`)
- `__pycache__/`, bytecode files
- Distribution folders, test coverage

### `.copyignore-java`
For Java, Maven, and Gradle projects. Excludes:
- `target/`, `build/`, `.gradle/`, IDE files
- Class files, JARs (except gradle-wrapper.jar)

### `.copyignore-web`
For web frontend projects (React, Vue, Angular). Excludes:
- `node_modules/`, build outputs
- Static site generator outputs, caches

### `.copyignore-general`
Minimal set of common exclusions for any project:
- Version control (`.git/`), dependencies, build outputs
- OS files, IDE files, logs

### `.copyinclude-source-only`
Whitelist mode example: Only copies source code files.
- Includes common programming language extensions
- Includes project files, documentation, scripts
- Excludes everything else

## Combining Templates

You can use multiple rule files in different directories:

```
MyProject/
├── .copyignore              (root rules: exclude .git/, node_modules/)
├── src/
│   └── generated/
│       └── .copyignore      (nested rules: exclude all generated files)
└── docs/
    └── .copyinclude         (whitelist: only copy .md files)
```

## Testing Your Rules

1. Place `.copyignore` in your project
2. Open Smart Copy Utility
3. Select source and destination
4. Click **Preview** to see what will be copied
5. Use **Explain** on specific files to understand why they're included/excluded
6. Run **Dry Run** to simulate without copying
7. Adjust rules as needed

## More Information

See the main [README.md](../README.md) for complete rule syntax documentation.
