import React, { useEffect, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  Heart,
  HelpCircle,
  Phone,
  Plus,
  ShieldAlert,
  Star,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../lib/api';
import { BrandMark } from '../components/BrandMark';
import { Modal } from '../components/ui/Modal';
import type { SavedResource } from '../types/workspace';

export function SavedResourcesPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const resources = workspace?.resources || [];

  const [catFilter, setCatFilter] = useState<'All' | SavedResource['category']>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<SavedResource['category']>('Guide');
  const [notes, setNotes] = useState('');

  const filtered = resources.filter((r) => catFilter === 'All' || r.category === catFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Saved Resources</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Curated guides, templates, toolkits, and reference links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['All', 'Guide', 'Template', 'Toolkit', 'Reference', 'Inspiration'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap ${
              catFilter === c
                ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded-[6px] bg-[var(--pale-yellow)] text-[#7C5F29] text-[11px] font-medium">
                  {res.category}
                </span>
                <button
                  type="button"
                  onClick={() => updateItem('resources', res.id, { isFavorite: !res.isFavorite })}
                  className="text-[var(--text-muted)] hover:text-[var(--warning)]"
                >
                  <Star
                    className={`w-4 h-4 ${
                      res.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                    }`}
                  />
                </button>
              </div>
              <h3 className="text-[15px] font-semibold mt-2">{res.title}</h3>
              <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">{res.notes}</p>
            </div>
            <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <a
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="text-[12.5px] font-semibold text-[var(--sage-dark)] hover:underline flex items-center gap-1"
              >
                Open resource <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => deleteItem('resources', res.id)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Save Resource">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('resources', {
              title: title.trim(),
              url: url.startsWith('http') ? url.trim() : `https://${url.trim()}`,
              category,
              notes: notes.trim(),
              isFavorite: false,
              createdAt: new Date().toISOString().slice(0, 10),
            });
            setTitle('');
            setUrl('');
            setNotes('');
            setModalOpen(false);
            notify('Resource saved');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SavedResource['category'])}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          >
            <option value="Guide">Guide</option>
            <option value="Template">Template</option>
            <option value="Toolkit">Toolkit</option>
            <option value="Reference">Reference</option>
            <option value="Inspiration">Inspiration</option>
          </select>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function EmergencyInfoPage() {
  const { workspace, updateEmergency, notify } = useWorkspace();
  const em = workspace?.emergency;
  const [contactModal, setContactModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cRel, setCRel] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');

  if (!em) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] bg-[var(--pale-yellow)]/60 border border-[var(--warning)]/30 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-card)] text-[#8D6E33] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Emergency Information</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Important contacts, medical notes, insurance, and preparedness details.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setContactModal(true)}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold shrink-0"
        >
          + Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5">
          <h2 className="text-[16px] font-semibold">Medical & Insurance Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Blood Type</label>
              <input
                type="text"
                value={em.bloodType}
                onChange={(e) => updateEmergency({ ...em, bloodType: e.target.value })}
                className="w-full h-[38px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Policy #</label>
              <input
                type="text"
                value={em.insurancePolicyNumber}
                onChange={(e) => updateEmergency({ ...em, insurancePolicyNumber: e.target.value })}
                className="w-full h-[38px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Insurance Provider</label>
            <input
              type="text"
              value={em.insuranceProvider}
              onChange={(e) => updateEmergency({ ...em, insuranceProvider: e.target.value })}
              className="w-full h-[38px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Allergies</label>
            <input
              type="text"
              value={em.allergies}
              onChange={(e) => updateEmergency({ ...em, allergies: e.target.value })}
              className="w-full h-[38px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Medical Notes</label>
            <textarea
              rows={2}
              value={em.medicalNotes}
              onChange={(e) => updateEmergency({ ...em, medicalNotes: e.target.value })}
              className="w-full p-2.5 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Home Address & Plan</label>
            <textarea
              rows={3}
              value={em.emergencyPlan}
              onChange={(e) => updateEmergency({ ...em, emergencyPlan: e.target.value })}
              className="w-full p-2.5 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
            <h2 className="text-[16px] font-semibold">Trusted Emergency Contacts</h2>
            {em.contacts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-[14px] font-semibold">{c.name}</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">{c.relation}</p>
                  <p className="text-[12.5px] font-mono-num text-[var(--sage-dark)] mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {c.phone} · {c.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await updateEmergency({
                      ...em,
                      contacts: em.contacts.filter((x) => x.id !== c.id),
                    });
                    notify('Contact removed');
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
            <h2 className="text-[16px] font-semibold">Important Identifiers</h2>
            <div className="divide-y divide-[var(--border-color)]">
              {em.importantDocs.map((d) => (
                <div key={d.id} className="py-2.5 flex justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">{d.label}</span>
                  <span className="font-semibold font-mono-num">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={contactModal} onClose={() => setContactModal(false)} title="Add Emergency Contact">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await updateEmergency({
              ...em,
              contacts: [
                ...em.contacts,
                {
                  id: `ec-${Date.now()}`,
                  name: cName.trim(),
                  relation: cRel.trim(),
                  phone: cPhone.trim(),
                  email: cEmail.trim(),
                },
              ],
            });
            setCName('');
            setCRel('');
            setCPhone('');
            setCEmail('');
            setContactModal(false);
            notify('Emergency contact added');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            placeholder="Full name"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <input
            type="text"
            required
            value={cRel}
            onChange={(e) => setCRel(e.target.value)}
            placeholder="Relationship (e.g., Sister, Doctor)"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="tel"
            required
            value={cPhone}
            onChange={(e) => setCPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="email"
            value={cEmail}
            onChange={(e) => setCEmail(e.target.value)}
            placeholder="Email address"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setContactModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function HelpSupportPage() {
  const { setActivePage } = useWorkspace();
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-[var(--sage-soft)] text-[var(--sage-dark)] flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Help & Support</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Shortcuts, privacy practices, and getting the most out of Memo.
          </p>
        </div>
      </div>

      <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
        <h2 className="text-[16px] font-semibold">Keyboard Shortcuts & Quick Tips</h2>
        <div className="divide-y divide-[var(--border-color)] text-[13.5px]">
          <div className="py-2.5 flex justify-between">
            <span>Open Global Search anywhere</span>
            <span className="font-mono-num px-2 py-0.5 rounded bg-[var(--bg-secondary)]">⌘K / Ctrl+K</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span>Close any open dialog</span>
            <span className="font-mono-num px-2 py-0.5 rounded bg-[var(--bg-secondary)]">Esc</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span>Export full JSON workspace backup</span>
            <button
              type="button"
              onClick={() => setActivePage('settings')}
              className="text-[var(--sage-dark)] font-semibold hover:underline"
            >
              Settings → Data Management
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[var(--rose)]" />
          <h2 className="text-[16px] font-semibold">Privacy & Data Isolation</h2>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          All notes, journal entries, uploaded files, and financial logs are scoped strictly to your authenticated user account. The AI Assistant only receives content from sections you explicitly toggle on.
        </p>
      </div>
    </div>
  );
}

export function SharedDocumentPage({ shareToken }: { shareToken: string }) {
  const [doc, setDoc] = useState<{
    name: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    downloadUrl: string;
    previewUrl: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSharedDocument(shareToken)
      .then((res) => setDoc(res.document))
      .catch((e) => setErr(e instanceof Error ? e.message : 'Link unavailable.'));
  }, [shareToken]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl rounded-[16px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <BrandMark />
          <span className="text-[12px] text-[var(--text-muted)]">Shared Document</span>
        </div>
        {err ? (
          <p className="py-8 text-center text-[14px] text-[var(--error)]">{err}</p>
        ) : !doc ? (
          <p className="py-8 text-center text-[14px] text-[var(--text-secondary)]">Loading shared file…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-[var(--sage-dark)] shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-[17px] font-semibold truncate">{doc.name}</h1>
                  <p className="text-[12px] text-[var(--text-muted)] tabular-nums">
                    {Math.round(doc.size / 1024)} KB · Shared via Memo
                  </p>
                </div>
              </div>
              <a
                href={doc.downloadUrl}
                download={doc.name}
                className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
            {doc.mimeType.startsWith('image/') && (
              <img
                src={doc.previewUrl}
                alt={doc.name}
                referrerPolicy="no-referrer"
                className="w-full max-h-[55vh] object-contain rounded-[10px] border border-[var(--border-color)]"
              />
            )}
            {doc.mimeType === 'application/pdf' && (
              <iframe
                src={doc.previewUrl}
                title={doc.name}
                className="w-full h-[55vh] rounded-[10px] border border-[var(--border-color)] bg-white"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
