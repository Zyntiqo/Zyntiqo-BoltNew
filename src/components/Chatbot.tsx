import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Bot,
  User as UserIcon,
  FileText,
  Calendar,
  MessageCircle,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { callAI, isAIConfigured } from '@/lib/services/ai';
import { generateImage, isImageGenConfigured } from '@/lib/services/ai';
import { matchKnowledge, detectService, chatbotWelcomeMessage, chatbotNotConfiguredMessage } from '@/lib/services/knowledge';
import { buildWhatsAppUrl, whatsappMessageFor } from '@/lib/services/whatsapp';
import { siteConfig } from '@/lib/config';
import { track } from '@/lib/services/analytics';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: { label: string; type: 'consultation' | 'quote' | 'whatsapp' | 'contact'; service?: string };
  image?: string;
  imageLoading?: boolean;
  imageError?: string;
};

const STORAGE_KEY = 'zyntiqo-chatbot-session';

const quickActions = [
  { label: 'Explore Services', icon: Sparkles, type: 'explore' as const },
  { label: 'Request a Quote', icon: FileText, type: 'quote' as const },
  { label: 'Book Consultation', icon: Calendar, type: 'consultation' as const },
  { label: 'Talk on WhatsApp', icon: MessageCircle, type: 'whatsapp' as const },
];

export default function Chatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiConfigured = isAIConfigured();
  const imageGenConfigured = isImageGenConfigured();

  // Load session from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    // Initialize with welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: aiConfigured ? chatbotWelcomeMessage : chatbotNotConfiguredMessage,
    }]);
  }, [aiConfigured]);

  // Save to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    track('consultation_started', { source: 'chatbot', message: text });

    // Check if user wants image generation
    const wantsImage = /generate.*image|visual.*concept|image.*concept|create.*image|show.*image|picture|design.*concept/i.test(text);

    if (wantsImage && imageGenConfigured) {
      // Generate image
      const imgResult = await generateImage(text);
      if (imgResult.ok) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Here's a visual concept based on your request:",
          image: imgResult.imageUrl,
        }]);
        setLoading(false);
        return;
      } else if (imgResult.reason === 'not_configured') {
        // Fall through to text response
      } else {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I couldn't generate that image right now: ${imgResult.message}`,
        }]);
        setLoading(false);
        return;
      }
    }

    // Try real AI first
    if (aiConfigured) {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await callAI({
        task: 'chat',
        context: { source: 'website_chatbot' },
        prompt: text,
        history,
      });

      if (result.ok) {
        const detectedService = detectService(text);
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.content,
          action: detectedService ? { label: `Book ${detectedService} Consultation`, type: 'consultation', service: detectedService } : undefined,
        }]);
        setLoading(false);
        return;
      }
    }

    // Fallback: use knowledge base
    const match = matchKnowledge(text);
    const detectedService = detectService(text);

    if (match) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: match.response,
        action: match.recommendAction
          ? {
              label: match.recommendAction === 'consultation' ? 'Book a Consultation'
                : match.recommendAction === 'quote' ? 'Request a Quote'
                : match.recommendAction === 'whatsapp' ? 'Continue on WhatsApp'
                : 'Get Started',
              type: match.recommendAction,
              service: match.recommendService ?? detectedService,
            }
          : undefined,
      }]);
    } else {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'd love to help with that. Could you tell me a bit more about what you're looking for? You can ask about our services (Website Development, E-commerce, Digital Marketing, AI Agents, Business Automation, Branding, or Custom Software), or I can connect you with our team.",
        action: { label: 'Get Started', type: 'contact' },
      }]);
    }
    setLoading(false);
  }, [loading, messages, aiConfigured, imageGenConfigured]);

  const handleQuickAction = (type: string) => {
    switch (type) {
      case 'explore':
        handleSend("What services do you provide?");
        break;
      case 'quote':
        navigate('/request-quote');
        setOpen(false);
        break;
      case 'consultation':
        navigate('/book-consultation');
        setOpen(false);
        break;
      case 'whatsapp':
        if (siteConfig.whatsappEnabled) {
          window.open(buildWhatsAppUrl(whatsappMessageFor()), '_blank');
        }
        break;
    }
  };

  const handleAction = (action: NonNullable<Message['action']>) => {
    switch (action.type) {
      case 'consultation': {
        const params = action.service ? `?service=${encodeURIComponent(action.service.toLowerCase().replace(/\s+/g, '-'))}` : '';
        navigate(`/book-consultation${params}`);
        setOpen(false);
        break;
      }
      case 'quote': {
        const params = action.service ? `?service=${encodeURIComponent(action.service.toLowerCase().replace(/\s+/g, '-'))}` : '';
        navigate(`/request-quote${params}`);
        setOpen(false);
        break;
      }
      case 'whatsapp':
        if (siteConfig.whatsappEnabled) {
          window.open(buildWhatsAppUrl(whatsappMessageFor(action.service)), '_blank');
        }
        break;
      case 'contact':
        navigate('/contact');
        setOpen(false);
        break;
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: aiConfigured ? chatbotWelcomeMessage : chatbotNotConfiguredMessage,
    }]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <>
      {/* Launcher button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
          aria-label="Open Zyntiqo AI chat"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[9px] font-bold text-ink-950">AI</span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:inset-auto sm:bottom-6 sm:right-6">
          {/* Mobile backdrop */}
          <div className="absolute inset-0 bg-black/40 sm:hidden" onClick={() => setOpen(false)} />

          <div className="relative flex h-[100dvh] w-full flex-col bg-ink-950 sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
                  <Bot className="h-5 w-5 text-ink-950" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Zyntiqo AI</p>
                  <p className="flex items-center gap-1 text-[10px] text-ink-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${aiConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {aiConfigured ? 'Online' : 'Limited mode'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-white"
                  aria-label="Clear conversation"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                      <Bot className="h-3.5 w-3.5 text-ink-950" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${m.role === 'user' ? '' : 'min-w-0'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-brand-500/15 text-white'
                          : 'bg-ink-900/60 text-ink-200'
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Image */}
                    {m.image && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                        <img src={m.image} alt="AI generated visual concept" className="w-full" />
                      </div>
                    )}
                    {m.imageError && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {m.imageError}
                      </div>
                    )}

                    {/* Action button */}
                    {m.action && (
                      <button
                        onClick={() => handleAction(m.action!)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500/15 to-accent-500/15 px-3.5 py-1.5 text-xs font-medium text-brand-300 transition-all hover:from-brand-500/25 hover:to-accent-500/25 hover:text-white"
                      >
                        {m.action.label}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <UserIcon className="h-3.5 w-3.5 text-ink-300" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                    <Bot className="h-3.5 w-3.5 text-ink-950" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-ink-900/60 px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {quickActions.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.label}
                      onClick={() => handleQuickAction(qa.type)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-brand-400/30 hover:text-white"
                    >
                      <Icon className="h-3 w-3" />
                      {qa.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-white/5 p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Zyntiqo AI..."
                  className="flex-1 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:border-brand-400/40 focus:outline-none"
                  aria-label="Chat message input"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-ink-950 transition-all hover:-translate-y-0.5 disabled:opacity-40"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              {!aiConfigured && (
                <p className="mt-1.5 px-1 text-[10px] text-ink-500">
                  Running in limited mode. Connect an AI provider for full responses.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
