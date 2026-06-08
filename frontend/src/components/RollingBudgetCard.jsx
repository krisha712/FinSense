import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import * as api from '@/lib/api';

export default function RollingBudgetCard({ month, year, onBudgetChange, data: externalData }) {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(!externalData);
  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getRollingBudget(month, year);
      setBudgetData(res?.data || null);
    } catch (e) {
      console.error('RollingBudgetCard load error:', e);
      setBudgetData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // Only self-fetch if no external data provided
  useEffect(() => {
    if (!externalData) load();
  }, [load, externalData]);

  // Use external data when provided (keeps in sync with parent)
  const activeData = externalData || budgetData;

  async function handleSave() {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      const res = await api.setRollingBudget(month, year, amount);
      setBudgetData(res?.data || null);
      setEditOpen(false);
      toast.success('Budget updated');
      if (onBudgetChange) onBudgetChange();
    } catch (e) {
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  }

  function openEdit() {
    setEditAmount(activeData?.budget_amount?.toString() || '');
    setEditOpen(true);
  }

  if (loading && !externalData) {
    return (
      <Card className="rounded-[24px] border-0 bg-white shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-8 bg-slate-100 rounded w-1/2 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </Card>
    );
  }

  const d = activeData ?? {
    month,
    year,
    label: `${['','January','February','March','April','May','June','July','August','September','October','November','December'][month]} ${year}`,
    budget_amount: 0,
    carry_forward: 0,
    available_budget: 0,
    spent: 0,
    remaining: 0,
    is_set: false,
  };

  const carryPositive = d.carry_forward >= 0;
  const spentPct = d.available_budget > 0 ? Math.min((d.spent / d.available_budget) * 100, 100) : 0;
  const isOver = d.remaining < 0;

  return (
    <>
      <Card className="rounded-[24px] border-0 bg-white shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Monthly Budget</p>
            <p className="text-xs text-slate-400 mt-0.5">{d.label}</p>
          </div>
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
            data-testid="edit-budget-btn"
          >
            <Pencil className="w-3 h-3" /> Edit Budget
          </button>
        </div>

        {/* Stats grid */}
        <div className="space-y-3 mb-5">
          <StatRow label="Monthly Budget" value={formatCurrency(d.budget_amount)} />

          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2">
              {carryPositive
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
              <span className="text-xs text-slate-600 font-medium">Carry Forward</span>
            </div>
            <span className={`text-sm font-bold ${carryPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {carryPositive ? '+' : ''}{formatCurrency(d.carry_forward)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-indigo-50">
            <span className="text-xs text-slate-700 font-semibold">Available Budget</span>
            <span className="text-sm font-bold text-indigo-700">{formatCurrency(d.available_budget)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Usage</span>
            <span className="text-[11px] font-bold text-slate-500">{spentPct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOver ? 'bg-red-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${spentPct}%` }}
            />
          </div>
        </div>

        {/* Spent / Remaining */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Spent</p>
            <p className="text-base font-bold text-slate-900">{formatCurrency(d.spent)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${isOver ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Remaining</p>
            <p className={`text-base font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(Math.abs(d.remaining))}{isOver ? ' over' : ''}
            </p>
          </div>
        </div>

        {/* Explanations */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-300" />
            <span>Unused budget automatically carries forward.</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-300" />
            <span>Overspending is deducted from next month's budget.</span>
          </div>
        </div>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-[24px]" data-testid="edit-budget-dialog">
          <DialogHeader>
            <DialogTitle>Set Budget for {d.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="budget-amount">Monthly Budget Amount</Label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                placeholder="0.00"
                data-testid="budget-amount-input"
              />
            </div>
            {d.carry_forward !== 0 && (
              <div className={`text-xs rounded-xl p-3 ${d.carry_forward > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {d.carry_forward > 0
                  ? `+${formatCurrency(d.carry_forward)} will carry forward from last month`
                  : `${formatCurrency(Math.abs(d.carry_forward))} overspend will be deducted from this month`}
              </div>
            )}
            <Button
              className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl"
              onClick={handleSave}
              disabled={saving}
              data-testid="save-budget-btn"
            >
              {saving ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50">
      <span className="text-xs text-slate-600 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
