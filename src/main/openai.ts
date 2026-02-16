import OpenAI from 'openai';

export type RuleType = 'copyignore' | 'copyinclude';

export type GenerateRulesArgs = {
  apiKey: string;
  model: string;
  ruleType: RuleType;
  instruction: string;
  currentText: string;
  fileSummaries: string;
};

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    // Remove leading ```lang
    const withoutFirst = trimmed.replace(/^```[a-zA-Z0-9_-]*\n?/, '');
    // Remove trailing ```
    return withoutFirst.replace(/\n?```\s*$/, '').trim() + '\n';
  }
  return trimmed + (trimmed.endsWith('\n') ? '' : '\n');
}

export async function generateRulesWithOpenAI(args: GenerateRulesArgs): Promise<string> {
  const client = new OpenAI({ apiKey: args.apiKey });

  const system =
    'You write rule files for Smart Copy Utility. ' +
    'Output MUST be plain rule lines only (no markdown, no code fences, no explanations).\n' +
    'Rule language: one pattern per line. Case-insensitive on Windows.\n' +
    '- Use name/ to match directories (trailing slash).\n' +
    '- Use *.ext for glob matches.\n' +
    '- Use relative paths like foo/bar.txt for specific paths.\n' +
    '- No negation patterns.\n' +
    'If asked to modify existing rules, preserve unrelated rules when reasonable.';

  const user =
    `Rule file type: ${args.ruleType === 'copyignore' ? '.copyignore (blacklist)' : '.copyinclude (whitelist)'}\n` +
    `Model: ${args.model}\n\n` +
    `User instruction:\n${args.instruction}\n\n` +
    `Current rule file contents (may be empty):\n---\n${args.currentText}\n---\n\n` +
    `Project context (selected files):\n${args.fileSummaries}\n\n` +
    'Return the full updated rule file contents as plain lines.';

  const resp: any = await client.responses.create({
    model: args.model,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      { role: 'user', content: [{ type: 'input_text', text: user }] },
    ],
  });

  const outputText: string | undefined = resp.output_text;
  if (typeof outputText === 'string' && outputText.trim().length > 0) {
    return stripCodeFences(outputText);
  }

  // Fallback: try to find text in output structure
  const chunks: string[] = [];
  const output = resp.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const content = item?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (c?.type === 'output_text' && typeof c.text === 'string') {
            chunks.push(c.text);
          }
        }
      }
    }
  }

  const joined = chunks.join('\n').trim();
  if (!joined) {
    throw new Error('OpenAI returned no text output');
  }

  return stripCodeFences(joined);
}
