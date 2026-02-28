import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;

    const requestData = rateLimitMap.get(ip);
    if (requestData) {
        if (now - requestData.timestamp < windowMs) {
            if (requestData.count >= maxRequests) {
                return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
            }
            requestData.count++;
        } else {
            rateLimitMap.set(ip, { count: 1, timestamp: now });
        }
    } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    try {
        const body = await request.json();
        const { provider, model, apiKey } = body;

        if (!provider || !model || !apiKey) {
            return NextResponse.json({ success: false, error: 'Eksik parametre' }, { status: 400 });
        }

        let aiModel;

        if (provider === 'openai') {
            const client = createOpenAI({ apiKey });
            aiModel = client(model);
        } else if (provider === 'anthropic') {
            const client = createAnthropic({ apiKey });
            aiModel = client(model);
        } else if (provider === 'google') {
            const client = createGoogleGenerativeAI({ apiKey });
            aiModel = client(model);
        } else {
            return NextResponse.json({ success: false, error: 'Geçersiz provider' }, { status: 400 });
        }

        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 15000);

        await generateText({
            model: aiModel,
            prompt: 'Reply with only the word: OK',
            abortSignal: ac.signal
        });

        clearTimeout(timeout);

        return NextResponse.json({ success: true, message: 'Bağlantı başarılı' });
    } catch (err: unknown) {
        console.error('Test error:', err);
        if (err instanceof Error) {
            return NextResponse.json({ success: false, error: err.message || 'Bağlantı başarısız' }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Bilinmeyen bağlantı hatası' }, { status: 500 });
    }
}
