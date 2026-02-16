import React from 'react';
import patternLibrary from '../patternLibrary.json';

type RuleType = 'copyignore' | 'copyinclude';

type PatternLibraryEntry = {
  id: string;
  title: string;
  category: string;
  appliesTo: RuleType | 'both';
  snippetLines: string[];
  notes?: string;
};

type RuleFileOpenResult =
  | { success: true; filePath: string; ruleType: RuleType; content: string }
  | { success: false; error: string };

type RuleSaveCheckResult = {
  success: true;
  targetExists: boolean;
  otherTypeExists: boolean;
  otherTypePath: string | null;
} | { success: false; error: string };

type RuleWriteResult = { success: true } | { success: false; error: string };

type AiGenerateResult =
  | { success: true; generatedText: string }
  | { success: false; error: string };

export function RulesScreen(): React.ReactElement {
  const [ruleType, setRuleType] = React.useState<RuleType>('copyignore');
  const [filePath, setFilePath] = React.useState<string | null>(null);
  const [text, setText] = React.useState<string>('');
  const [dirty, setDirty] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const [selectedSnippetId, setSelectedSnippetId] = React.useState<string>(() => {
    const first = (patternLibrary as PatternLibraryEntry[]).find((e) => e.appliesTo === 'copyignore' || e.appliesTo === 'both');
    return first?.id ?? '';
  });

  const [saveWarning, setSaveWarning] = React.useState<{
    targetPath: string;
    check: Extract<RuleSaveCheckResult, { success: true }>;
  } | null>(null);

  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // OpenAI state
  const [hasApiKey, setHasApiKey] = React.useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = React.useState<string>('');
  const [aiPrompt, setAiPrompt] = React.useState<string>('');
  const [aiIncludeFileContents, setAiIncludeFileContents] = React.useState<boolean>(false);
  const [aiSelectedFiles, setAiSelectedFiles] = React.useState<string[]>([]);
  const [aiScannedFolder, setAiScannedFolder] = React.useState<string | null>(null);
  const [aiScannedFolderStructure, setAiScannedFolderStructure] = React.useState<string>('');
  const [aiRecursiveScan, setAiRecursiveScan] = React.useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = React.useState<boolean>(false);
  const [aiGeneratedText, setAiGeneratedText] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await window.electronAPI.hasOpenAIApiKey();
        if (!cancelled) setHasApiKey(result.hasKey);
      } catch {
        if (!cancelled) setHasApiKey(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle menu actions
  React.useEffect(() => {
    const unsubMenuAction = window.electronAPI.onMenuAction((data: { action: string }) => {
      switch (data.action) {
        case 'openRuleFile':
          openRuleFile();
          break;
        case 'saveRuleFile':
          save();
          break;
        default:
          break;
      }
    });

    return () => {
      unsubMenuAction();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = (patternLibrary as PatternLibraryEntry[]).filter((e) => e.appliesTo === ruleType || e.appliesTo === 'both');
  const selectedEntry = entries.find((e) => e.id === selectedSnippetId) ?? null;

  const setEditorText = (next: string) => {
    setText(next);
    setDirty(true);
  };

  const insertSnippet = (mode: 'insert' | 'append') => {
    if (!selectedEntry) return;
    const snippet = selectedEntry.snippetLines.join('\n') + '\n';

    if (mode === 'append' || !textAreaRef.current) {
      const separator = text.length > 0 && !text.endsWith('\n') ? '\n' : '';
      setEditorText(text + separator + snippet);
      return;
    }

    const ta = textAreaRef.current;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const next = text.slice(0, start) + snippet + text.slice(end);
    setEditorText(next);

    // restore cursor after inserted text
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const openRuleFile = async () => {
    setMessage(null);
    setSaveWarning(null);
    const result = (await window.electronAPI.openRuleFileDialog()) as RuleFileOpenResult;
    if (!result.success) {
      setMessage(result.error);
      return;
    }

    if (dirty) {
      // Minimal safety: don’t auto-discard, just inform. User can reopen if desired.
      setMessage('Opened file. Note: previous unsaved changes were replaced.');
    }

    setRuleType(result.ruleType);
    setFilePath(result.filePath);
    setText(result.content);
    setDirty(false);
  };

  const newRuleFile = async () => {
    setMessage(null);
    setSaveWarning(null);

    const folder = await window.electronAPI.selectDirectory({ title: 'Select folder to create rule file in' });
    if (!folder.path) return;

    const targetPath = await window.electronAPI.getDefaultRuleFilePath({ folderPath: folder.path, ruleType });
    setFilePath(targetPath.filePath);
    setText('');
    setDirty(false);
    setMessage(`New ${ruleType === 'copyignore' ? '.copyignore' : '.copyinclude'} ready: ${targetPath.filePath}`);
  };

  const saveAs = async (): Promise<string | null> => {
    const result = await window.electronAPI.showSaveRuleFileDialog({ ruleType, defaultDir: filePath ? undefined : undefined });
    return result.filePath;
  };

  const runSaveChecks = async (targetPath: string) => {
    const check = (await window.electronAPI.checkRuleFileSave({ targetPath, ruleType })) as RuleSaveCheckResult;
    if (!check.success) {
      setMessage(check.error);
      return;
    }

    if (check.targetExists || check.otherTypeExists) {
      setSaveWarning({ targetPath, check });
      return;
    }

    await writeRuleFile(targetPath, { overwriteExisting: false, allowConflict: false });
  };

  const writeRuleFile = async (
    targetPath: string,
    options: { overwriteExisting: boolean; allowConflict: boolean }
  ) => {
    const result = (await window.electronAPI.writeRuleFile({
      targetPath,
      ruleType,
      content: text,
      overwriteExisting: options.overwriteExisting,
      allowConflict: options.allowConflict,
    })) as RuleWriteResult;

    if (!result.success) {
      setMessage(result.error);
      return;
    }

    setFilePath(targetPath);
    setDirty(false);
    setSaveWarning(null);
    setMessage('Saved.');
  };

  const save = async () => {
    setMessage(null);
    setSaveWarning(null);

    const targetPath = filePath ?? (await saveAs());
    if (!targetPath) return;

    await runSaveChecks(targetPath);
  };

  const setApiKey = async () => {
    setMessage(null);
    try {
      const result = await window.electronAPI.setOpenAIApiKey({ apiKey: apiKeyInput });
      if (result.success) {
        setHasApiKey(true);
        setApiKeyInput('');
        setMessage('OpenAI API key saved.');
      } else {
        setMessage(result.error || 'Failed to save key.');
      }
    } catch (e) {
      setMessage(String(e));
    }
  };

  const clearApiKey = async () => {
    setMessage(null);
    const result = await window.electronAPI.clearOpenAIApiKey();
    if (result.success) {
      setHasApiKey(false);
      setMessage('OpenAI API key cleared.');
    } else {
      setMessage(result.error || 'Failed to clear key.');
    }
  };

  const selectAiFiles = async () => {
    setMessage(null);
    const result = await window.electronAPI.selectFiles({ title: 'Select files to inform rule generation', multi: true });
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setAiSelectedFiles(result.filePaths);
  };

  const scanFolderForAi = async () => {
    setMessage(null);
    const folder = await window.electronAPI.selectDirectory({ title: 'Select folder to scan for AI context' });
    if (!folder.path) return;

    try {
      const result = await window.electronAPI.scanFolderForAI({ folderPath: folder.path, recursive: aiRecursiveScan });
      if (!result.success) {
        setMessage(result.error || 'Folder scan failed');
        return;
      }
      setAiScannedFolder(folder.path);
      setAiScannedFolderStructure(result.formatted || '');
      setMessage(`Scanned folder: ${folder.path}`);
    } catch (e) {
      setMessage(String(e));
    }
  };

  const generateWithAi = async () => {
    setMessage(null);
    setAiGeneratedText('');

    if (!hasApiKey) {
      setMessage('Configure an OpenAI API key first.');
      return;
    }

    if (!aiPrompt.trim()) {
      setMessage('Enter a prompt for the generator.');
      return;
    }

    setAiGenerating(true);
    try {
      const result = (await window.electronAPI.generateRulesWithOpenAI({
        model: 'gpt-5-mini',
        ruleType,
        instruction: aiPrompt,
        currentText: text,
        filePaths: aiSelectedFiles,
        includeFileContents: aiIncludeFileContents,
        folderStructure: aiScannedFolderStructure || undefined,
      })) as AiGenerateResult;

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setAiGeneratedText(result.generatedText);
      setMessage('AI generation complete. Review before applying.');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiReplace = () => {
    if (!aiGeneratedText) return;
    setEditorText(aiGeneratedText);
    setMessage('Applied AI output to editor (replaced).');
  };

  const applyAiAppend = () => {
    if (!aiGeneratedText) return;
    const separator = text.length > 0 && !text.endsWith('\n') ? '\n' : '';
    setEditorText(text + separator + aiGeneratedText + (aiGeneratedText.endsWith('\n') ? '' : '\n'));
    setMessage('Applied AI output to editor (appended).');
  };

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {/* Left: Editor */}
      <div style={{ flex: 1, minWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>Rule Editor</div>
          <select
            value={ruleType}
            onChange={(e) => {
              const next = e.target.value as RuleType;
              setRuleType(next);
              setSaveWarning(null);
              setMessage(null);
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            title="Select whether you're editing a .copyignore (blacklist) or .copyinclude (whitelist)."
          >
            <option value="copyignore">.copyignore</option>
            <option value="copyinclude">.copyinclude</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {filePath ? filePath : '(no file selected)'} {dirty ? '• modified' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={openRuleFile}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Open…
          </button>
          <button
            onClick={newRuleFile}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            New in Folder…
          </button>
          <button
            onClick={save}
            disabled={!dirty && !!filePath}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: !dirty && !!filePath ? 'var(--button-disabled)' : 'var(--button-copy)',
              color: 'var(--button-text)',
              cursor: !dirty && !!filePath ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              opacity: !dirty && !!filePath ? 0.7 : 1,
            }}
            title={!dirty && !!filePath ? 'No changes to save' : ''}
          >
            Save
          </button>
          <button
            onClick={async () => {
              const target = await saveAs();
              if (!target) return;
              await runSaveChecks(target);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Save As…
          </button>
        </div>

        {saveWarning && (
          <div
            style={{
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid var(--warning-border)',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Save warning</div>
            {saveWarning.check.otherTypeExists && (
              <div style={{ marginBottom: '6px' }}>
                This folder already contains the other rule file ({saveWarning.check.otherTypePath}). Saving may create a conflict.
              </div>
            )}
            {saveWarning.check.targetExists && (
              <div style={{ marginBottom: '6px' }}>Target file already exists and will be overwritten.</div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() =>
                  writeRuleFile(saveWarning.targetPath, {
                    overwriteExisting: saveWarning.check.targetExists,
                    allowConflict: saveWarning.check.otherTypeExists,
                  })
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--button-reset)',
                  color: 'var(--button-text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Proceed
              </button>
              <button
                onClick={() => setSaveWarning(null)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {message && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            {message}
          </div>
        )}

        <textarea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setEditorText(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            height: '420px',
            resize: 'vertical',
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'Consolas, monospace',
            fontSize: '13px',
            lineHeight: 1.4,
          }}
        />

        {/* AI */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>AI Rule Generator (OpenAI)</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Sends your prompt plus selected file paths (and optionally file contents) to OpenAI.
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder={hasApiKey ? 'API key saved' : 'OpenAI API key'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: 260,
                padding: '8px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
              disabled={hasApiKey}
            />
            {!hasApiKey ? (
              <button
                onClick={setApiKey}
                disabled={!apiKeyInput.trim()}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: apiKeyInput.trim() ? 'var(--button-bg)' : 'var(--button-disabled)',
                  color: 'var(--button-text)',
                  cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 700,
                  opacity: apiKeyInput.trim() ? 1 : 0.7,
                }}
              >
                Save Key
              </button>
            ) : (
              <button
                onClick={clearApiKey}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--button-cancel)',
                  color: 'var(--button-text)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                Clear Key
              </button>
            )}
          </div>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe what you want these rules to do…"
            style={{
              width: '100%',
              height: '90px',
              resize: 'vertical',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={selectAiFiles}
              disabled={aiGenerating}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: aiGenerating ? 'var(--button-disabled)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: aiGenerating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                opacity: aiGenerating ? 0.6 : 1,
              }}
            >
              Select Files… ({aiSelectedFiles.length})
            </button>
            <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="checkbox" 
                checked={aiIncludeFileContents} 
                onChange={(e) => setAiIncludeFileContents(e.target.checked)}
                disabled={aiGenerating}
              />
              Include file contents (small text files only)
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={scanFolderForAi}
              disabled={aiGenerating}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: aiGenerating ? 'var(--button-disabled)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: aiGenerating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                opacity: aiGenerating ? 0.6 : 1,
              }}
            >
              Scan Folder…
            </button>
            <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="checkbox" 
                checked={aiRecursiveScan} 
                onChange={(e) => setAiRecursiveScan(e.target.checked)}
                disabled={aiGenerating}
              />
              Recursive (deep scan)
            </label>
            {aiScannedFolder && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {aiScannedFolder}
              </span>
            )}
            <button
              onClick={generateWithAi}
              disabled={aiGenerating}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: aiGenerating ? 'var(--button-disabled)' : 'var(--button-preview)',
                color: 'var(--button-text)',
                cursor: aiGenerating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 800,
                marginLeft: 'auto',
                opacity: aiGenerating ? 0.8 : 1,
              }}
            >
              {aiGenerating ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {/* AI Generation Progress Indicator */}
          {aiGenerating && (
            <div
              style={{
                padding: '12px 16px',
                marginTop: '12px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid var(--border-color)',
                  borderTop: '3px solid var(--button-preview)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                Generating rules with AI (GPT-5-mini)...
              </span>
            </div>
          )}

          {aiGeneratedText && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  onClick={applyAiReplace}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--button-copy)',
                    color: 'var(--button-text)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  Replace Editor
                </button>
                <button
                  onClick={applyAiAppend}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  Append to Editor
                </button>
              </div>
              <textarea
                value={aiGeneratedText}
                onChange={(e) => setAiGeneratedText(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: '160px',
                  resize: 'vertical',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'Consolas, monospace',
                  fontSize: '13px',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Library */}
      <div style={{ width: 380 }}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Pattern Library</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Pick a snippet and insert into the editor.
        </div>

        <select
          value={selectedSnippetId}
          onChange={(e) => setSelectedSnippetId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            marginBottom: '10px',
          }}
        >
          {entries.map((e) => (
            <option key={e.id} value={e.id}>
              [{e.category}] {e.title}
            </option>
          ))}
        </select>

        {selectedEntry && (
          <div
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: '10px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>{selectedEntry.title}</div>
            {selectedEntry.notes && <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{selectedEntry.notes}</div>}
            <pre
              style={{
                margin: 0,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'Consolas, monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedEntry.snippetLines.join('\n')}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => insertSnippet('insert')}
            disabled={!selectedEntry}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: selectedEntry ? 'var(--button-bg)' : 'var(--button-disabled)',
              color: 'var(--button-text)',
              cursor: selectedEntry ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 800,
              opacity: selectedEntry ? 1 : 0.7,
            }}
          >
            Insert
          </button>
          <button
            onClick={() => insertSnippet('append')}
            disabled={!selectedEntry}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: selectedEntry ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 800,
              opacity: selectedEntry ? 1 : 0.7,
            }}
          >
            Append
          </button>
        </div>
      </div>
    </div>
  );
}
