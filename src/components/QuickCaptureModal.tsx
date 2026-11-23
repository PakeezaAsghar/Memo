import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../lib/api';
import { useWorkspace } from '../context/WorkspaceContext';
import type { QuickCaptureKind } from '../context/WorkspaceContext';
import { Modal } from './ui/Modal';

const LABELS: Record<QuickCaptureKind, string> = {
  note: 'Quick Note',
  task: 'New Task',
  link: 'Save a Link',
  idea: 'New Idea',
  journal: 'Journal Entry',
  document: 'Upload Document',
  event: 'New Calendar Event',
  media: 'Save Music or Movie',
};

export function QuickCaptureModal() {
  const { quickCaptureOpen, openQuickCapture, closeQuickCapture, addItem, notify } =
    useWorkspace();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [url, setUrl] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [mood, setMood] = useState<'calm' | 'happy' | 'productive' | 'tired' | 'sad' | 'stressed'>('calm');
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'music' | 'movie'>('music');
  const [creator, setCreator] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quickCaptureOpen) return;
    setTitle('');
    setBody('');
    setUrl('');
    setCreator('');
    setFile(null);
    setDueDate(new Date().toISOString().slice(0, 10));
    setCategory(
      quickCaptureOpen === 'link'
        ? 'Tools'
        : quickCaptureOpen === 'media'
        ? 'Indie'
        : 'Personal'
    );
  }, [quickCaptureOpen]);

  if (!quickCaptureOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const today = nowIso.slice(0, 10);

      if (quickCaptureOpen === 'note') {
        const plain = body.trim();
        await addItem('notes', {
          title: title.trim() || 'Untitled Note',
          contentHtml: `<p>${plain.replace(/\n/g, '</p><p>')}</p>`,
          plainText: plain,
          category,
          isPinned: false,
          isFavorite: false,
          isArchived: false,
          wordCount: plain ? plain.split(/\s+/).length : 0,
          attachments: [],
          updatedAt: nowIso,
          createdAt: nowIso,
        });
        notify('Note saved to your notebook');
      } else if (quickCaptureOpen === 'task') {
        await addItem('tasks', {
          title: title.trim(),
          description: body.trim(),
          category,
          priority,
          dueDate,
          completed: false,
          recurring: 'none',
          subtasks: [],
          order: 0,
          createdAt: nowIso,
        });
        notify('Task added');
      } else if (quickCaptureOpen === 'link') {
        const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
        let domain = cleanUrl;
        try {
          domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
        } catch {
          // fallback
        }
        await addItem('bookmarks', {
          title: title.trim() || domain,
          url: cleanUrl,
          domain,
          description: body.trim(),
          category,
          faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          isFavorite: false,
          createdAt: nowIso,
        });
        notify('Bookmark saved');
      } else if (quickCaptureOpen === 'idea') {
        await addItem('ideas', {
          title: title.trim(),
          description: body.trim(),
          category,
          status: 'New',
          referenceUrl: url.trim() || undefined,
          isFavorite: false,
          createdAt: today,
        });
        notify('Idea added to Idea Bank');
      } else if (quickCaptureOpen === 'journal') {
        const plain = body.trim();
        await addItem('journal', {
          title: title.trim() || 'Quiet Reflection',
          contentHtml: `<p>${plain.replace(/\n/g, '</p><p>')}</p>`,
          plainText: plain,
          mood,
          category: 'Reflection',
          tags: [],
          isDraft: false,
          entryDate: today,
          createdAt: nowIso,
        });
        notify('Journal entry published privately');
      } else if (quickCaptureOpen === 'event') {
        await addItem('events', {
          title: title.trim(),
          date: dueDate,
          startTime,
          endTime: `${String(Math.min(23, Number(startTime.slice(0, 2)) + 1)).padStart(2, '0')}:${startTime.slice(3)}`,
          category: 'personal',
          description: body.trim(),
        });
        notify('Event scheduled');
      } else if (quickCaptureOpen === 'document') {
        if (!file) {
          notify('Please select a file to upload', 'error');
          setSaving(false);
          return;
        }
        const uploaded = await api.uploadFile(file);
        await addItem('documents', {
          name: title.trim() || uploaded.name,
          mimeType: uploaded.mimeType,
          size: uploaded.size,
          folder: category,
          url: uploaded.url,
          extractedText: uploaded.extractedText,
          shareToken: null,
          isFavorite: false,
          isTrashed: false,
          uploadedAt: nowIso,
        });
        notify('Document uploaded');
      } else if (quickCaptureOpen === 'media') {
        const rawUrl = url.trim();
        const normalizedUrl = rawUrl
          ? /^https?:\/\//i.test(rawUrl)
            ? rawUrl
            : `https://${rawUrl}`
          : undefined;
        await addItem('media', {
          mediaType,
          title: title.trim(),
          creator: creator.trim() || (mediaType === 'music' ? 'Unknown Artist' : 'Unknown Director'),
          genre: category,
          status: 'Queue',
          rating: 0,
          url: normalizedUrl,
          isFavorite: false,
          notes: body.trim(),
          updatedAt: today,
        });
        notify(mediaType === 'music' ? 'Music saved' : 'Movie saved');
      }

      closeQuickCapture();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(quickCaptureOpen)}
      onClose={closeQuickCapture}
      title={LABELS[quickCaptureOpen]}
      subtitle="Save quickly without leaving your current page"
    >
      <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-[var(--border-color)]">
        {(['note', 'task', 'link', 'idea', 'journal', 'document', 'event', 'media'] as QuickCaptureKind[]).map(
          (k) => (
            <button
              key={k}
              type="button"
              onClick={() => openQuickCapture(k)}
              className={`px-2.5 py-1 rounded-[7px] text-[12px] font-medium transition-colors capitalize whitespace-nowrap ${
                quickCaptureOpen === k
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {k === 'media' ? 'Music / Movie' : k}
            </button>
          )
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {quickCaptureOpen !== 'document' && (
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${quickCaptureOpen} title…`}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>
        )}

        {(quickCaptureOpen === 'link' || quickCaptureOpen === 'idea' || quickCaptureOpen === 'media') && (
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              {quickCaptureOpen === 'link'
                ? 'Website URL'
                : quickCaptureOpen === 'media'
                ? 'Stream or reference link (optional)'
                : 'Reference link (optional)'}
            </label>
            <input
              type={quickCaptureOpen === 'link' ? 'url' : 'text'}
              required={quickCaptureOpen === 'link'}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>
        )}

        {quickCaptureOpen === 'media' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'music' | 'movie')}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              >
                <option value="music">Music / Album</option>
                <option value="movie">Movie / Series</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                {mediaType === 'music' ? 'Artist or band' : 'Director or creator'}
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder={mediaType === 'music' ? 'e.g., Radiohead' : 'e.g., Celine Song'}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              />
            </div>
          </div>
        )}

        {quickCaptureOpen === 'document' && (
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Choose file
            </label>
            <label className="flex flex-col items-center justify-center p-5 rounded-[10px] border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/45 cursor-pointer hover:border-[var(--sage)] transition-colors">
              <Upload className="w-5 h-5 text-[var(--sage-dark)] mb-1.5" />
              <span className="text-[13px] font-medium text-[var(--text-main)]">
                {file ? file.name : 'Select PDF, DOCX, XLSX, PPTX, or image'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              {quickCaptureOpen === 'document' ? 'Folder' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            >
              {quickCaptureOpen === 'document' ? (
                <>
                  <option value="Study Material">Study Material</option>
                  <option value="Projects">Projects</option>
                  <option value="Personal">Personal</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Work">Work</option>
                  <option value="Images">Images</option>
                  <option value="Other">Other</option>
                </>
              ) : quickCaptureOpen === 'link' ? (
                <>
                  <option value="Learning">Learning</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Tools">Tools</option>
                  <option value="Research">Research</option>
                  <option value="Personal">Personal</option>
                </>
              ) : quickCaptureOpen === 'media' ? (
                <>
                  <option value="Indie">Indie</option>
                  <option value="Ambient / Focus">Ambient / Focus</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Drama">Drama</option>
                  <option value="Cinema">Cinema</option>
                  <option value="Animation">Animation</option>
                  <option value="Documentary">Documentary</option>
                </>
              ) : (
                <>
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                  <option value="Ideas">Ideas</option>
                  <option value="Projects">Projects</option>
                  <option value="Work">Work</option>
                  <option value="Important">Important</option>
                </>
              )}
            </select>
          </div>

          {quickCaptureOpen === 'task' && (
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}

          {(quickCaptureOpen === 'task' || quickCaptureOpen === 'event') && (
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              />
            </div>
          )}

          {quickCaptureOpen === 'event' && (
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              />
            </div>
          )}

          {quickCaptureOpen === 'journal' && (
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as typeof mood)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              >
                <option value="calm">Calm</option>
                <option value="happy">Happy</option>
                <option value="productive">Productive</option>
                <option value="tired">Tired</option>
                <option value="sad">Sad</option>
                <option value="stressed">Stressed</option>
              </select>
            </div>
          )}
        </div>

        {quickCaptureOpen !== 'document' && (
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              {quickCaptureOpen === 'journal' ? 'Reflection' : 'Details / notes'}
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a few thoughts…"
              className="w-full p-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={closeQuickCapture}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] font-semibold text-[var(--text-main)] hover:bg-[var(--bg-secondary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
