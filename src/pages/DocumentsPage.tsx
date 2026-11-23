import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderInput,
  Grid,
  Image as ImageIcon,
  List,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { DocumentItem } from '../types/workspace';

const FOLDERS = [
  'All Files',
  'Study Material',
  'Projects',
  'Personal',
  'Certificates',
  'Work',
  'Images',
  'Other',
  'Trash',
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const docs = workspace?.documents || [];

  const [folder, setFolder] = useState('All Files');
  const [search, setSearch] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveDoc, setMoveDoc] = useState<DocumentItem | null>(null);
  const [shareDoc, setShareDoc] = useState<DocumentItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs
      .filter((d) => {
        if (folder === 'Trash') return d.isTrashed;
        if (d.isTrashed) return false;
        if (folder !== 'All Files' && d.folder !== folder) return false;
        if (onlyFav && !d.isFavorite) return false;
        if (q && !d.name.toLowerCase().includes(q) && !d.folder.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return b.uploadedAt.localeCompare(a.uploadedAt);
      });
  }, [docs, folder, search, onlyFav, sortBy]);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const up = await api.uploadFile(file);
        const autoFolder =
          folder !== 'All Files' && folder !== 'Trash'
            ? folder
            : up.mimeType.startsWith('image/')
            ? 'Images'
            : 'Personal';
        await addItem('documents', {
          name: up.name,
          mimeType: up.mimeType,
          size: up.size,
          folder: autoFolder,
          url: up.url,
          extractedText: up.extractedText,
          shareToken: null,
          isFavorite: false,
          isTrashed: false,
          uploadedAt: new Date().toISOString(),
        });
      }
      notify(`Uploaded ${fileList.length} file(s)`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const renderThumbnail = (doc: DocumentItem) => {
    if (doc.mimeType.startsWith('image/')) {
      return (
        <img
          src={withFileAuth(doc.url)}
          alt={doc.name}
          referrerPolicy="no-referrer"
          className="w-full h-32 object-cover rounded-[8px] border border-[var(--border-color)]"
        />
      );
    }
    if (doc.mimeType === 'application/pdf') {
      return (
        <div className="w-full h-32 rounded-[8px] bg-[#F8F3EC] border border-[var(--border-color)] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-1.5 py-0.5 rounded bg-[var(--blush)] text-[#8A4E50] text-[10px] font-bold">
              PDF
            </span>
            <FileText className="w-4 h-4 text-[var(--rose)]" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-4/5 rounded bg-[var(--border-color)]" />
            <div className="h-1.5 w-full rounded bg-[var(--border-color)]/70" />
            <div className="h-1.5 w-3/4 rounded bg-[var(--border-color)]/70" />
          </div>
        </div>
      );
    }
    if (
      doc.mimeType.includes('spreadsheet') ||
      doc.mimeType.includes('csv') ||
      doc.name.endsWith('.xlsx') ||
      doc.name.endsWith('.csv')
    ) {
      return (
        <div className="w-full h-32 rounded-[8px] bg-[var(--sage-soft)]/50 border border-[var(--border-color)] flex flex-col items-center justify-center gap-1.5">
          <FileSpreadsheet className="w-8 h-8 text-[var(--sage-dark)]" />
          <span className="text-[11px] font-semibold text-[var(--sage-dark)]">
            {doc.name.split('.').pop()?.toUpperCase() || 'SHEET'}
          </span>
        </div>
      );
    }
    return (
      <div className="w-full h-32 rounded-[8px] bg-[#EEF2F7] border border-[var(--border-color)] flex flex-col items-center justify-center gap-1.5">
        <FileText className="w-8 h-8 text-[var(--info)]" />
        <span className="text-[11px] font-semibold text-[#455E7B]">
          {doc.name.split('.').pop()?.toUpperCase() || 'FILE'}
        </span>
      </div>
    );
  };

  const toggleShareToken = async (doc: DocumentItem) => {
    const nextToken = doc.shareToken ? null : `sh-${Math.random().toString(36).slice(2, 12)}`;
    await updateItem('documents', doc.id, { shareToken: nextToken });
    setShareDoc({ ...doc, shareToken: nextToken });
    notify(nextToken ? 'Share link activated' : 'Share link revoked');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--text-main)]">
            Documents
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Your files, beautifully organized.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.md,.csv,.json"
          className="hidden"
          onChange={(e) => {
            handleUploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left folders */}
        <aside className="lg:col-span-3 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-3 space-y-1">
          <p className="px-2 py-1 text-[11px] font-semibold tracking-wider text-[var(--text-muted)]">
            FOLDERS
          </p>
          {FOLDERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolder(f)}
              className={`w-full text-left px-2.5 py-2 rounded-[8px] text-[13px] flex items-center gap-2 transition-colors ${
                folder === f
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                  : 'text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {f === 'Trash' ? (
                <Trash2 className="w-4 h-4 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{f}</span>
            </button>
          ))}
        </aside>

        {/* Main document vault */}
        <section className="lg:col-span-9 space-y-4">
          {/* Drag and drop upload bar */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleUploadFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-[12px] border border-dashed px-4 py-3.5 flex items-center justify-between gap-3 transition-colors ${
              dragging
                ? 'border-[var(--sage-dark)] bg-[var(--sage-soft)]'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--sage)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[var(--sage-soft)] text-[var(--sage-dark)] flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-main)]">
                  Drop files here or click to browse
                </p>
                <p className="text-[11.5px] text-[var(--text-secondary)]">
                  Supports PDF, DOCX, XLSX, PPTX, CSV, JPG, PNG, and text files
                </p>
              </div>
            </div>
          </div>

          {/* Search, filter, sort, toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full h-[38px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyFav((v) => !v)}
              className={`h-[38px] px-3 rounded-[9px] border text-[13px] font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                onlyFav
                  ? 'bg-[var(--pale-yellow)] border-[var(--warning)]/40 text-[var(--text-main)]'
                  : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Favorites
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
              aria-label="Sort documents"
              className="h-[38px] px-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none"
            >
              <option value="date">Newest first</option>
              <option value="name">Name (A–Z)</option>
              <option value="size">File size</option>
            </select>

            <div className="flex items-center p-0.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)]">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                  viewMode === 'list'
                    ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                folder === 'Trash' ? 'Trash is empty.' : 'Your digital shelves are waiting.'
              }
              description={
                folder === 'Trash'
                  ? 'Deleted documents appear here so you can restore them anytime.'
                  : 'Upload PDFs, syllabi, spreadsheets, certificates, and reference images.'
              }
              actionLabel={folder === 'Trash' ? undefined : 'Upload your first file'}
              onAction={folder === 'Trash' ? undefined : () => inputRef.current?.click()}
              tone="sage"
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="text-left focus:outline-none"
                  >
                    {renderThumbnail(doc)}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-semibold text-[var(--text-main)] truncate">
                        {doc.name}
                      </h3>
                      <button
                        type="button"
                        aria-label="Favorite file"
                        onClick={() =>
                          updateItem('documents', doc.id, { isFavorite: !doc.isFavorite })
                        }
                        className="text-[var(--text-muted)] hover:text-[var(--warning)] shrink-0"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            doc.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11.5px] text-[var(--text-muted)] mt-1 tabular-nums">
                      {doc.folder} · {formatSize(doc.size)} · {doc.uploadedAt.slice(0, 10)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-1">
                    {doc.isTrashed ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await updateItem('documents', doc.id, { isTrashed: false });
                            notify('Restored from trash');
                          }}
                          className="h-8 px-2.5 rounded-[7px] bg-[var(--sage-soft)] text-[var(--sage-dark)] text-[12px] font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteItem('documents', doc.id);
                            notify('Permanently deleted');
                          }}
                          className="h-8 px-2.5 rounded-[7px] text-[var(--error)] hover:bg-[var(--blush)]/45 text-[12px] font-semibold"
                        >
                          Delete forever
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            title="Preview"
                            onClick={() => setPreviewDoc(doc)}
                            className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`${withFileAuth(doc.url)}${doc.url.includes('?') ? '&' : '?'}download=1`}
                            download={doc.name}
                            title="Download"
                            className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            title="Rename"
                            onClick={() => {
                              setRenameDoc(doc);
                              setRenameValue(doc.name);
                            }}
                            className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Move folder"
                            onClick={() => setMoveDoc(doc)}
                            className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                          >
                            <FolderInput className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Share link"
                            onClick={() => {
                              setCopiedLink(false);
                              setShareDoc(doc);
                            }}
                            className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                              doc.shareToken
                                ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          title="Move to trash"
                          onClick={async () => {
                            await updateItem('documents', doc.id, { isTrashed: true });
                            notify('Moved to trash');
                          }}
                          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--error)] hover:bg-[var(--blush)]/45"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-x-auto">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-secondary)]/45"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center gap-3 min-w-0 text-left flex-1"
                  >
                    {doc.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-[var(--rose)] shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-[var(--info)] shrink-0" />
                    )}
                    <span className="text-[13.5px] font-semibold text-[var(--text-main)] truncate">
                      {doc.name}
                    </span>
                  </button>
                  <span className="text-[12px] text-[var(--text-muted)] tabular-nums shrink-0 hidden sm:inline">
                    {doc.folder} · {formatSize(doc.size)} · {doc.uploadedAt.slice(0, 10)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={`${withFileAuth(doc.url)}${doc.url.includes('?') ? '&' : '?'}download=1`}
                      download={doc.name}
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center hover:bg-[var(--bg-secondary)]"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => updateItem('documents', doc.id, { isTrashed: !doc.isTrashed })}
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--error)] hover:bg-[var(--blush)]/45"
                    >
                      {doc.isTrashed ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Preview Modal */}
      <Modal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name || 'Document preview'}
        subtitle={previewDoc ? `${previewDoc.folder} · ${formatSize(previewDoc.size)}` : ''}
        maxWidthClass="max-w-3xl"
      >
        {previewDoc && (
          <div className="space-y-4">
            {previewDoc.mimeType.startsWith('image/') ? (
              <img
                src={withFileAuth(previewDoc.url)}
                alt={previewDoc.name}
                referrerPolicy="no-referrer"
                className="w-full max-h-[65vh] object-contain rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-main)]"
              />
            ) : previewDoc.mimeType === 'application/pdf' ? (
              <iframe
                src={withFileAuth(previewDoc.url)}
                title={previewDoc.name}
                className="w-full h-[60vh] rounded-[10px] border border-[var(--border-color)] bg-white"
              />
            ) : previewDoc.extractedText ? (
              <pre className="p-4 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[12.5px] font-mono-num whitespace-pre-wrap max-h-[55vh] overflow-y-auto">
                {previewDoc.extractedText}
              </pre>
            ) : (
              <div className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
                Inline preview is unavailable for this binary format. Use Download below to open it locally.
              </div>
            )}
            <div className="flex justify-end gap-2">
              <a
                href={`${withFileAuth(previewDoc.url)}${previewDoc.url.includes('?') ? '&' : '?'}download=1`}
                download={previewDoc.name}
                className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Rename Modal */}
      <Modal
        open={Boolean(renameDoc)}
        onClose={() => setRenameDoc(null)}
        title="Rename document"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!renameDoc || !renameValue.trim()) return;
            await updateItem('documents', renameDoc.id, { name: renameValue.trim() });
            setRenameDoc(null);
            notify('Document renamed');
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenameDoc(null)}
              className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Move Folder Modal */}
      <Modal open={Boolean(moveDoc)} onClose={() => setMoveDoc(null)} title="Move to folder">
        <div className="grid grid-cols-2 gap-2">
          {FOLDERS.filter((f) => f !== 'All Files' && f !== 'Trash').map((f) => (
            <button
              key={f}
              type="button"
              onClick={async () => {
                if (!moveDoc) return;
                await updateItem('documents', moveDoc.id, { folder: f });
                setMoveDoc(null);
                notify(`Moved to ${f}`);
              }}
              className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--sage)] text-left text-[13px] font-medium flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-[var(--sage-dark)]" />
              {f}
            </button>
          ))}
        </div>
      </Modal>

      {/* Share Link Modal */}
      <Modal
        open={Boolean(shareDoc)}
        onClose={() => setShareDoc(null)}
        title="Explicitly controlled sharing"
        subtitle="Only people with this active link can view or download this document."
      >
        {shareDoc && (
          <div className="space-y-4">
            {shareDoc.shareToken ? (
              <>
                <div className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between gap-2">
                  <span className="text-[12px] font-mono-num truncate text-[var(--text-main)]">
                    {`${window.location.origin}/?share=${shareDoc.shareToken}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${window.location.origin}/?share=${shareDoc.shareToken}`
                      );
                      setCopiedLink(true);
                      notify('Share link copied');
                    }}
                    className="h-8 px-3 rounded-[7px] bg-[var(--sage)] text-white text-[12px] font-semibold flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleShareToken(shareDoc)}
                  className="h-[38px] px-4 rounded-[9px] bg-[var(--blush)] text-[#8A4E50] text-[13px] font-semibold"
                >
                  Revoke share access
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-[var(--text-secondary)]">
                  This document is currently private. Create an access link if you want to share it externally.
                </p>
                <button
                  type="button"
                  onClick={() => toggleShareToken(shareDoc)}
                  className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
                >
                  Create controlled share link
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
