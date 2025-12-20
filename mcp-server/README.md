# MCP Model Router Server

An intelligent Model Context Protocol (MCP) server that automatically selects the best AI model for any given query based on complexity, domain, capabilities, cost, and performance metrics.

## Features

- 🤖 **Intelligent Model Selection** - Automatically routes queries to the optimal AI model
- 📊 **Query Analysis** - Analyzes complexity, domain, and requirements
- 💰 **Cost Optimization** - Balances quality and cost based on preferences
- 📈 **Performance Tracking** - Monitors success rates and response times
- 🔌 **MCP Protocol** - Standard protocol for AI model context management

## Available Models

- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, GPT-4.1 Mini
- **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet
- **Ollama**: Llama 3, Mistral 7B (local)

## Installation

```bash
cd mcp-server
npm install
```

## Usage

### Running the Server

#### Stdio Mode (for local integration)
```bash
npm run dev
```

The server will run on stdio transport, suitable for integration with MCP clients.

### MCP Tools

#### 1. `select_model`
Select the best AI model for a query.

**Input:**
```json
{
  "query": "Explain quantum entanglement",
  "preferences": {
    "prioritizeCost": false,
    "prioritizeSpeed": false,
    "prioritizeQuality": true
  }
}
```

**Output:**
```json
{
  "model": "gpt-4",
  "provider": "openai",
  "displayName": "GPT-4",
  "reasoning": "Query is complex complexity technical task. Selected GPT-4 because: excellent reasoning ability, excellent at coding. quality optimization enabled.",
  "confidence": 0.89
}
```

#### 2. `analyze_query`
Analyze query characteristics.

**Input:**
```json
{
  "query": "Write a React component"
}
```

**Output:**
```json
{
  "complexity": "moderate",
  "domain": "coding",
  "requirements": {
    "needsLongContext": false,
    "needsReasoning": false,
    "needsCreativity": false,
    "needsCodeGeneration": true,
    "needsDataAnalysis": false
  },
  "estimatedTokens": 5,
  "confidence": 0.8
}
```

#### 3. `get_model_recommendations`
Get ranked list of suitable models.

**Input:**
```json
{
  "query": "What is machine learning?",
  "topN": 3
}
```

**Output:**
```json
{
  "recommendations": [
    {
      "model": "gpt-3.5-turbo",
      "provider": "openai",
      "score": 92,
      "reasoning": "very fast, zero cost"
    },
    {
      "model": "gemini-2.0-flash-exp",
      "provider": "google",
      "score": 89,
      "reasoning": "very fast, zero cost"
    },
    // ...
  ]
}
```

### MCP Resources

#### `model://capabilities`
Complete model capability matrix with specs, performance ratings, and costs.

#### `model://available`
List of currently available models.

#### `stats://performance`
Performance statistics for all models (success rates, response times).

#### `stats://routing-history`
Recent routing decisions (last 50).

## Integration with Next.js

See the main Next.js app for integration examples. The MCP server can be accessed via:

1. **Stdio integration** - Spawn the MCP server as a child process
2. **HTTP wrapper** - Create an API route that communicates with the MCP server

Example integration code is provided in the Next.js app under:
- `src/lib/mcp-client.ts` - MCP client wrapper
- `src/app/api/model-selector/route.ts` - HTTP API endpoint

## Model Selection Algorithm

The server uses a sophisticated scoring algorithm that considers:

1. **Query Analysis**
   - Complexity: simple, moderate, complex
   - Domain: general, coding, creative, analytics, technical
   - Requirements: long context, reasoning, creativity, code generation, data analysis

2. **Model Scoring**
   - Capability match (speed, reasoning, coding, creative, analytics)
   - Preference modifiers (cost, speed, quality)
   - Context window requirements
   - Cost constraints

3. **Selection**
   - Highest scoring model is selected
   - Top 5 alternatives provided
   - Detailed reasoning generated

## Example Routing Decisions

**Simple Query:** "What is the capital of France?"
- **Selected:** GPT-3.5 Turbo or Gemini Flash
- **Reason:** Simple query, prioritize speed and cost

**Complex Query:** "Explain quantum entanglement and its implications for cryptography"
- **Selected:** GPT-4 or Gemini 1.5 Pro
- **Reason:** Complex reasoning required, prioritize quality

**Coding Query:** "Write a TypeScript function to debounce API calls"
- **Selected:** GPT-4 or Claude 3
- **Reason:** Code generation, prioritize coding capability

**Creative Query:** "Write a short story about AI"
- **Selected:** GPT-4 or Claude 3 Opus
- **Reason:** Creative writing, prioritize creativity

## Development

### Build
```bash
npm run build
```

### Run Production Build
```bash
npm start
```

### Testing
```bash
npm test
```

## Configuration

Model capabilities and characteristics can be adjusted in:
- `src/lib/model-capabilities.ts` - Model specs and ratings
- `src/lib/model-analyzer.ts` - Query analysis patterns
- `src/lib/model-router.ts` - Scoring algorithm

## License

MIT
