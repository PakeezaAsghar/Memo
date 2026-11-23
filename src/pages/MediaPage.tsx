import React, { useMemo, useRef, useState } from 'react';
import {
  Disc3,
  Film,
  Heart,
  Music,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { MediaItem } from '../types/workspace';

type TypeFilter = 'All' | 'music' | 'movie' | 'favorites';
type StatusFilter = 'All' | MediaItem['status'];

function getStatusLabel(mediaType: MediaItem['mediaType'], status: MediaItem['status']): string {
  if (mediaType === 'music') {
    if (status === 'Queue') return 'Listen Later';
    if (status === 'Current') return 'On Repeat';
    return 'Listened';
  }
  if (status === 'Queue') return 'Watchlist';
  if (status === 'Current') return 'Watching';
  return 'Watched';
}

function nextStatus(status: MediaItem['status']): MediaItem['status'] {
  if (status === 'Queue') return 'Current';
  if (status === 'Current') return 'Completed';
  return 'Queue';
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function MediaPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const items = workspace?.media || [];

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(2);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);

  const [mediaType, setMediaType] = useState<MediaItem['mediaType']>('music');
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState<MediaItem['status']>('Queue');
  const [rating, setRating] = useState(0);
  const [url, setUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const musicCount = items.filter((i) => i.mediaType === 'music').length;
    const movieCount = items.filter((i) => i.mediaType === 'movie').length;
    const activeCount = items.filter((i) => i.status === 'Current').length;
    const favCount = items.filter((i) => i.isFavorite).length;
    return { musicCount, movieCount, activeCount, favCount };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter === 'music' && item.mediaType !== 'music') return false;
      if (typeFilter === 'movie' && item.mediaType !== 'movie') return false;
      if (typeFilter === 'favorites' && !item.isFavorite) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q) ||
        item.genre.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [items, typeFilter, statusFilter, search]);

  const openNew = (defaultType?: MediaItem['mediaType']) => {
    setEditing(null);
    setMediaType(defaultType || (typeFilter === 'movie' ? 'movie' : 'music'));
    setTitle('');
    setCreator('');
    setGenre('');
    setYear('');
    setStatus('Queue');
    setRating(0);
    setUrl('');
    setCoverUrl('');
    setIsFavorite(false);
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (item: MediaItem) => {
    setEditing(item);
    setMediaType(item.mediaType);
    setTitle(item.title);
    setCreator(item.creator);
    setGenre(item.genre);
    setYear(item.year || '');
    setStatus(item.status);
    setRating(item.rating);
    setUrl(item.url || '');
    setCoverUrl(item.coverUrl || '');
    setIsFavorite(item.isFavorite);
    setNotes(item.notes);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Music & Movies</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Albums, tracks, films, and series saved for quiet evenings and studio focus.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => openNew('music')}
            className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--sage)] text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5"
          >
            <Music className="w-4 h-4 text-[#6C5E85]" />
            Save Music
          </button>
          <button
            type="button"
            onClick={() => openNew('movie')}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Save Movie
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Saved Music</span>
            <div className="w-7 h-7 rounded-[7px] bg-[var(--lavender)] text-[#6C5E85] flex items-center justify-center">
              <Disc3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[22px] font-bold mt-2 tabular-nums">{stats.musicCount}</p>
        </div>

        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Saved Movies</span>
            <div className="w-7 h-7 rounded-[7px] bg-[var(--blush)] text-[#A66A6C] flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[22px] font-bold mt-2 tabular-nums">{stats.movieCount}</p>
        </div>

        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">In Rotation</span>
            <div className="w-7 h-7 rounded-[7px] bg-[var(--sage-soft)] text-[var(--sage-dark)] flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[22px] font-bold mt-2 tabular-nums">{stats.activeCount}</p>
        </div>

        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">Favorites</span>
            <div className="w-7 h-7 rounded-[7px] bg-[var(--pale-yellow)] text-[#8D6E33] flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[22px] font-bold mt-2 tabular-nums">{stats.favCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['All', 'All'],
              ['music', 'Music'],
              ['movie', 'Movies'],
              ['favorites', 'Favorites'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap ${
                typeFilter === key
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              {label}
            </button>
          ))}

          <span className="mx-1 text-[var(--border-color)] hidden sm:inline">|</span>

          {(
            [
              ['All', 'All Statuses'],
              ['Queue', 'Watchlist / Later'],
              ['Current', 'On Repeat / Watching'],
              ['Completed', 'Completed'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium whitespace-nowrap ${
                statusFilter === key
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-main)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter title, artist, director…"
            className="w-full h-[36px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
          />
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={typeFilter === 'movie' ? Film : Music}
          title="Save songs, albums, and films worth returning to."
          description="Keep track of playlists for deep focus, albums on repeat, and movies on your weekend watchlist."
          actionLabel="Save your first title"
          onAction={() => openNew(typeFilter === 'movie' ? 'movie' : 'music')}
          tone={typeFilter === 'movie' ? 'blush' : 'lavender'}
        />
      ) : (
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((prev) => Math.min(filtered.length - 1, prev + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((prev) => Math.max(0, prev - 1));
            }
          }}
          className="relative max-w-[560px] mx-auto py-6 sm:py-8 px-2 sm:px-4 flex flex-col items-start gap-2.5 sm:gap-3 overflow-hidden focus:outline-none"
        >
          {filtered.map((item, idx) => {
            const safeActive = Math.min(activeIndex, Math.max(0, filtered.length - 1));
            const offset = idx - safeActive;
            const isActive = offset === 0;
            const isMusic = item.mediaType === 'music';
            const statusText = getStatusLabel(item.mediaType, item.status);

            const arcMotionMap: Record<number, string> = {
              [-3]: 'translate-x-24 sm:translate-x-48 rotate-[21deg] scale-[0.74] opacity-30 z-0 origin-left',
              [-2]: 'translate-x-14 sm:translate-x-32 rotate-[14deg] scale-[0.84] opacity-60 z-10 origin-left',
              [-1]: 'translate-x-7 sm:translate-x-14 rotate-[7deg] scale-[0.92] opacity-85 z-20 origin-left',
              [0]: 'translate-x-0 rotate-0 scale-100 opacity-100 z-30 origin-left',
              [1]: 'translate-x-7 sm:translate-x-14 -rotate-[7deg] scale-[0.92] opacity-85 z-20 origin-left',
              [2]: 'translate-x-14 sm:translate-x-32 -rotate-[14deg] scale-[0.84] opacity-60 z-10 origin-left',
              [3]: 'translate-x-24 sm:translate-x-48 -rotate-[21deg] scale-[0.74] opacity-30 z-0 origin-left',
            };
            const arcClass = arcMotionMap[offset] || 'hidden';

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isActive) {
                    openEdit(item);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                className={`group relative cursor-pointer transition-all duration-300 ease-out flex items-center gap-3.5 sm:gap-4 ${
                  isActive
                    ? 'w-full max-w-[490px] rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]/80 p-2 pr-3 sm:pr-4 shadow-[0_14px_34px_rgba(57,54,47,0.10)] hover:border-[var(--sage)]/60'
                    : 'w-auto pr-4 py-1 hover:opacity-100'
                } ${arcClass}`}
              >
                {/* Circular artwork */}
                {item.coverUrl ? (
                  <img
                    src={withFileAuth(item.coverUrl)}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className={`rounded-full object-cover shrink-0 border border-[var(--border-color)]/60 shadow-[0_8px_18px_rgba(57,54,47,0.14)] transition-all duration-300 ${
                      isActive ? 'w-[68px] h-[68px] sm:w-[76px] sm:h-[76px]' : 'w-[58px] h-[58px] sm:w-[66px] sm:h-[66px]'
                    }`}
                  />
                ) : (
                  <div
                    className={`rounded-full shrink-0 border border-[var(--border-color)]/70 shadow-[0_8px_18px_rgba(57,54,47,0.12)] flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                      isActive ? 'w-[68px] h-[68px] sm:w-[76px] sm:h-[76px]' : 'w-[58px] h-[58px] sm:w-[66px] sm:h-[66px]'
                    } ${
                      isMusic
                        ? 'bg-[radial-gradient(circle_at_35%_30%,#EDE9F6_0%,#D9D2E9_55%,#8E7FA8_100%)] text-[#4A3F5E]'
                        : 'bg-[radial-gradient(circle_at_35%_30%,#FAE9E9_0%,#F2D1D1_55%,#C98E90_100%)] text-[#734143]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-1.5 rounded-full border border-white/40 pointer-events-none"
                    />
                    {isMusic ? (
                      <Disc3 className={isActive ? 'w-7 h-7' : 'w-6 h-6'} />
                    ) : (
                      <Film className={isActive ? 'w-7 h-7' : 'w-6 h-6'} />
                    )}
                  </div>
                )}

                {/* Title & Creator */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-bold text-[var(--text-main)] truncate leading-snug ${
                      isActive ? 'text-[15px] sm:text-[16px]' : 'text-[14px] sm:text-[15px]'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[12px] sm:text-[12.5px] text-[var(--text-secondary)] truncate mt-0.5">
                    {item.creator}
                  </p>
                </div>

                {/* Focused item Play pill + visible quick actions */}
                {isActive && (
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-0.5 mr-1">
                      <button
                        type="button"
                        aria-label={item.isFavorite ? 'Remove favorite' : 'Favorite'}
                        title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateItem('media', item.id, { isFavorite: !item.isFavorite });
                        }}
                        className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            item.isFavorite
                              ? 'fill-[var(--rose)] text-[var(--rose)]'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label="Edit item"
                        title={`Edit · ${statusText}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                        className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete item"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem('media', item.id);
                          notify('Removed from Music & Movies');
                        }}
                        className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-[34px] px-4 sm:px-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_4px_12px_rgba(57,54,47,0.09)] hover:border-[var(--sage)] text-[12px] sm:text-[12.5px] font-semibold text-[var(--text-main)] inline-flex items-center justify-center transition-all hover:shadow-[0_6px_16px_rgba(57,54,47,0.14)]"
                      >
                        {isMusic ? 'Play' : 'Watch'}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const next = nextStatus(item.status);
                          await updateItem('media', item.id, {
                            status: next,
                            updatedAt: new Date().toISOString().slice(0, 10),
                          });
                          notify(`Moved to ${getStatusLabel(item.mediaType, next)}`);
                        }}
                        title={`Mark ${getStatusLabel(item.mediaType, nextStatus(item.status))}`}
                        className="h-[34px] px-4 sm:px-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_4px_12px_rgba(57,54,47,0.09)] hover:border-[var(--sage)] text-[12px] sm:text-[12.5px] font-semibold text-[var(--text-main)] inline-flex items-center justify-center transition-all hover:shadow-[0_6px_16px_rgba(57,54,47,0.14)]"
                      >
                        {isMusic ? 'Play' : 'Watch'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Music or Movie' : 'Save Music or Movie'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const payload = {
                mediaType,
                title: title.trim(),
                creator: creator.trim() || (mediaType === 'music' ? 'Unknown Artist' : 'Unknown Director'),
                genre: genre.trim(),
                year: year.trim() || undefined,
                status,
                rating,
                url: normalizeUrl(url) || undefined,
                coverUrl: coverUrl || undefined,
                isFavorite,
                notes: notes.trim(),
                updatedAt: new Date().toISOString().slice(0, 10),
              };
              if (editing) {
                await updateItem('media', editing.id, payload);
                notify('Saved changes');
              } else {
                await addItem('media', payload);
                notify(mediaType === 'music' ? 'Music saved' : 'Movie saved');
              }
              setModalOpen(false);
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-3"
        >
          {/* Music vs Movie selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMediaType('music')}
              className={`h-[38px] rounded-[9px] border text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                mediaType === 'music'
                  ? 'bg-[var(--lavender)] border-[#8E7FA8] text-[#6C5E85]'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Music className="w-4 h-4" />
              Music / Album
            </button>
            <button
              type="button"
              onClick={() => setMediaType('movie')}
              className={`h-[38px] rounded-[9px] border text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
                mediaType === 'movie'
                  ? 'bg-[var(--blush)] border-[var(--rose)] text-[#A66A6C]'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Film className="w-4 h-4" />
              Movie / Series
            </button>
          </div>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              mediaType === 'music'
                ? 'Song, album, or playlist title'
                : 'Movie or series title'
            }
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] focus:outline-none focus:border-[var(--sage)]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder={mediaType === 'music' ? 'Artist or band' : 'Director or creator'}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MediaItem['status'])}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            >
              <option value="Queue">{mediaType === 'music' ? 'Listen Later' : 'Watchlist'}</option>
              <option value="Current">{mediaType === 'music' ? 'On Repeat' : 'Watching'}</option>
              <option value="Completed">{mediaType === 'music' ? 'Listened' : 'Watched'}</option>
            </select>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder={mediaType === 'music' ? 'Genre (e.g., Indie, Jazz)' : 'Genre (e.g., Drama, Sci-Fi)'}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Release year (optional)"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              mediaType === 'music'
                ? 'Spotify, Apple Music, or YouTube link (optional)'
                : 'Letterboxd, IMDb, or streaming link (optional)'
            }
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-[var(--text-secondary)] mr-1">Rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}>
                  <Star
                    className={`w-4 h-4 ${
                      n <= rating
                        ? 'fill-[var(--warning)] text-[var(--warning)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                  />
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 text-[12.5px] text-[var(--text-main)] cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="accent-[var(--rose)]"
              />
              Mark as favorite
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-[var(--border-color)] cursor-pointer text-[12.5px] hover:border-[var(--sage)]">
              <Upload className="w-4 h-4 text-[var(--sage-dark)] shrink-0" />
              <span className="truncate">
                {coverUrl
                  ? 'Artwork attached'
                  : mediaType === 'music'
                  ? 'Upload album art (optional)'
                  : 'Upload poster image (optional)'}
              </span>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const up = await api.uploadFile(f);
                    setCoverUrl(up.url);
                  }
                }}
              />
            </label>
            {coverUrl && (
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                className="px-2.5 py-2 rounded-[8px] border border-[var(--border-color)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--error)]"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              mediaType === 'music'
                ? 'Favorite tracks, mood, or why you saved this…'
                : 'Who recommended it, memorable scenes, or review notes…'
            }
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
