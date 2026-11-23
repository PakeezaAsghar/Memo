import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  MessageSquarePlus,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import type { AIChatThread, AIMessage } from '../types/workspace';

const SUGGESTED_PROMPTS = [
  'Summarize my authorized notes and highlight key action items.',
  'Create a prioritized task list from my upcoming deadlines.',
  'Generate 5 study quiz questions from my authorized Study Hub.',
  'Organize these rough thoughts into a structured outline:',
];

export function AIAssistantPage() {
  const { user, workspace, addItem, updateItem, deleteItem, updateProfile, notify } =
    useWorkspace();
  const threads = workspace?.aiThreads || [];
  const prefs = user?.preferences;

  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || '');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentText, setAttachmentText] = useState('');
  const attachRef = useRef<HTMLInputElement>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0] || null,
    [threads, activeThreadId]
  );

  const authorizedScopes = useMemo(() => {
    const out: string[] = [];
    if (prefs?.aiAllowNotes) out.push('notes');
    if (prefs?.aiAllowDocuments) out.push('documents');
    if (prefs?.aiAllowTasks) out.push('tasks');
    if (prefs?.aiAllowJournal) out.push('journal');
    if (prefs?.aiAllowStudy) out.push('study');
    return out;
  }, [prefs]);

  const toggleScope = async (
    key: 'aiAllowNotes' | 'aiAllowDocuments' | 'aiAllowTasks' | 'aiAllowJournal' | 'aiAllowStudy',
    current: boolean
  ) => {
    await updateProfile({ preferences: { [key]: !current } });
  };

  const createNewChat = async () => {
    const now = new Date().toISOString();
    const created = await addItem('aiThreads', {
      title: 'New Conversation',
      messages: [
        {
          id: `aim-${Date.now()}`,
          role: 'assistant',
          text: 'Ready when you are. I will only reference the workspace sections you have authorized above.',
          timestamp: now,
        },
      ],
      updatedAt: now,
    });
    setActiveThreadId(created.id);
    setApiError(null);
  };

  const handleAttachFile = async (file: File) => {
    try {
      const up = await api.uploadFile(file);
      const text = up.extractedText || (await file.text().catch(() => ''));
      setAttachmentName(file.name);
      setAttachmentText(text.slice(0, 8000));
      notify(`Attached "${file.name}" for this prompt`);
    } catch {
      notify('Could not read attachment', 'error');
    }
  };

  const sendMessage = async (promptOverride?: string) => {
    const text = (promptOverride ?? input).trim();
    if (!text || sending) return;
    setApiError(null);
    setSending(true);

    let thread: AIChatThread | null = activeThread;
    if (!thread) {
      const created = await addItem('aiThreads', {
        title: text.slice(0, 36),
        messages: [],
        updatedAt: new Date().toISOString(),
      });
      thread = created;
      setActiveThreadId(created.id);
    }

    const userMsg: AIMessage = {
      id: `aim-u-${Date.now()}`,
      role: 'user',
      text: attachmentName ? `${text}\n\n[Attached: ${attachmentName}]` : text,
      authorizedScopes,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...thread.messages, userMsg];
    await updateItem('aiThreads', thread.id, {
      title: thread.messages.length <= 1 ? text.slice(0, 42) : thread.title,
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    });
    if (!promptOverride) setInput('');

    try {
      const res = await api.aiChat({
        message: text,
        history: thread.messages.map((m) => ({ role: m.role, text: m.text })),
        authorizedScopes,
        attachmentText,
        attachmentName,
      });

      const aiMsg: AIMessage = {
        id: `aim-a-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        authorizedScopes,
        timestamp: new Date().toISOString(),
      };
      await updateItem('aiThreads', thread.id, {
        messages: [...nextMessages, aiMsg],
        updatedAt: new Date().toISOString(),
      });
      setAttachmentName('');
      setAttachmentText('');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unable to reach AI service.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Abstract minimal assistant mark */}
          <div className="w-10 h-10 rounded-[11px] bg-[var(--sage-soft)] border border-[var(--sage)]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[var(--sage-dark)]" />
          </div>
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">AI Assistant</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Private workspace companion · Only reads sections you explicitly authorize.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={createNewChat}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Explicit Authorization Bar */}
      <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-main)]">
          <ShieldCheck className="w-4 h-4 text-[var(--sage-dark)]" />
          <span>Authorized Workspace Access:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['aiAllowNotes', 'Notes', prefs?.aiAllowNotes ?? true],
              ['aiAllowDocuments', 'Documents', prefs?.aiAllowDocuments ?? true],
              ['aiAllowTasks', 'Tasks', prefs?.aiAllowTasks ?? true],
              ['aiAllowJournal', 'Journal', prefs?.aiAllowJournal ?? false],
              ['aiAllowStudy', 'Study Hub', prefs?.aiAllowStudy ?? true],
            ] as const
          ).map(([key, label, active]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleScope(key, active)}
              className={`px-2.5 py-1 rounded-[7px] text-[12px] font-medium border transition-colors ${
                active
                  ? 'bg-[var(--sage-soft)] border-[var(--sage)]/40 text-[var(--sage-dark)]'
                  : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
              }`}
            >
              {active ? '✓ ' : ''}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Conversation history */}
        <aside className="lg:col-span-3 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-3 space-y-1.5">
          <p className="px-2 py-1 text-[11px] font-semibold tracking-wider text-[var(--text-muted)]">
            HISTORY
          </p>
          {threads.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              className={`cursor-pointer px-2.5 py-2 rounded-[8px] flex items-center justify-between gap-2 text-[13px] ${
                activeThread?.id === t.id
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                  : 'hover:bg-[var(--bg-secondary)] text-[var(--text-main)]'
              }`}
            >
              <span className="truncate">{t.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem('aiThreads', t.id);
                }}
                className="p-0.5 text-[var(--text-muted)] hover:text-[var(--error)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </aside>

        {/* Chat workspace */}
        <section className="lg:col-span-9 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col min-h-[520px]">
          <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[480px]">
            {activeThread?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-[12px] px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[var(--sage)] text-white'
                      : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <p className="text-[11px] font-semibold text-[var(--sage-dark)] mb-1">
                      AI-generated response · Grounded in authorized items only
                    </p>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}

            {sending && (
              <div className="text-[12.5px] text-[var(--text-muted)] italic">
                Thinking through your authorized workspace…
              </div>
            )}

            {apiError && (
              <div className="p-3.5 rounded-[10px] bg-[var(--blush)]/45 border border-[var(--error)]/35 text-[13px] text-[var(--text-main)] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[var(--error)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">AI Assistant Notice</p>
                  <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">{apiError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Suggested prompts */}
          <div className="px-4 py-2.5 border-t border-[var(--border-color)] flex flex-wrap gap-1.5 bg-[var(--bg-main)]/55">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(p)}
                className="px-2.5 py-1 rounded-[7px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--sage)] text-[11.5px] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3.5 border-t border-[var(--border-color)] space-y-2"
          >
            {attachmentName && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-[var(--sage-soft)] text-[12px] text-[var(--sage-dark)]">
                <span>Attached: {attachmentName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName('');
                    setAttachmentText('');
                  }}
                  className="hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => attachRef.current?.click()}
                title="Attach document or text file to summarize"
                className="w-10 h-10 rounded-[9px] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={attachRef}
                type="file"
                accept=".txt,.md,.csv,.json,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAttachFile(f);
                  e.target.value = '';
                }}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your notes, summarize a file, or generate study questions…"
                className="flex-1 h-[40px] px-3.5 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13.5px] focus:outline-none focus:border-[var(--sage)]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-[40px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
