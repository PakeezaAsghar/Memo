import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  PiggyBank,
  Plus,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Modal } from '../components/ui/Modal';

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Education',
  'Shopping',
  'Bills',
  'Entertainment',
  'Other',
];

const CAT_COLORS: Record<string, string> = {
  Food: '#89977A',
  Transport: '#8294B2',
  Education: '#8E7FA8',
  Shopping: '#C98F91',
  Bills: '#C79B55',
  Entertainment: '#A3B195',
  Other: '#B8AFA1',
};

export function FinancePage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const transactions = workspace?.transactions || [];
  const budgets = workspace?.budgets || [];
  const savingsGoals = workspace?.savingsGoals || [];

  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [catFilter, setCatFilter] = useState('All');
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  // Tx form
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txRecurring, setTxRecurring] = useState(false);

  // Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDate, setGoalDate] = useState('2027-05-01');

  const monthlyTx = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (!monthFilter || t.date.startsWith(monthFilter)) &&
          (catFilter === 'All' || t.category === catFilter)
      ),
    [transactions, monthFilter, catFilter]
  );

  const monthlyExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense' && (!monthFilter || t.date.startsWith(monthFilter)))
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, monthFilter]
  );

  const monthlyIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income' && (!monthFilter || t.date.startsWith(monthFilter)))
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, monthFilter]
  );

  const totalBudgetLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const remainingBudget = Math.max(0, totalBudgetLimit - monthlyExpenses);
  const totalSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);

  // Donut breakdown
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && (!monthFilter || t.date.startsWith(monthFilter)))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    let offset = 0;
    return Object.entries(map).map(([cat, value]) => {
      const pct = (value / total) * 100;
      const seg = { cat, value, pct, offset, color: CAT_COLORS[cat] || '#89977A' };
      offset += pct;
      return seg;
    });
  }, [transactions, monthFilter]);

  // Last 6 months spending series
  const monthlySeries = useMemo(() => {
    const base = new Date(`${monthFilter}-01T12:00:00`);
    const out: Array<{ ym: string; label: string; expense: number; income: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const exp = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(ym))
        .reduce((s, t) => s + t.amount, 0);
      const inc = transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(ym))
        .reduce((s, t) => s + t.amount, 0);
      out.push({
        ym,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        expense: exp,
        income: inc,
      });
    }
    return out;
  }, [transactions, monthFilter]);

  const maxChartVal = Math.max(
    100,
    ...monthlySeries.flatMap((m) => [m.expense, m.income])
  );

  const exportCsv = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Recurring'].join(','),
      ...monthlyTx.map((t) =>
        [
          t.date,
          t.type,
          t.category,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount.toFixed(2),
          t.recurring ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `memo-finance-${monthFilter || 'all'}.csv`;
    a.click();
    notify('CSV report exported');
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(txAmount);
    if (!amt || amt <= 0) return;
    await addItem('transactions', {
      type: txType,
      amount: amt,
      category: txCategory,
      description: txDesc.trim() || txCategory,
      date: txDate,
      recurring: txRecurring,
    });
    setTxModalOpen(false);
    setTxAmount('');
    setTxDesc('');
    notify(txType === 'expense' ? 'Expense logged' : 'Income logged');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Finance</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Track. Budget. Save.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filter month"
            className="h-[38px] px-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] tabular-nums"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setTxModalOpen(true)}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* 4 Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Monthly Expenses</p>
          <p className="text-[24px] font-bold tabular-nums text-[var(--text-main)] mt-1">
            ${monthlyExpenses.toFixed(2)}
          </p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Monthly Income</p>
          <p className="text-[24px] font-bold tabular-nums text-[var(--sage-dark)] mt-1">
            ${monthlyIncome.toFixed(2)}
          </p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Total Savings</p>
          <p className="text-[24px] font-bold tabular-nums text-[var(--text-main)] mt-1">
            ${totalSavings.toFixed(2)}
          </p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Remaining Budget</p>
          <p className="text-[24px] font-bold tabular-nums text-[var(--text-main)] mt-1">
            ${remainingBudget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut chart */}
        <div className="lg:col-span-5 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
          <h2 className="text-[16px] font-semibold mb-4">Expense Breakdown</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <svg width="160" height="160" viewBox="0 0 42 42" className="shrink-0">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="var(--bg-secondary)"
                strokeWidth="5"
              />
              {breakdown.map((seg) => (
                <circle
                  key={seg.cat}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="5"
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                  strokeDashoffset={25 - seg.offset}
                />
              ))}
              <text
                x="21"
                y="21.5"
                textAnchor="middle"
                className="fill-[var(--text-main)] text-[4.5px] font-bold tabular-nums"
              >
                ${Math.round(monthlyExpenses)}
              </text>
            </svg>
            <div className="flex-1 w-full space-y-2">
              {breakdown.length === 0 ? (
                <p className="text-[13px] text-[var(--text-secondary)]">No expenses this month.</p>
              ) : (
                breakdown.map((seg) => (
                  <div key={seg.cat} className="flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span>{seg.cat}</span>
                    </span>
                    <span className="font-semibold tabular-nums">${seg.value.toFixed(0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Monthly Spending Graph */}
        <div className="lg:col-span-7 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold">Monthly Income vs. Spending</h2>
            <div className="flex items-center gap-4 text-[11.5px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--sage)]" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--rose)]" /> Expenses
              </span>
            </div>
          </div>
          <div className="h-[180px] flex items-end justify-between gap-3 pt-4">
            {monthlySeries.map((m) => (
              <div key={m.ym} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-[138px]">
                  <div
                    className="w-4 sm:w-5 rounded-t-[4px] bg-[var(--sage)] transition-all"
                    style={{ height: `${Math.max(4, (m.income / maxChartVal) * 100)}%` }}
                    title={`Income: $${m.income}`}
                  />
                  <div
                    className="w-4 sm:w-5 rounded-t-[4px] bg-[var(--rose)] transition-all"
                    style={{ height: `${Math.max(4, (m.expense / maxChartVal) * 100)}%` }}
                    title={`Expense: $${m.expense}`}
                  />
                </div>
                <span className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Categories + Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5">
          <h2 className="text-[16px] font-semibold">Budget Categories</h2>
          <div className="space-y-3">
            {budgets.map((b) => {
              const spent = transactions
                .filter(
                  (t) =>
                    t.type === 'expense' &&
                    t.category === b.category &&
                    (!monthFilter || t.date.startsWith(monthFilter))
                )
                .reduce((s, t) => s + t.amount, 0);
              const pct = b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0;
              const over = spent > b.limit;
              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{b.category}</span>
                    <div className="flex items-center gap-2 tabular-nums">
                      <span className={over ? 'text-[var(--error)] font-semibold' : ''}>
                        ${spent.toFixed(0)} /
                      </span>
                      <input
                        type="number"
                        value={b.limit}
                        onChange={(e) =>
                          updateItem('budgets', b.id, { limit: Math.max(0, Number(e.target.value)) })
                        }
                        aria-label={`${b.category} limit`}
                        className="w-20 h-7 px-2 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-color)] text-right text-[12px]"
                      />
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-[var(--error)]' : 'bg-[var(--sage)]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-[var(--sage-dark)]" />
              <h2 className="text-[16px] font-semibold">Savings Goals</h2>
            </div>
            <button
              type="button"
              onClick={() => setGoalModalOpen(true)}
              className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
            >
              + New goal
            </button>
          </div>
          <div className="space-y-3">
            {savingsGoals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              return (
                <div
                  key={g.id}
                  className="p-3.5 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-semibold">{g.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem('savingsGoals', g.id, {
                          currentAmount: Math.min(g.targetAmount, g.currentAmount + 50),
                        })
                      }
                      className="text-[11.5px] px-2 py-0.5 rounded-[6px] bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold"
                    >
                      +$50
                    </button>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--sage)]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11.5px] text-[var(--text-secondary)] tabular-nums">
                    <span>
                      ${g.currentAmount.toFixed(0)} of ${g.targetAmount.toFixed(0)}
                    </span>
                    <span>Target {g.targetDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-[16px] font-semibold">Recent Transactions</h2>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-[36px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[12.5px]"
          >
            <option value="All">All categories</option>
            {[...EXPENSE_CATEGORIES, 'Salary', 'Freelance'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-[var(--border-color)]">
          {monthlyTx.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[var(--text-secondary)]">
              No transactions for this period.
            </p>
          ) : (
            monthlyTx.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                        : 'bg-[var(--blush)]/60 text-[#8A4E50]'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold truncate">{tx.description}</p>
                    <p className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                      {tx.category} · {tx.date}
                      {tx.recurring ? ' · Recurring' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[14px] font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-[var(--sage-dark)]' : 'text-[var(--text-main)]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteItem('transactions', tx.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Add Transaction"
      >
        <form onSubmit={handleAddTx} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-[9px] bg-[var(--bg-secondary)]">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTxType(t);
                  setTxCategory(t === 'income' ? 'Freelance' : 'Food');
                }}
                className={`py-2 rounded-[7px] text-[13px] font-semibold capitalize ${
                  txType === t ? 'bg-[var(--bg-card)] text-[var(--text-main)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="24.50"
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              >
                {txType === 'expense' ? (
                  EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder="Cafe study session"
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={txRecurring}
              onChange={(e) => setTxRecurring(e.target.checked)}
              className="accent-[var(--sage)]"
            />
            Recurring monthly transaction
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTxModalOpen(false)}
              className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* Savings Goal Modal */}
      <Modal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="New Savings Goal"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('savingsGoals', {
              title: goalTitle.trim(),
              targetAmount: Number(goalTarget) || 1000,
              currentAmount: Number(goalCurrent) || 0,
              targetDate: goalDate,
            });
            setGoalTitle('');
            setGoalTarget('');
            setGoalCurrent('');
            setGoalModalOpen(false);
            notify('Savings goal created');
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Goal title
            </label>
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Target ($)
              </label>
              <input
                type="number"
                required
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Saved so far ($)
              </label>
              <input
                type="number"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Target date
            </label>
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setGoalModalOpen(false)}
              className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
            >
              Save Goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
