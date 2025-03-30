import { LLMConfig } from '../llm/llm-client';

export const llmConfig: LLMConfig = {
  apiEndpoint: process.env.LLM_API_ENDPOINT || 'http://localhost:8000',
  apiKey: process.env.LLM_API_KEY || 'your-api-key',
  modelName: process.env.LLM_MODEL_NAME || 'gpt-3.5-turbo',
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7')
}; 