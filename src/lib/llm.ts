import { SearchResult } from '@/types';
import { generateResponse } from './search';

// Generate LLM response using OpenAI
export async function generateLLMResponseOpenAI(
  query: string, 
  vectorResults: SearchResult
): Promise<string> {
  const matches = vectorResults.results.matches || [];

  if (matches.length === 0) {
    return "I couldn't find any results matching your query.";
  }

  const context = {
    query,
    totalResults: matches.length,
    results: matches.map((match, index) => ({
      rank: index + 1,
      score: match.score,
      ...match.metadata
    }))
  };

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful e-commerce assistant. Provide clear, concise answers based on the data provided. Use natural language and format responses in a user-friendly way.'
    },
    {
      role: 'user',
      content: `Query: "${query}"\n\nResults:\n${JSON.stringify(context.results, null, 2)}\n\nPlease provide a natural response answering the user's query.`
    }
  ];

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured, falling back to template response');
      return generateResponse(query, vectorResults);
    }

    console.log(`Generating OpenAI response using ${OPENAI_MODEL}...`);

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = JSON.parse(responseText);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Invalid OpenAI response format');
    }

    const llmResponse = data.choices[0].message.content;
    console.log('OpenAI response generated successfully');
    return llmResponse;

  } catch (err) {
    console.error('OpenAI response generation error:', err);
    console.log('Falling back to template-based response');
    return generateResponse(query, vectorResults);
  }
}

// Generate LLM response using Ollama
export async function generateLLMResponseOllama(
  query: string, 
  vectorResults: SearchResult
): Promise<string> {
  const matches = vectorResults.results.matches || [];
  const requestedTopK = vectorResults.requestedTopK;
  const method = vectorResults.method;

  if (matches.length === 0) {
    return "I couldn't find any results matching your query. Try adjusting your search terms!";
  }

  const context = {
    query,
    method,
    totalResults: matches.length,
    requestedTopK,
    results: matches.map((match, index) => ({
      rank: index + 1,
      score: match.score,
      ...match.metadata
    }))
  };

  const prompt = `You are a helpful e-commerce assistant analyzing customer behavior data.

User Query: "${query}"

Search Method Used: ${method}
Results Found: ${matches.length}${requestedTopK ? ` (user requested top ${requestedTopK})` : ''}

Results Data:
${JSON.stringify(context.results, null, 2)}

Please provide a natural, conversational response that:
1. Directly answers the user's question
2. Highlights the most relevant findings
3. Uses bullet points or numbered lists only when appropriate
4. For product results, focus on key details like name, price, rating, and availability
5. For analytics queries, provide clear insights
6. Keep it concise but informative
7. Use a friendly, helpful tone

Response:`;

  try {
    const OLLAMA_URL = process.env.OLLAMA_URL?.replace('/api/embeddings', '/api/generate') 
                      || 'http://localhost:11434/api/generate';
    const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3';

    console.log(`Generating LLM response using ${OLLAMA_CHAT_MODEL}...`);

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CHAT_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const llmResponse = data.response;

    console.log('LLM response generated successfully');
    return llmResponse;

  } catch (err) {
    console.error('LLM response generation error:', err);
    console.log('Falling back to template-based response');
    return generateResponse(query, vectorResults);
  }
}

// Main LLM response function - tries OpenAI first, then Ollama
export async function generateLLMResponse(
  query: string, 
  vectorResults: SearchResult,
  provider: 'openai' | 'ollama' = 'openai'
): Promise<string> {
  if (provider === 'openai') {
    return generateLLMResponseOpenAI(query, vectorResults);
  } else {
    return generateLLMResponseOllama(query, vectorResults);
  }
}
