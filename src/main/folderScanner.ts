import fs from 'fs/promises';
import path from 'path';

export type FolderStructure = {
  path: string;
  name: string;
  isDir: boolean;
  size?: number;
  children?: FolderStructure[];
};

async function scanFolderRecursive(
  dirPath: string,
  maxDepth: number,
  currentDepth: number = 0
): Promise<FolderStructure[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: FolderStructure[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        const stat = await fs.stat(fullPath);
        const item: FolderStructure = {
          path: fullPath,
          name: entry.name,
          isDir: entry.isDirectory(),
        };

        if (entry.isFile()) {
          item.size = stat.size;
        }

        if (entry.isDirectory() && currentDepth + 1 < maxDepth) {
          item.children = await scanFolderRecursive(fullPath, maxDepth, currentDepth + 1);
        }

        results.push(item);
      } catch {
        // Skip inaccessible files/folders
      }
    }

    return results.sort((a, b) => {
      // Directories first, then alphabetical
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function scanFolder(folderPath: string, recursive: boolean): Promise<FolderStructure> {
  const maxDepth = recursive ? 10 : 1; // Limit recursion to avoid hanging
  const stat = await fs.stat(folderPath);
  
  const root: FolderStructure = {
    path: folderPath,
    name: path.basename(folderPath),
    isDir: true,
    children: await scanFolderRecursive(folderPath, maxDepth, 0),
  };

  return root;
}

export function formatFolderStructure(structure: FolderStructure, indent: string = ''): string {
  const lines: string[] = [];
  
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const icon = structure.isDir ? '📁' : '📄';
  const sizeStr = structure.size !== undefined ? ` (${formatSize(structure.size)})` : '';
  lines.push(`${indent}${icon} ${structure.name}${sizeStr}`);

  if (structure.children && structure.children.length > 0) {
    for (const child of structure.children) {
      lines.push(formatFolderStructure(child, indent + '  '));
    }
  }

  return lines.join('\n');
}
