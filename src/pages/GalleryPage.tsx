import React, { useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Plus, Search, Star, Trash2, Upload } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { GalleryItem } from '../types/workspace';

const CATEGORIES: Array<'All' | GalleryItem['category']> = [
  'All',
  'Memories',
  'Photography',
  'Design Inspiration',
  'Places',
  'Screenshots',
  'Personal Collections',
];

export function GalleryPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const items = workspace?.gallery || [];

  const [category, setCategory] = useState<'All' | GalleryItem['category']>('All');
  const [albumFilter, setAlbumFilter] = useState('All Albums');
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [uploadModal, setUploadModal] = useState(false);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [itemCat, setItemCat] = useState<GalleryItem['category']>('Memories');
  const [album, setAlbum] = useState('Autumn 2026');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const albums = useMemo(
    () => ['All Albums', ...Array.from(new Set(items.map((i) => i.album).filter(Boolean)))],
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (albumFilter !== 'All Albums' && item.album !== albumFilter) return false;
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !item.album.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, category, albumFilter, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Personal Gallery</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Private memories, design inspiration, and visual collections.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadModal(true)}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Upload Photo
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap shrink-0 ${
                category === c
                  ? 'bg-[var(--blush)] text-[#7C4446] font-semibold'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={albumFilter}
            onChange={(e) => setAlbumFilter(e.target.value)}
            className="h-[38px] px-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[12.5px]"
          >
            {albums.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div className="relative w-48">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gallery..."
              className="w-full h-[38px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="A quiet album for your favorite frames."
          description="Upload personal memories, moodboard clippings, or studio screenshots."
          actionLabel="Upload your first image"
          onAction={() => setUploadModal(true)}
          tone="blush"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightbox(item)}
              className="cursor-pointer rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden group hover:border-[var(--sage)] transition-colors"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-secondary)]">
                <img
                  src={withFileAuth(item.imageUrl)}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                />
              </div>
              <div className="p-3.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-semibold truncate">{item.title}</h3>
                  <p className="text-[11.5px] text-[var(--text-muted)] truncate mt-0.5">
                    {item.album} · {item.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateItem('gallery', item.id, { isFavorite: !item.isFavorite });
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--warning)] shrink-0"
                >
                  <Star
                    className={`w-4 h-4 ${
                      item.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Modal
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.title || ''}
        subtitle={lightbox ? `${lightbox.album} · ${lightbox.category}` : ''}
        maxWidthClass="max-w-3xl"
      >
        {lightbox && (
          <div className="space-y-4">
            <img
              src={withFileAuth(lightbox.imageUrl)}
              alt={lightbox.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[60vh] object-contain rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)]"
            />
            <p className="text-[13.5px] text-[var(--text-secondary)]">{lightbox.description}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  await deleteItem('gallery', lightbox.id);
                  setLightbox(null);
                  notify('Photo removed from gallery');
                }}
                className="h-[36px] px-3.5 rounded-[8px] text-[var(--error)] hover:bg-[var(--blush)]/45 text-[13px] font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Photo
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload to Gallery">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) {
              notify('Please choose an image file', 'error');
              return;
            }
            setBusy(true);
            try {
              const up = await api.uploadFile(file);
              await addItem('gallery', {
                title: title.trim() || file.name,
                description: desc.trim(),
                category: itemCat,
                album: album.trim() || 'Personal',
                imageUrl: up.url,
                isFavorite: false,
                createdAt: new Date().toISOString().slice(0, 10),
              });
              setTitle('');
              setDesc('');
              setFile(null);
              setUploadModal(false);
              notify('Image added to gallery');
            } catch {
              notify('Upload failed', 'error');
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-3"
        >
          <label className="flex flex-col items-center justify-center p-5 rounded-[10px] border border-dashed border-[var(--border-color)] cursor-pointer hover:border-[var(--sage)]">
            <Upload className="w-5 h-5 text-[var(--sage-dark)] mb-1.5" />
            <span className="text-[13px] font-medium">
              {file ? file.name : 'Select an image file'}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Photo title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={itemCat}
              onChange={(e) => setItemCat(e.target.value as GalleryItem['category'])}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Album name"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setUploadModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
            >
              {busy ? 'Uploading…' : 'Upload Photo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
