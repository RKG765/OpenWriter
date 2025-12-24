// AI Client for Groq/OpenAI-compatible APIs
// Provider-agnostic client that works with any OpenAI-compatible endpoint

export interface AIAction {
    type: 'rewrite' | 'summarize' | 'continue';
    selectedText: string;
    documentContext?: string;
}

export interface AIResponse {
    success: boolean;
    content?: string;
    error?: string;
}

interface AIConfig {
    apiKey: string;
    apiEndpoint: string;
    model: string;
}

// Default to Groq API
const DEFAULT_CONFIG: AIConfig = {
    apiKey: '',
    apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-70b-versatile',
};

// Get config from localStorage or use defaults
function getConfig(): AIConfig {
    try {
        const saved = localStorage.getItem('openwriter_ai_config');
        if (saved) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load AI config:', e);
    }
    return DEFAULT_CONFIG;
}

// Save config to localStorage
export function saveAIConfig(config: Partial<AIConfig>): void {
    try {
        const current = getConfig();
        const updated = { ...current, ...config };
        localStorage.setItem('openwriter_ai_config', JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save AI config:', e);
    }
}

// Check if AI is configured
export function isAIConfigured(): boolean {
    const config = getConfig();
    return !!config.apiKey && config.apiKey.length > 10;
}

// Build prompt based on action type
function buildPrompt(action: AIAction): string {
    const { type, selectedText, documentContext } = action;

    let systemPrompt = 'You are a helpful writing assistant. Respond only with the requested text, no explanations or preamble.';
    let userPrompt = '';

    switch (type) {
        case 'rewrite':
            userPrompt = `Rewrite the following text to be clearer and more professional. Keep the same meaning but improve the style and flow:\n\n"${selectedText}"`;
            break;
        case 'summarize':
            userPrompt = `Summarize the following text in a concise paragraph:\n\n"${selectedText}"`;
            break;
        case 'continue':
            userPrompt = documentContext
                ? `Continue writing naturally from where this text ends. Here's the context:\n\n${documentContext}\n\nContinue from: "${selectedText}"`
                : `Continue writing naturally from where this text ends:\n\n"${selectedText}"`;
            break;
    }

    return JSON.stringify({
        system: systemPrompt,
        user: userPrompt,
    });
}

// Make API request to AI provider
export async function callAI(action: AIAction): Promise<AIResponse> {
    const config = getConfig();

    if (!config.apiKey) {
        return {
            success: false,
            error: 'API key not configured. Click the settings icon to add your Groq API key.',
        };
    }

    try {
        const prompts = JSON.parse(buildPrompt(action));

        const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: prompts.system },
                    { role: 'user', content: prompts.user },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `API error: ${response.status}`;
            return {
                success: false,
                error: errorMessage,
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                error: 'Empty response from AI',
            };
        }

        return {
            success: true,
            content: content.trim(),
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        // Check for network errors
        if (message.includes('fetch') || message.includes('network')) {
            return {
                success: false,
                error: 'Network error. Are you offline?',
            };
        }

        return {
            success: false,
            error: `AI request failed: ${message}`,
        };
    }
}

// Get current API key (masked for display)
export function getMaskedApiKey(): string {
    const config = getConfig();
    if (!config.apiKey) return '';
    if (config.apiKey.length <= 8) return '****';
    return config.apiKey.substring(0, 4) + '****' + config.apiKey.substring(config.apiKey.length - 4);
}
