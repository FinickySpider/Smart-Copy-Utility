"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs/promises");
const node_crypto = require("node:crypto");
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    node_crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
const native = { randomUUID: node_crypto.randomUUID };
function _v4(options, buf, offset) {
  var _a;
  options = options || {};
  const rnds = options.random ?? ((_a = options.rng) == null ? void 0 : _a.call(options)) ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
  if (native.randomUUID && true && !options) {
    return native.randomUUID();
  }
  return _v4(options);
}
var RuleType = /* @__PURE__ */ ((RuleType2) => {
  RuleType2["IGNORE_FILE"] = "IGNORE_FILE";
  RuleType2["INCLUDE_FILE"] = "INCLUDE_FILE";
  return RuleType2;
})(RuleType || {});
const COPYIGNORE_NAME = ".copyignore";
const COPYINCLUDE_NAME = ".copyinclude";
var RuleMode = /* @__PURE__ */ ((RuleMode2) => {
  RuleMode2["NONE"] = "NONE";
  RuleMode2["IGNORE"] = "IGNORE";
  RuleMode2["INCLUDE"] = "INCLUDE";
  return RuleMode2;
})(RuleMode || {});
var NodeState = /* @__PURE__ */ ((NodeState2) => {
  NodeState2["INCLUDED"] = "INCLUDED";
  NodeState2["EXCLUDED"] = "EXCLUDED";
  NodeState2["CONFLICT"] = "CONFLICT";
  NodeState2["UNKNOWN"] = "UNKNOWN";
  return NodeState2;
})(NodeState || {});
function getRuleTypeFromFileName(fileName) {
  const lower = fileName.toLowerCase();
  if (lower === COPYIGNORE_NAME) return RuleType.IGNORE_FILE;
  if (lower === COPYINCLUDE_NAME) return RuleType.INCLUDE_FILE;
  return null;
}
function parseRuleContent(content, ruleFilePath) {
  const lines = content.split(/\r?\n/);
  const patterns = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    if (line.startsWith("#")) continue;
    patterns.push({
      patternText: line,
      lineNumber: i + 1,
      // 1-based
      ruleFilePath
    });
  }
  return patterns;
}
async function parseRuleFile(filePath) {
  const fileName = path.basename(filePath);
  const ruleType = getRuleTypeFromFileName(fileName);
  if (ruleType === null) {
    return null;
  }
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const patterns = parseRuleContent(content, filePath);
    return {
      path: filePath,
      type: ruleType,
      lines: patterns
    };
  } catch {
    return null;
  }
}
async function findRuleFilesInDir(dirPath) {
  const results = [];
  try {
    const entries = await fs.readdir(dirPath);
    for (const entry of entries) {
      const ruleType = getRuleTypeFromFileName(entry);
      if (ruleType !== null) {
        const fullPath = path.join(dirPath, entry);
        const record = await parseRuleFile(fullPath);
        if (record) {
          results.push(record);
        }
      }
    }
  } catch {
  }
  return results;
}
function normalizePath(p) {
  return p.replace(/\//g, "\\").toLowerCase();
}
function classifyPattern(patternText) {
  if (patternText.endsWith("/")) return "dir";
  if (patternText.startsWith("*") || patternText.startsWith("?")) return "glob";
  const hasPathSep = patternText.includes("/") || patternText.includes("\\");
  if (!hasPathSep && patternText.includes("*")) return "glob";
  if (hasPathSep) return "relative";
  if (patternText.includes("*") || patternText.includes("?")) return "glob";
  return "relative";
}
function matchGlob(pattern, fileName) {
  let regex = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    switch (c) {
      case "*":
        regex += "[^\\\\]*";
        break;
      case "?":
        regex += "[^\\\\]";
        break;
      case ".":
        regex += "\\.";
        break;
      default:
        regex += c;
    }
  }
  regex += "$";
  return new RegExp(regex, "i").test(fileName);
}
function matchPattern(patternText, targetPath, isDir, ruleFileDir) {
  const kind = classifyPattern(patternText);
  const normalizedTarget = normalizePath(targetPath);
  switch (kind) {
    case "dir": {
      if (!isDir) {
        const dirName2 = normalizePath(patternText.slice(0, -1));
        const segments = normalizedTarget.split("\\");
        const ruleSegments = normalizePath(ruleFileDir).split("\\");
        for (let i = ruleSegments.length; i < segments.length; i++) {
          if (segments[i] === dirName2) return true;
        }
        return false;
      }
      const dirName = normalizePath(patternText.slice(0, -1));
      const targetName = path.basename(normalizedTarget);
      if (targetName === dirName) {
        const normalizedRuleDir = normalizePath(ruleFileDir);
        return normalizedTarget.startsWith(normalizedRuleDir);
      }
      return false;
    }
    case "glob": {
      const targetName = path.basename(targetPath);
      return matchGlob(patternText, targetName);
    }
    case "relative": {
      const normalizedRuleDir = normalizePath(ruleFileDir);
      const normalizedPattern = normalizePath(patternText);
      const expectedPath = normalizedRuleDir + "\\" + normalizedPattern;
      if (normalizedTarget === expectedPath) return true;
      if (!patternText.includes("*") && !patternText.includes("?")) {
        if (normalizedTarget.startsWith(expectedPath + "\\")) return true;
      }
      return false;
    }
  }
}
function matchPatterns(patterns, targetPath, isDir, ruleFileDir) {
  const matchingPatterns = [];
  for (const pattern of patterns) {
    const patternRuleDir = path.dirname(pattern.ruleFilePath);
    if (matchPattern(pattern.patternText, targetPath, isDir, patternRuleDir)) {
      matchingPatterns.push(pattern);
    }
  }
  return {
    matched: matchingPatterns.length > 0,
    matchingPatterns
  };
}
function createRootContext() {
  return {
    mode: RuleMode.NONE,
    patterns: [],
    ruleChain: []
  };
}
function deriveChildContext(parentContext, ruleFiles) {
  if (ruleFiles.length === 0) {
    return { ...parentContext };
  }
  const ruleFile = ruleFiles[0];
  if (ruleFile.type === RuleType.IGNORE_FILE) {
    if (parentContext.mode === RuleMode.IGNORE) {
      return {
        mode: RuleMode.IGNORE,
        patterns: [...parentContext.patterns, ...ruleFile.lines],
        ruleChain: [...parentContext.ruleChain, ruleFile.path]
      };
    } else {
      return {
        mode: RuleMode.IGNORE,
        patterns: [...ruleFile.lines],
        ruleChain: [ruleFile.path]
      };
    }
  } else {
    if (parentContext.mode === RuleMode.INCLUDE) {
      return {
        mode: RuleMode.INCLUDE,
        patterns: [...parentContext.patterns, ...ruleFile.lines],
        ruleChain: [...parentContext.ruleChain, ruleFile.path]
      };
    } else {
      return {
        mode: RuleMode.INCLUDE,
        patterns: [...ruleFile.lines],
        ruleChain: [ruleFile.path]
      };
    }
  }
}
async function detectConflicts(rootPath) {
  const conflicts = [];
  async function walk(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const lowerNames = entries.map((e) => e.name.toLowerCase());
      if (lowerNames.includes(COPYIGNORE_NAME) && lowerNames.includes(COPYINCLUDE_NAME)) {
        conflicts.push(dirPath);
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await walk(path.join(dirPath, entry.name));
        }
      }
    } catch {
    }
  }
  await walk(rootPath);
  return conflicts;
}
const scanCache = /* @__PURE__ */ new Map();
function getCachedScan(scanId) {
  return scanCache.get(scanId);
}
async function scan(args) {
  const { source, dest, rootOnly } = args;
  const scanId = v4();
  const stats = {
    directoriesScanned: 0,
    ruleFilesFound: 0,
    conflictsFound: 0
  };
  const conflicts = await detectConflicts(source);
  stats.conflictsFound = conflicts.length;
  const ruleFilesByDir = /* @__PURE__ */ new Map();
  const contextCache = /* @__PURE__ */ new Map();
  await walkAndIndex(source, ruleFilesByDir, stats, rootOnly);
  const rootNode = await buildRootNode(
    source,
    ruleFilesByDir,
    contextCache
  );
  const scanResult = {
    scanId,
    sourceRoot: source,
    destRoot: dest,
    rootOnly,
    conflicts,
    rootNode,
    stats,
    ruleFilesByDir,
    contextCache
  };
  scanCache.set(scanId, scanResult);
  return {
    scanId,
    conflicts,
    rootNode,
    stats
  };
}
async function walkAndIndex(dirPath, ruleFilesByDir, stats, rootOnly, depth = 0) {
  stats.directoriesScanned++;
  if (depth === 0 || !rootOnly) {
    const ruleFiles = await findRuleFilesInDir(dirPath);
    if (ruleFiles.length > 0) {
      ruleFilesByDir.set(dirPath, ruleFiles);
      stats.ruleFilesFound += ruleFiles.length;
    }
  }
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const childPath = path.join(dirPath, entry.name);
        await walkAndIndex(childPath, ruleFilesByDir, stats, rootOnly, depth + 1);
      }
    }
  } catch {
  }
}
async function buildRootNode(rootPath, ruleFilesByDir, contextCache, rootOnly) {
  const rootContext = createRootContext();
  const ruleFiles = ruleFilesByDir.get(rootPath) || [];
  const context = deriveChildContext(rootContext, ruleFiles);
  contextCache.set(rootPath, context);
  let hasChildren = false;
  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    hasChildren = entries.some((e) => e.isDirectory());
  } catch {
  }
  return {
    path: rootPath,
    name: path.basename(rootPath),
    isDir: true,
    state: NodeState.INCLUDED,
    // Root is always included
    hasChildren,
    modeAtPath: context.mode
  };
}
function evaluateNodeState(nodePath, isDir, context, conflicts) {
  if (isDir && conflicts.includes(nodePath)) {
    return NodeState.CONFLICT;
  }
  if (context.mode === RuleMode.NONE) {
    return NodeState.INCLUDED;
  }
  context.ruleChain.length > 0 ? path.dirname(context.ruleChain[0]) : path.dirname(nodePath);
  const matchResult = matchPatterns(
    context.patterns,
    nodePath,
    isDir
  );
  if (context.mode === RuleMode.IGNORE) {
    return matchResult.matched ? NodeState.EXCLUDED : NodeState.INCLUDED;
  }
  if (context.mode === RuleMode.INCLUDE) {
    return matchResult.matched ? NodeState.INCLUDED : NodeState.EXCLUDED;
  }
  return NodeState.UNKNOWN;
}
async function listChildren(args) {
  const { scanId, dirPath } = args;
  const scan2 = getCachedScan(scanId);
  if (!scan2) {
    throw new Error(`Scan not found: ${scanId}`);
  }
  const parentContext = scan2.contextCache.get(dirPath);
  if (!parentContext) {
    throw new Error(`Context not found for directory: ${dirPath}`);
  }
  let entries;
  try {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    entries = dirents.map((d) => ({
      name: d.name,
      isDir: d.isDirectory()
    }));
  } catch {
    return { children: [] };
  }
  const children = [];
  for (const entry of entries) {
    const childPath = path.join(dirPath, entry.name);
    let childContext;
    if (entry.isDir) {
      const ruleFiles = scan2.ruleFilesByDir.get(childPath) || [];
      childContext = deriveChildContext(parentContext, ruleFiles);
      scan2.contextCache.set(childPath, childContext);
    } else {
      childContext = parentContext;
    }
    const state = evaluateNodeState(
      childPath,
      entry.isDir,
      childContext,
      scan2.conflicts
    );
    let hasChildren = false;
    if (entry.isDir) {
      try {
        const subEntries = await fs.readdir(childPath, { withFileTypes: true });
        hasChildren = subEntries.some((e) => e.isDirectory());
      } catch {
      }
    }
    children.push({
      path: childPath,
      name: entry.name,
      isDir: entry.isDir,
      state,
      hasChildren,
      modeAtPath: childContext.mode
    });
  }
  return { children };
}
async function explain(args) {
  const { scanId, nodePath } = args;
  const scan2 = getCachedScan(scanId);
  if (!scan2) {
    throw new Error(`Scan not found: ${scanId}`);
  }
  const parentDir = path.dirname(nodePath);
  const context = scan2.contextCache.get(parentDir);
  if (!context) {
    throw new Error(`Context not found for path: ${nodePath}`);
  }
  const isDir = nodePath === scan2.sourceRoot || nodePath.endsWith(path.sep);
  let decision;
  if (scan2.conflicts.includes(nodePath)) {
    decision = NodeState.CONFLICT;
  } else if (context.mode === RuleMode.NONE) {
    decision = NodeState.INCLUDED;
  } else {
    context.ruleChain.length > 0 ? path.dirname(context.ruleChain[0]) : parentDir;
    const matchResult = matchPatterns(
      context.patterns,
      nodePath,
      isDir
    );
    if (context.mode === RuleMode.IGNORE) {
      decision = matchResult.matched ? NodeState.EXCLUDED : NodeState.INCLUDED;
    } else {
      decision = matchResult.matched ? NodeState.INCLUDED : NodeState.EXCLUDED;
    }
  }
  let matchingPatterns = [];
  if (context.mode !== RuleMode.NONE && decision !== NodeState.CONFLICT) {
    context.ruleChain.length > 0 ? path.dirname(context.ruleChain[0]) : parentDir;
    const matchResult = matchPatterns(
      context.patterns,
      nodePath,
      isDir
    );
    matchingPatterns = matchResult.matchingPatterns;
  }
  return {
    explain: {
      path: nodePath,
      name: path.basename(nodePath),
      decision,
      mode: context.mode,
      ruleChain: context.ruleChain,
      matchingPatterns
    }
  };
}
function registerIpcHandlers() {
  electron.ipcMain.handle("selectFolder", async (_event, args) => {
    const win = electron.BrowserWindow.getFocusedWindow();
    const result = await electron.dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
      title: `Select ${args.kind === "source" ? "Source" : "Destination"} Folder`
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { path: null };
    }
    return { path: result.filePaths[0] };
  });
  electron.ipcMain.handle("scan", async (_event, args) => {
    return await scan(args);
  });
  electron.ipcMain.handle("listChildren", async (_event, args) => {
    return await listChildren(args);
  });
  electron.ipcMain.handle("explain", async (_event, args) => {
    return await explain(args);
  });
  electron.ipcMain.handle("openInExplorer", async (_event, args) => {
    try {
      await electron.shell.openPath(args.dirPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("copyToClipboard", async (_event, args) => {
    try {
      electron.clipboard.writeText(args.text);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
if (require("electron-squirrel-startup")) {
  electron.app.quit();
}
let mainWindow = null;
const createWindow = () => {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  {
    mainWindow.loadURL("http://localhost:5173");
  }
};
electron.app.on("ready", () => {
  registerIpcHandlers();
  createWindow();
});
electron.app.on("window-all-closed", () => {
  electron.app.quit();
});
//# sourceMappingURL=main.js.map
