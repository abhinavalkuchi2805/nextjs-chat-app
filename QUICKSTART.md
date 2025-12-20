# MCP Model Router - Quick Start Guide

## Installation

### 1. Install MCP Server Dependencies

```bash
cd mcp-server
npm install
```

### 2. Install Next.js App Dependencies

```bash
cd ..
npm install @modelcontextprotocol/sdk zod
```

## Running the System

### Option 1: Automatic Integration (Recommended)

The MCP server will be automatically spawned by the Next.js app when needed.

```bash
npm run dev
```

Then open http://localhost:3000 and start chatting! The system will automatically select the best model for each query.

### Option 2: Run MCP Server Standalone

For testing or development:

```bash
cd mcp-server
npm run dev
```

The server will run on stdio transport and can be tested with MCP clients.

## Testing

### Test 1: Check MCP Server Status

```bash
curl http://localhost:3000/api/model-selector
```

Expected response:
```json
{
  "status": "connected",
  "availableModels": 9,
  "totalModels": 11
}
```

### Test 2: Test Model Selection

```bash
curl -X POST http://localhost:3000/api/model-selector \
  -H "Content-Type: application/json" \
  -d '{"query": "Write a Python sorting algorithm"}'
```

Expected: Returns selected model (likely GPT-4 for coding tasks).

### Test 3: Chat with Auto Model Selection

Use the chat UI or:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain quantum computing", "provider": "auto"}'
```

## How Auto-Selection Works

1. **Simple queries** → Fast, cheap models (Gemini Flash, GPT-3.5)
2. **Complex reasoning** → High-quality models (GPT-4, Gemini Pro)
3. **Coding tasks** → Coding-optimized models (GPT-4, Claude)
4. **Creative writing** → Creative-optimized models (GPT-4, Claude Opus)

## Configuration

### Enable/Disable Auto-Selection

In your chat UI, you can:
- Manually select a provider (OpenAI, Google, Ollama)
- Set `provider: "auto"` to enable intelligent routing
- Leave provider empty to use auto-selection

### Customize Model Selection

Edit `mcp-server/src/lib/model-router.ts` to adjust:
- Scoring weights
- Cost/quality tradeoffs
- Model preferences

### Add New Models

Edit `mcp-server/src/lib/model-capabilities.ts` to add new models with their capabilities.

## Troubleshooting

### MCP Server Not Starting

Check that Node.js and npm are installed:
```bash
node --version
npm --version
```

### Dependencies Not Found

Make sure to install dependencies in **both** directories:
```bash
cd mcp-server && npm install
cd .. && npm install @modelcontextprotocol/sdk zod
```

### Fallback to Default Model

If you see "using fallback" in logs, the MCP server couldn't be reached. The system will still work with the default model (GPT-3.5).

## Documentation

- **Full Documentation**: See `mcp-server/README.md`
- **Implementation Details**: See walkthrough artifact
- **API Documentation**: See implementation plan artifact
