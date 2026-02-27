export type Plan = 'free' | 'starter' | 'agency';
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed';
export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  created_at: string;
}

export interface AITool {
  id: string;
  workspace_id: string;
  name: AIProvider;
  display_name: string;
  api_key_encrypted?: string;
  model: string;
  is_active: boolean;
  created_at: string;
}

export interface Prompt {
  id: string;
  workspace_id: string;
  name: string;
  content: string;
  version: number;
  parent_id: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  tool_id: string | null;
  prompt_id: string | null;
  custom_prompt: string | null;
  status: TaskStatus;
  created_by: string;
  created_at: string;
  // Joined fields
  ai_tools?: Pick<AITool, 'id' | 'name' | 'display_name' | 'model'>;
  prompts?: Pick<Prompt, 'id' | 'name' | 'content'>;
  outputs?: Output[];
}

export interface Output {
  id: string;
  task_id: string;
  workspace_id: string;
  content: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model_used: string | null;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

export interface AIResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
}

export interface CostSummary {
  totalCostUsd: number;
  byTool: { toolName: string; costUsd: number; taskCount: number }[];
  byDay: { date: string; costUsd: number }[];
}
