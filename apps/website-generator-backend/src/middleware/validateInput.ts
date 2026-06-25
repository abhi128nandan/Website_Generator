const MAX_TEXT_LENGTH = 50_000; // 50 KB of plain text is generous for an SRS
const MAX_FILE_SIZE   = 5 * 1024 * 1024; // 5 MB

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /system\s*prompt/i,
  /you\s+are\s+now\s+a/i,
  /disregard\s+(your|all)\s+(previous|prior|instructions)/i,
  /\[SYSTEM\]/i,
  /<\|system\|>/i,
];

export function validateTextInput(text: string): string {
  if (typeof text !== 'string') throw new Error('Input must be a string');
  if (text.trim().length === 0) throw new Error('Input cannot be empty');
  if (text.length > MAX_TEXT_LENGTH) throw new Error(`Input exceeds ${MAX_TEXT_LENGTH} character limit`);

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error('Input contains disallowed content');
    }
  }

  // Strip null bytes and control characters except newlines/tabs
  return text.replace(/\x00/g, '').replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function validateFileSize(buffer: Buffer): void {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`);
  }
}

export function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
