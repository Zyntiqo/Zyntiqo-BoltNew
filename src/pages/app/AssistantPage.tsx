import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';
import { callAI, isAIConfigured } from '@/lib/services/ai';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isAI?: boolean;
};

const suggestions = [
  'Show me leads that need follow-up',
  'Suggest a campaign for my new product',
  'Summarize my business performance',
  'Suggest an automation for new leads',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiConfigured = isAIConfigured();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await callAI({
        task: 'recommend',
        context: { question: text },
        prompt: text,
      });

      if (result.ok) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: result.content }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.reason === 'not_configured'
              ? 'AI is not connected yet. Add an API key in Settings to enable AI-powered responses. In the meantime, you can use the CRM, Pipeline, and Automations modules manually.'
              : `I couldn't process that right now: ${result.message}`,
            isAI: result.reason === 'not_configured',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <Sparkles className="h-6 w-6 text-accent-400" />
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Ask about your business, get recommendations, or explore ideas for campaigns and automations.
        </p>
      </div>

      {!aiConfigured && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <Bot className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200">
            AI is not connected. Your messages will receive an honest "not configured" response
            until you add an API key in Settings.
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-white/5 bg-ink-900/40 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20">
              <Sparkles className="h-7 w-7 text-accent-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-white">How can I help you today?</p>
            <p className="mt-1 text-xs text-ink-500">Try one of these:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-ink-300 transition-colors hover:border-brand-400/30 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                <Bot className="h-4 w-4 text-ink-950" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-brand-500/15 text-white'
                  : m.isAI
                    ? 'bg-amber-500/10 text-amber-200'
                    : 'bg-ink-950/60 text-ink-200'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <User className="h-4 w-4 text-ink-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
              <Bot className="h-4 w-4 text-ink-950" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-ink-950/60 px-4 py-2.5 text-sm text-ink-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI anything about your business..."
          className="flex-1 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
