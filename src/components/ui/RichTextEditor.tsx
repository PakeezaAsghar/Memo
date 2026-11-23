import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Undo2,
  Redo2,
} from 'lucide-react';
import { api, withFileAuth } from '../../lib/api';

interface RichTextEditorProps {
  valueHtml: string;
  onChange: (html: string, plainText: string, wordCount: number) => void;
  onError?: (message: string) => void;
  placeholder?: string;
  minHeightClass?: string;
}

interface ToolBtnProps {
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolBtn({ onClick, label, active = false, disabled = false, children }: ToolBtnProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Keep contentEditable focused & selection intact when clicking toolbar controls
        e.preventDefault();
      }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`w-8 h-8 rounded-[7px] flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 ${
        active
          ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]'
      }`}
    >
      {children}
    </button>
  );
}

export function extractPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  const clean = text.trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function RichTextEditor({
  valueHtml,
  onChange,
  onError,
  placeholder = 'Start writing…',
  minHeightClass = 'min-h-[260px]',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const lastPropHtml = useRef<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
    highlight: false,
  });

  // Sync incoming valueHtml on mount and when externally changed
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const isInitial = lastPropHtml.current === null;
    if (isInitial || (valueHtml !== lastPropHtml.current && document.activeElement !== el)) {
      if (el.innerHTML !== (valueHtml || '')) {
        el.innerHTML = valueHtml || '';
      }
    }
    lastPropHtml.current = valueHtml;
  }, [valueHtml]);

  const saveSelection = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current && el.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else if (sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, []);

  const refreshActiveFormats = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    if (!el.contains(sel.anchorNode)) return;
    try {
      const back = String(document.queryCommandValue('hiliteColor') || '').toLowerCase();
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
        highlight: back !== '' && back !== 'transparent' && back !== 'rgba(0, 0, 0, 0)',
      });
    } catch {
      // ignore unsupported queryCommandState checks
    }
  }, []);

  useEffect(() => {
    const onSelectionChange = () => {
      saveSelection();
      refreshActiveFormats();
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [saveSelection, refreshActiveFormats]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastPropHtml.current = html;
    const plain = extractPlainText(html);
    onChange(html, plain, countWords(plain));
  }, [onChange]);

  const exec = (cmd: string, val?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    saveSelection();
    refreshActiveFormats();
    emitChange();
  };

  const toggleHighlight = () => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.getRangeAt(0).collapsed) {
      // If nothing is selected, toggle typing inside a <mark> or insert highlighted placeholder
      const mark = document.createElement('mark');
      mark.textContent = 'highlighted text';
      const range = sel.getRangeAt(0);
      range.insertNode(mark);
      const nextRange = document.createRange();
      nextRange.selectNodeContents(mark);
      sel.removeAllRanges();
      sel.addRange(nextRange);
    } else {
      const current = String(document.queryCommandValue('hiliteColor') || '').toLowerCase();
      const isAlreadyHighlighted =
        current !== '' && current !== 'transparent' && current !== 'rgba(0, 0, 0, 0)';
      document.execCommand('hiliteColor', false, isAlreadyHighlighted ? 'transparent' : '#F3E8C9');
    }
    saveSelection();
    refreshActiveFormats();
    emitChange();
  };

  const insertChecklist = () => {
    restoreSelection();
    const html = `<div class="flex items-center gap-2 my-1"><input type="checkbox" class="accent-[var(--sage)]" /> <span>Checklist item</span></div>`;
    document.execCommand('insertHTML', false, html);
    saveSelection();
    emitChange();
  };

  const openLinkBar = () => {
    saveSelection();
    setLinkModalOpen((prev) => {
      const next = !prev;
      if (next) {
        window.setTimeout(() => linkInputRef.current?.focus(), 0);
      }
      return next;
    });
  };

  const applyLink = () => {
    const raw = linkUrl.trim();
    if (!raw) {
      setLinkModalOpen(false);
      return;
    }
    const cleanUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
      document.execCommand('createLink', false, cleanUrl);
      const anchors = editorRef.current?.querySelectorAll(`a[href="${cleanUrl}"]`);
      anchors?.forEach((a) => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });
    } else {
      const safeHref = escapeHtml(cleanUrl);
      const html = `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeHref}</a>&nbsp;`;
      document.execCommand('insertHTML', false, html);
    }
    setLinkUrl('');
    setLinkModalOpen(false);
    saveSelection();
    emitChange();
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const uploaded = await api.uploadFile(file);
      const src = escapeHtml(withFileAuth(uploaded.url));
      const alt = escapeHtml(uploaded.name || 'Note image');
      restoreSelection();
      const inserted = document.execCommand(
        'insertHTML',
        false,
        `<img src="${src}" alt="${alt}" class="max-w-full rounded-lg my-2 border border-[var(--border-color)]" />`
      );
      if (!inserted && editorRef.current) {
        const img = document.createElement('img');
        img.src = withFileAuth(uploaded.url);
        img.alt = uploaded.name || 'Note image';
        img.className = 'max-w-full rounded-lg my-2 border border-[var(--border-color)]';
        editorRef.current.appendChild(img);
      }
      saveSelection();
      emitChange();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/55">
        <ToolBtn onClick={() => exec('bold')} label="Bold" active={activeFormats.bold}>
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('italic')} label="Italic" active={activeFormats.italic}>
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => exec('underline')}
          label="Underline"
          active={activeFormats.underline}
        >
          <Underline className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('formatBlock', '<h2>')} label="Heading">
          <Heading2 className="w-4 h-4" />
        </ToolBtn>
        <span className="w-px h-4 bg-[var(--border-color)] mx-1" />
        <ToolBtn
          onClick={() => exec('insertUnorderedList')}
          label="Bullet list"
          active={activeFormats.unorderedList}
        >
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => exec('insertOrderedList')}
          label="Numbered list"
          active={activeFormats.orderedList}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={insertChecklist} label="Checklist item">
          <CheckSquare className="w-4 h-4" />
        </ToolBtn>
        <span className="w-px h-4 bg-[var(--border-color)] mx-1" />
        <ToolBtn
          onClick={toggleHighlight}
          label="Highlight"
          active={activeFormats.highlight}
        >
          <Highlighter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={openLinkBar} label="Insert link" active={linkModalOpen}>
          <LinkIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            saveSelection();
            fileInputRef.current?.click();
          }}
          label={uploadingImage ? 'Uploading image…' : 'Insert image'}
          disabled={uploadingImage}
        >
          <ImageIcon className="w-4 h-4" />
        </ToolBtn>
        <span className="w-px h-4 bg-[var(--border-color)] mx-1" />
        <ToolBtn onClick={() => exec('undo')} label="Undo">
          <Undo2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('redo')} label="Redo">
          <Redo2 className="w-4 h-4" />
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageUpload(f);
            e.target.value = '';
          }}
        />
      </div>

      {linkModalOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              } else if (e.key === 'Escape') {
                setLinkModalOpen(false);
              }
            }}
            placeholder="https://example.com"
            className="flex-1 h-8 px-2.5 rounded-[7px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-8 px-3 rounded-[7px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[12px] font-semibold transition-colors"
          >
            Add
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          saveSelection();
          refreshActiveFormats();
          emitChange();
        }}
        onBlur={saveSelection}
        onKeyUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
        onMouseUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
        data-placeholder={placeholder}
        className={`prose-myspace p-4 text-[14px] leading-relaxed text-[var(--text-main)] focus:outline-none ${minHeightClass} empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)]`}
      />
    </div>
  );
}
