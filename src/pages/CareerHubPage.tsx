import React, { useState } from 'react';
import { Briefcase, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Modal } from '../components/ui/Modal';
import type { CareerJob, CareerRecord } from '../types/workspace';

const JOB_STATUS_STYLE: Record<CareerJob['status'], string> = {
  Interested: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  Applied: 'bg-[#E5ECF4] text-[#455E7B]',
  Interview: 'bg-[var(--pale-yellow)] text-[#7C5F29]',
  Rejected: 'bg-[var(--blush)] text-[#8A4E50]',
  Accepted: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]',
};

const CAREER_TABS: Array<{ id: CareerRecord['section'] | 'jobs'; label: string }> = [
  { id: 'jobs', label: 'Jobs & Internships' },
  { id: 'resume', label: 'Resume Library' },
  { id: 'certificate', label: 'Certificates' },
  { id: 'skill', label: 'Skills' },
  { id: 'client', label: 'Clients' },
  { id: 'freelance', label: 'Freelance Income' },
  { id: 'contact', label: 'Contacts' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'goal', label: 'Career Goals' },
];

export function CareerHubPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const jobs = workspace?.careerJobs || [];
  const records = workspace?.careerRecords || [];

  const [tab, setTab] = useState<CareerRecord['section'] | 'jobs'>('jobs');
  const [jobModal, setJobModal] = useState(false);
  const [recModal, setRecModal] = useState(false);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [kind, setKind] = useState<'Job' | 'Internship'>('Internship');
  const [status, setStatus] = useState<CareerJob['status']>('Applied');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  const [recTitle, setRecTitle] = useState('');
  const [recSub, setRecSub] = useState('');
  const [recMeta, setRecMeta] = useState('');
  const [recAmt, setRecAmt] = useState('');

  const freelanceTotal = records
    .filter((r) => r.section === 'freelance')
    .reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Career Hub</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Applications, resumes, skills, freelance work, and professional network.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (tab === 'jobs' ? setJobModal(true) : setRecModal(true))}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {tab === 'jobs' ? 'Add Application' : 'Add Item'}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Applications</p>
          <p className="text-[22px] font-bold tabular-nums mt-0.5">{jobs.length}</p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Active Interviews</p>
          <p className="text-[22px] font-bold tabular-nums text-[var(--sage-dark)] mt-0.5">
            {jobs.filter((j) => j.status === 'Interview').length}
          </p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Freelance Income</p>
          <p className="text-[22px] font-bold tabular-nums mt-0.5">${freelanceTotal.toFixed(0)}</p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Tracked Skills & Docs</p>
          <p className="text-[22px] font-bold tabular-nums mt-0.5">{records.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CAREER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jobs' ? (
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[12px] text-[var(--text-muted)]">
                <th className="py-3 px-4 font-semibold">Company</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Applied Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Link</th>
                <th className="py-3 px-4 font-semibold">Notes</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[13px]">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-[var(--bg-secondary)]/35">
                  <td className="py-3 px-4 font-semibold">{job.company}</td>
                  <td className="py-3 px-4">
                    {job.role}{' '}
                    <span className="text-[11px] text-[var(--text-muted)]">({job.kind})</span>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-[var(--text-secondary)]">
                    {job.appliedDate}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={job.status}
                      onChange={(e) =>
                        updateItem('careerJobs', job.id, {
                          status: e.target.value as CareerJob['status'],
                        })
                      }
                      className={`px-2 py-1 rounded-[6px] text-[12px] font-semibold ${JOB_STATUS_STYLE[job.status]}`}
                    >
                      {(['Interested', 'Applied', 'Interview', 'Rejected', 'Accepted'] as const).map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {job.link && (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--sage-dark)] hover:underline"
                      >
                        Open <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] max-w-[220px] truncate">
                    {job.notes}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => deleteItem('careerJobs', job.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {records
            .filter((r) => r.section === tab)
            .map((rec) => (
              <div
                key={rec.id}
                className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-semibold">{rec.title}</h3>
                    <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                      {rec.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteItem('careerRecords', rec.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[12px] text-[var(--text-muted)] tabular-nums">
                  <span>{rec.meta}</span>
                  <span>
                    {rec.amount ? `$${rec.amount.toFixed(0)} · ` : ''}
                    {rec.date}
                  </span>
                </div>
              </div>
            ))}
          {records.filter((r) => r.section === tab).length === 0 && (
            <div className="col-span-full rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-8 text-center">
              <Briefcase className="w-6 h-6 mx-auto text-[var(--sage-dark)] mb-2" />
              <p className="text-[14px] font-semibold">Nothing added in this section yet.</p>
              <button
                type="button"
                onClick={() => setRecModal(true)}
                className="mt-3 h-[36px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
              >
                Add First Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Job Modal */}
      <Modal open={jobModal} onClose={() => setJobModal(false)} title="Add Application">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('careerJobs', {
              company: company.trim(),
              role: role.trim(),
              kind,
              appliedDate: new Date().toISOString().slice(0, 10),
              status,
              link: link.trim(),
              notes: notes.trim(),
            });
            setCompany('');
            setRole('');
            setLink('');
            setNotes('');
            setJobModal(false);
            notify('Application tracked');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <input
            type="text"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'Job' | 'Internship')}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              <option value="Internship">Internship</option>
              <option value="Job">Job</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CareerJob['status'])}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              <option value="Interested">Interested</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Posting URL"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes / recruiter contact"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setJobModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Record Modal */}
      <Modal open={recModal} onClose={() => setRecModal(false)} title="Add Career Item">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('careerRecords', {
              section: tab === 'jobs' ? 'resume' : tab,
              title: recTitle.trim(),
              subtitle: recSub.trim(),
              meta: recMeta.trim() || 'Active',
              amount: recAmt ? Number(recAmt) : undefined,
              date: new Date().toISOString().slice(0, 10),
            });
            setRecTitle('');
            setRecSub('');
            setRecMeta('');
            setRecAmt('');
            setRecModal(false);
            notify('Career item saved');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={recTitle}
            onChange={(e) => setRecTitle(e.target.value)}
            placeholder="Title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <input
            type="text"
            value={recSub}
            onChange={(e) => setRecSub(e.target.value)}
            placeholder="Subtitle / Role / Details"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="text"
            value={recMeta}
            onChange={(e) => setRecMeta(e.target.value)}
            placeholder="Status / Level / Email"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          {tab === 'freelance' && (
            <input
              type="number"
              value={recAmt}
              onChange={(e) => setRecAmt(e.target.value)}
              placeholder="Amount ($)"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRecModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
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
