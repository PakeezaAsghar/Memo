import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  CheckSquare,
  FileText,
  Film,
  FolderKanban,
  HeartHandshake,
  Library,
  Lightbulb,
  Search,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { PageId } from '../types/workspace';
import { Modal } from './ui/Modal';

interface SearchResult {
  id: string;
  title: string;
  preview: string;
  category: string;
  date: string;
  page: PageId;
}

const FILTER_OPTIONS = [
  'All',
  'Notes',
  'Documents',
  'Tasks',
  'Bookmarks',
  'Projects',
  'Journal',
  'Books',
  'Music & Movies',
  'Ideas',
  'Knowledge',
  'Resources',
] as const;

export function GlobalSearchModal() {
  const { workspace, searchOpen, setSearchOpen, setActivePage } = useWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTER_OPTIONS)[number]>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'CS-418',
    'Portfolio',
    'Typography',
  ]);

  const results = useMemo(() => {
    if (!workspace) return [];
    const q = query.trim().toLowerCase();
    const list: SearchResult[] = [];

    if (filter === 'All' || filter === 'Notes') {
      workspace.notes.forEach((n) => {
        if (
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.plainText.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
        ) {
          list.push({
            id: n.id,
            title: n.title,
            preview: n.plainText.slice(0, 90) || 'Empty note',
            category: 'Notes',
            date: n.updatedAt.slice(0, 10),
            page: 'notes',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Documents') {
      workspace.documents
        .filter((d) => !d.isTrashed)
        .forEach((d) => {
          if (!q || d.name.toLowerCase().includes(q) || d.folder.toLowerCase().includes(q)) {
            list.push({
              id: d.id,
              title: d.name,
              preview: `${d.folder} · ${Math.round(d.size / 1024)} KB`,
              category: 'Documents',
              date: d.uploadedAt.slice(0, 10),
              page: 'documents',
            });
          }
        });
    }

    if (filter === 'All' || filter === 'Tasks') {
      workspace.tasks.forEach((t) => {
        if (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
          list.push({
            id: t.id,
            title: t.title,
            preview: `${t.completed ? 'Completed' : 'Pending'} · ${t.priority} priority`,
            category: 'Tasks',
            date: t.dueDate,
            page: 'tasks',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Bookmarks') {
      workspace.bookmarks.forEach((b) => {
        if (
          !q ||
          b.title.toLowerCase().includes(q) ||
          b.domain.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
        ) {
          list.push({
            id: b.id,
            title: b.title,
            preview: `${b.domain} · ${b.description.slice(0, 60)}`,
            category: 'Bookmarks',
            date: b.createdAt.slice(0, 10),
            page: 'bookmarks',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Projects') {
      workspace.projects.forEach((p) => {
        if (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
          list.push({
            id: p.id,
            title: p.title,
            preview: `${p.status} · ${p.progress}% complete`,
            category: 'Projects',
            date: p.deadline,
            page: 'projects',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Journal') {
      workspace.journal.forEach((j) => {
        if (!q || j.title.toLowerCase().includes(q) || j.plainText.toLowerCase().includes(q)) {
          list.push({
            id: j.id,
            title: j.title,
            preview: j.plainText.slice(0, 90),
            category: 'Journal',
            date: j.entryDate,
            page: 'journal',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Books') {
      workspace.books.forEach((b) => {
        if (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) {
          list.push({
            id: b.id,
            title: b.title,
            preview: `${b.author} · ${b.category}`,
            category: 'Books',
            date: b.updatedAt,
            page: 'reading',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Music & Movies') {
      (workspace.media || []).forEach((m) => {
        if (
          !q ||
          m.title.toLowerCase().includes(q) ||
          m.creator.toLowerCase().includes(q) ||
          m.genre.toLowerCase().includes(q)
        ) {
          list.push({
            id: m.id,
            title: m.title,
            preview: `${m.mediaType === 'music' ? 'Music' : 'Movie'} · ${m.creator}`,
            category: 'Music & Movies',
            date: m.updatedAt,
            page: 'media',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Ideas') {
      workspace.ideas.forEach((i) => {
        if (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) {
          list.push({
            id: i.id,
            title: i.title,
            preview: i.description.slice(0, 90),
            category: 'Ideas',
            date: i.createdAt,
            page: 'ideas',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Knowledge') {
      workspace.knowledge.forEach((k) => {
        if (
          !q ||
          k.title.toLowerCase().includes(q) ||
          k.content.toLowerCase().includes(q) ||
          k.tags.some((t) => t.toLowerCase().includes(q))
        ) {
          list.push({
            id: k.id,
            title: k.title,
            preview: k.content.slice(0, 90),
            category: 'Knowledge',
            date: k.createdAt.slice(0, 10),
            page: 'knowledge',
          });
        }
      });
    }

    if (filter === 'All' || filter === 'Resources') {
      workspace.resources.forEach((r) => {
        if (!q || r.title.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q)) {
          list.push({
            id: r.id,
            title: r.title,
            preview: r.notes.slice(0, 90),
            category: 'Resources',
            date: r.createdAt,
            page: 'resources',
          });
        }
      });
    }

    return list.slice(0, 24);
  }, [workspace, query, filter]);

  const iconFor = (cat: string) => {
    switch (cat) {
      case 'Notes':
        return <StickyNote className="w-4 h-4 text-[var(--sage-dark)]" />;
      case 'Documents':
        return <FileText className="w-4 h-4 text-[var(--info)]" />;
      case 'Tasks':
        return <CheckSquare className="w-4 h-4 text-[var(--success)]" />;
      case 'Bookmarks':
        return <Bookmark className="w-4 h-4 text-[var(--warning)]" />;
      case 'Projects':
        return <FolderKanban className="w-4 h-4 text-[var(--sage-dark)]" />;
      case 'Journal':
        return <HeartHandshake className="w-4 h-4 text-[var(--rose)]" />;
      case 'Books':
        return <BookOpen className="w-4 h-4 text-[#6C5E85]" />;
      case 'Music & Movies':
        return <Film className="w-4 h-4 text-[#A66A6C]" />;
      case 'Ideas':
        return <Lightbulb className="w-4 h-4 text-[var(--warning)]" />;
      case 'Knowledge':
        return <Library className="w-4 h-4 text-[#6C5E85]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[var(--sage-dark)]" />;
    }
  };

  return (
    <Modal
      open={searchOpen}
      onClose={() => setSearchOpen(false)}
      title="Search your space"
      subtitle="Notes, files, tasks, bookmarks, projects, journal, books, ideas, and knowledge"
      maxWidthClass="max-w-2xl"
    >
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything in your space..."
          className="w-full h-[42px] pl-9 pr-3 rounded-[10px] bg-[var(--bg-secondary)]/55 border border-[var(--border-color)] text-[14px] focus:outline-none focus:border-[var(--sage)]"
        />
      </div>

      {!query.trim() && recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 text-[12px] text-[var(--text-secondary)]">
          <span>Recent:</span>
          {recentSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="px-2 py-0.5 rounded-[6px] bg-[var(--bg-secondary)] hover:bg-[var(--sage-soft)] text-[var(--text-main)] transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-[var(--border-color)]">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setFilter(opt)}
            className={`px-2.5 py-1 rounded-[7px] text-[12px] font-medium whitespace-nowrap shrink-0 transition-colors ${
              filter === opt
                ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-[340px] overflow-y-auto divide-y divide-[var(--border-color)]">
        {results.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
            No matching items found for “{query}”.
          </div>
        ) : (
          results.map((item) => (
            <button
              key={`${item.category}-${item.id}`}
              type="button"
              onClick={() => {
                if (query.trim() && !recentSearches.includes(query.trim())) {
                  setRecentSearches((prev) => [query.trim(), ...prev].slice(0, 5));
                }
                setActivePage(item.page);
                setSearchOpen(false);
              }}
              className="w-full text-left py-2.5 px-2 rounded-[8px] hover:bg-[var(--bg-secondary)]/70 transition-colors flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-secondary)] flex items-center justify-center shrink-0 mt-0.5">
                {iconFor(item.category)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[var(--text-main)] truncate">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">
                    {item.category} · {item.date}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">
                  {item.preview}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
