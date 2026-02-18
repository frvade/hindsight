# Hindsight Memory for OpenClaw

[Hindsight](https://hindsight.vectorize.io) memory backend for OpenClaw — SOTA agent memory with knowledge graph, entity resolution, temporal reasoning, and TEMPR retrieval.

## Architecture

```
OpenClaw ←→ Plugin (lifecycle hooks + tools) ←→ Hindsight API ←→ PostgreSQL
```

- **Auto-recall**: Before each agent turn, searches Hindsight for relevant memories and injects them into context
- **Auto-capture**: After each agent turn, sends conversation to Hindsight for LLM-based fact extraction
- **5 tools**: `memory_search`, `memory_store`, `memory_get`, `memory_list`, `memory_forget`

## Setup

### 1. Start Hindsight

```bash
cp .env.example .env
# Edit .env with your API keys
docker compose up -d
```

Hindsight API will be available at `http://127.0.0.1:8888`.

### 2. Install Plugin

Symlink the plugin into OpenClaw extensions:

```bash
ln -s /path/to/hindsight/plugin ~/.openclaw/extensions/memory-hindsight
```

### 3. Configure OpenClaw

Add to `openclaw.json`:

```json
{
  "plugins": {
    "slots": {
      "memory": "memory-hindsight"
    },
    "entries": {
      "memory-hindsight": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:8888",
          "bankId": "openclaw"
        }
      }
    }
  }
}
```

### 4. Restart Gateway

```bash
openclaw gateway restart
```

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `baseUrl` | `http://127.0.0.1:8888` | Hindsight API URL |
| `bankId` | `openclaw` | Memory bank ID |
| `namespace` | `default` | Hindsight namespace |
| `autoRecall` | `true` | Inject memories before each turn |
| `autoCapture` | `true` | Extract facts after each turn |
| `recallLimit` | `5` | Max memories per recall |
| `captureMaxMessages` | `10` | Max messages to capture per turn |

## CLI

```bash
openclaw hindsight status    # Health check + stats
openclaw hindsight search "query"  # Search memories
openclaw hindsight reflect "question"  # Reason about a query
```
