import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { listHindsightPublicArtifacts } from './index.js';
import type { MoltbotConfig } from './types.js';

let tempDir: string | null = null;

afterEach(() => {
  vi.restoreAllMocks();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('public artifacts', () => {
  it('materializes Hindsight documents as daily-note artifacts', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'hindsight-artifacts-'));

    const cfg: MoltbotConfig = {
      agents: {
        defaults: { workspace: tempDir },
        list: [{ id: 'main', default: true, workspace: tempDir }],
      },
      plugins: {
        entries: {
          'hindsight-openclaw': {
            config: {
              hindsightApiUrl: 'https://api.example.com',
            },
          },
        },
      },
    };

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url === 'https://api.example.com/v1/default/banks') {
        return {
          ok: true,
          json: async () => ({
            banks: [{ bank_id: 'bank-a', name: 'Bank A', mission: 'Remember things' }],
          }),
        };
      }
      if (url === 'https://api.example.com/v1/default/banks/bank-a/documents?limit=100&offset=0') {
        return {
          ok: true,
          json: async () => ({
            items: [{ id: 'doc/1', bank_id: 'bank-a', updated_at: '2024-01-02T00:00:00Z' }],
          }),
        };
      }
      if (url === 'https://api.example.com/v1/default/banks/bank-a/documents/doc%2F1') {
        return {
          ok: true,
          json: async () => ({
            id: 'doc/1',
            bank_id: 'bank-a',
            original_text: 'hello from stored document',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            memory_unit_count: 2,
            tags: ['alpha'],
            document_metadata: { source: 'telegram' },
            retain_params: { context: 'chat' },
          }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const artifacts = await listHindsightPublicArtifacts(cfg);

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]?.kind).toBe('daily-note');
    expect(artifacts[0]?.relativePath).toContain('memory/hindsight-bridge/bank-a/');

    const written = readFileSync(artifacts[0]!.absolutePath, 'utf8');
    expect(written).toContain('hello from stored document');
    expect(written).toContain('Remember things');
  });
});
