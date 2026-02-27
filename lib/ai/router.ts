import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIResult, AIProvider } from '@/types';

// Maliyet tablosu: [inputCostPerToken, outputCostPerToken]
const COST_TABLE: Record<string, [number, number]> = {
    'gpt-4o': [0.0000025, 0.0000100],
    'gpt-4o-mini': [0.00000015, 0.0000006],
    'claude-3-5-sonnet-20241022': [0.000003, 0.000015],
    'claude-3-5-sonnet': [0.000003, 0.000015],
    'gemini-1.5-pro': [0.00000125, 0.000005],
    'gemini-1.5-flash': [0.000000075, 0.0000003],
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = COST_TABLE[model] ?? [0.000003, 0.000015];
    return inputTokens * costs[0] + outputTokens * costs[1];
}

export async function runAI(
    provider: AIProvider,
    model: string,
    apiKey: string,
    prompt: string,
    abortSignal?: AbortSignal

): Promise<AIResult> {
    const startTime = Date.now();

    try {
        let result;

        if (provider === 'openai') {
            const openaiClient = createOpenAI({ apiKey });
            result = await generateText({ model: openaiClient(model), prompt, abortSignal });
        } else if (provider === 'anthropic') {
            const anthropicClient = createAnthropic({ apiKey });
            result = await generateText({ model: anthropicClient(model), prompt, abortSignal });
        } else if (provider === 'google') {
            const googleClient = createGoogleGenerativeAI({ apiKey });
            result = await generateText({ model: googleClient(model), prompt, abortSignal });
        } else {
            throw new Error(`Desteklenmeyen AI provider: ${provider}`);
        }

        const durationMs = Date.now() - startTime;
        const inputTokens = (result.usage as unknown as { promptTokens?: number })?.promptTokens ?? 0;
        const outputTokens = (result.usage as unknown as { completionTokens?: number })?.completionTokens ?? 0;
        const costUsd = calculateCost(model, inputTokens, outputTokens);

        return {
            content: result.text,
            inputTokens,
            outputTokens,
            costUsd,
            durationMs,
        };
    } catch (error) {
        const durationMs = Date.now() - startTime;
        throw Object.assign(
            new Error(error instanceof Error ? error.message : 'AI çağrısı başarısız'),
            { durationMs }
        );
    }
}
