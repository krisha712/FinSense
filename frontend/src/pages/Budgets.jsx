import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Plus, Sparkles, Pencil, AlertTriangle, ChevronDown, ChevronUp, Trash2,
  TrendingUp, TrendingDown, Info,
  UtensilsCrossed, Bus, ShoppingBag, Tv, Zap,
  Heart, Home, GraduationCap, Plane, MoreHorizontal, Dumbbell, PawPrint,
  Gift, Coffee, Gamepad2, BookOpen, Briefcase, Shirt, Car, Baby
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import * as api from '@/lib/api';
import Navbar from '@/components/Navbar';
import UserMenu from '@/components/UserMenu';
import logo from '@/assets/logo.png';
import { useTrendMode } from '@/context/TrendModeContext';
import { endOfWeek, formatWeeklyLabel, getWeeksInMonth, startOfWeek } from '@/lib/trendUtils';

const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

const CATEGORY_ICONS = {
  Food: UtensilsCrossed, Transport: Bus, Shopping: ShoppingBag,
  Entertainment: Tv, Utilities: Zap, Healthcare: Heart,
  Rent: Home, Education: GraduationCap, Travel: Plane,
  Savings: Sparkles, Other: MoreHorizontal,
};

const CATEGORY_COLORS = {
  Food: { bg: 'bg-emerald-50', icon: 'text-emerald-600', bar: 'bg-emerald-500' },
  Transport: { bg: 'bg-indigo-50', icon: 'text-indigo-600', bar: 'bg-indigo-500' },
  Shopping: { bg: 'bg-rose-50', icon: 'text-rose-500', bar: 'bg-rose-500' },
  Entertainment: { bg: 'bg-violet-50', icon: 'text-violet-600', bar: 'bg-violet-500' },
  Utilities: { bg: 'bg-amber-50', icon: 'text-amber-600', bar: 'bg-amber-500' },
  Healthcare: { bg: 'bg-pink-50', icon: 'text-pink-500', bar: 'bg-pink-500' },
  Rent: { bg: 'bg-slate-100', icon: 'text-slate-600', bar: 'bg-slate-600' },
  Education: { bg: 'bg-cyan-50', icon: 'text-cyan-600', bar: 'bg-cyan-500' },
  Travel: { bg: 'bg-sky-50', icon: 'text-sky-600', bar: 'bg-sky-500' },
  Savings: { bg: 'bg-lime-50', icon: 'text-lime-600', bar: 'bg-lime-500' },
  Other: { bg: 'bg-gray-100', icon: 'text-gray-500', bar: 'bg-gray-500' },
};

function getCategoryVisual(category) {
  const normalized = (category || '').trim().toLowerCase();
  const smartMatches = [
    { keywords: ['fitness','gym','workout','exercise','training'], icon: Dumbbell, colors: { bg: 'bg-orange-50', icon: 'text-orange-500', bar: 'bg-orange-500' } },
    { keywords: ['pet','pets','dog','cat','vet'], icon: PawPrint, colors: { bg: 'bg-amber-50', icon: 'text-amber-600', bar: 'bg-amber-500' } },
    { keywords: ['gift','gifts'], icon: Gift, colors: { bg: 'bg-pink-50', icon: 'text-pink-500', bar: 'bg-pink-500' } },
    { keywords: ['coffee','cafe'], icon: Coffee, colors: { bg: 'bg-stone-100', icon: 'text-stone-600', bar: 'bg-stone-500' } },
    { keywords: ['gaming','games','movie','movies'], icon: Gamepad2, colors: { bg: 'bg-violet-50', icon: 'text-violet-600', bar: 'bg-violet-500' } },
    { keywords: ['books','reading','library'], icon: BookOpen, colors: { bg: 'bg-cyan-50', icon: 'text-cyan-600', bar: 'bg-cyan-500' } },
    { keywords: ['work','office','career'], icon: Briefcase, colors: { bg: 'bg-slate-100', icon: 'text-slate-600', bar: 'bg-slate-500' } },
    { keywords: ['clothes','fashion','apparel'], icon: Shirt, colors: { bg: 'bg-rose-50', icon: 'text-rose-500', bar: 'bg-rose-500' } },
    { keywords: ['car','fuel','parking'], icon: Car, colors: { bg: 'bg-indigo-50', icon: 'text-indigo-600', bar: 'bg-indigo-500' } },
    { keywords: ['baby','kids','child'], icon: Baby, colors: { bg: 'bg-sky-50', icon: 'text-sky-500', bar: 'bg-sky-500' } },
  ];
  if (CATEGORY_ICONS[category] || CATEGORY_COLORS[category]) {
    return { Icon: CATEGORY_ICONS[category] || MoreHorizontal, colors: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other };
  }
  const match = smartMatches.find(({ keywords }) => keywords.some(k => normalized.includes(k)));
  if (match) return { Icon: match.icon, colors: match.colors };
  return { Icon: MoreHorizontal, colors: CATEGORY_COLORS.Other };
}

function getStatusInfo(pct) {
  if (pct > 100) return { label: 'OVER BUDGET', color: 'bg-red-500 text-white', barOverride: 'bg-red-500' };
  if (pct >= 75) return { label: 'CLOSE TO LIMIT', color: 'bg-amber-100 text-amber-700', barOverride: 'bg-amber-500' };
  return { label: 'ON TRACK', color: 'bg-emerald-100 text-emerald-700', barOverride: null };
}

export default function Budgets() {
  const { trendMode } = useTrendMode();
  const [budgets, setBudgets] = useState([]);
  const [budgetMeta, setBudgetMeta] = useState({});
  const [currentData, setCurrentData] = useState(null);
  const [topInsight, setTopInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustDialog, setAdjustDialog] = useState({ open: false, category: '', limit: '' });
  const [addCategoryDialog, setAddCategoryDialog] = useState({ open: false, category: '', limit: '' });
  const [expandedCards, setExpandedCards] = useState({});

  // Month context
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Rolling budget state
  const [rollingBudget, setRollingBudget] = useState(null);
  const [editBudgetDialog, setEditBudgetDialog] = useState({ open: false, amount: '' });
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => { initContext(); }, []);

  async function initContext() {
    const res = await api.getAvailableMonths();
    const months = res?.data || [];
    const defaultCtx = res?.metadata?.default || {};
    setAvailableMonths(months);
    setSelectedMonth(defaultCtx.month || new Date().getMonth() + 1);
    setSelectedYear(defaultCtx.year || new Date().getFullYear());
  }

  useEffect(() => {
    if (selectedMonth != null && selectedYear != null) {
      loadData(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  // Auto-refresh every 30s to pick up new expenses
  useEffect(() => {
    if (selectedMonth == null || selectedYear == null) return;
    const interval = setInterval(() => loadData(selectedMonth, selectedYear), 30000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  async function loadData(m, y) {
    setLoading(true);
    try {
      const [budgetRes, currentRes, suggestionsRes, rollingRes] = await Promise.all([
        api.getBudgets(m, y),
        api.getCurrentAnalytics(m, y),
        api.getSuggestions(),
        api.getRollingBudget(m, y).catch(() => ({ data: null })),
      ]);
      setBudgets(budgetRes?.data?.budget || []);
      setBudgetMeta(budgetRes?.metadata || {});
      setCurrentData(currentRes);
      setRollingBudget(rollingRes?.data || null);

      const allInsights = suggestionsRes?.data || [];
      const monthComp = allInsights.find(i => i.type === 'month_comparison');
      const catComp = allInsights.find(i => i.type === 'category_comparison');
      setTopInsight(monthComp || catComp || allInsights[0] || null);
    } catch (err) {
      console.error('Error loading budgets:', err);
      toast.error('Failed to load budget data');
    } finally { setLoading(false); }
  }

  async function handleSaveBudget() {
    const amount = parseFloat(editBudgetDialog.amount);
    if (isNaN(amount) || amount < 0) { toast.error('Enter a valid amount'); return; }
    setSavingBudget(true);
    try {
      const res = await api.setRollingBudget(selectedMonth, selectedYear, amount);
      setRollingBudget(res?.data || null);
      setEditBudgetDialog({ open: false, amount: '' });
      toast.success('Budget saved');
    } catch (err) {
      console.error('Save budget error:', err?.response?.status, err?.response?.data);
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to save budget');
    } finally { setSavingBudget(false); }
  }

  function getCategoryExpenses(category) {
    const cats = currentData?.data?.categories || [];
    const cat = cats.find(c => c.category === category);
    return cat?.expenses || [];
  }

  async function handleDeleteExpense(id) {
    try {
      await api.deleteExpense(id);
      toast.success('Expense deleted');
      await loadData(selectedMonth, selectedYear);
    } catch (err) { toast.error('Failed to delete expense'); }
  }

  async function handleCreateCategory() {
    const category = addCategoryDialog.category.trim();
    const limit = parseFloat(addCategoryDialog.limit || '0');
    if (!category) { toast.error('Select a category'); return; }
    if (isNaN(limit) || limit < 0) { toast.error('Enter a valid budget amount'); return; }

    // Validation: total category budgets must not exceed available budget
    if (rb.is_set && rb.available_budget > 0) {
      const existingLimit = budgets.find(b => b.category.toLowerCase() === category.toLowerCase())?.limit || 0;
      const otherCatsTotal = budgets.reduce((s, b) => b.category.toLowerCase() === category.toLowerCase() ? s : s + (b.limit || 0), 0);
      const newTotal = otherCatsTotal + limit;
      if (newTotal > rb.available_budget) {
        toast.error('Budget limit exceeded. Please enter an amount within your remaining available budget.');
        return;
      }
    }

    try {
      await api.postCustomBudgetCategory({ category, limit, month: selectedMonth, year: selectedYear });
      await loadData(selectedMonth, selectedYear);
      setAddCategoryDialog({ open: false, category: '', limit: '' });
      toast.success(`${category} budget updated`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update budget');
    }
  }

  // Derived rolling budget values (fallback to zeros if not set)
  const rb = rollingBudget || {
    budget_amount: 0, carry_forward: 0, available_budget: 0,
    spent: 0, remaining: 0, is_set: false,
  };
  const rbLabel = `${MONTH_NAMES[selectedMonth] || ''} ${selectedYear || ''}`;
  const carryPositive = rb.carry_forward >= 0;
  const rbSpentPct = rb.available_budget > 0 ? Math.min((rb.spent / rb.available_budget) * 100, 100) : 0;
  const rbIsOver = rb.remaining < 0;

  // Category overview totals
  const visibleBudgets = budgets;
  const monthlyLimit = visibleBudgets.reduce((s, b) => s + (b.limit || 0), 0);
  const monthlySpent = visibleBudgets.reduce((s, b) => s + (b.current || 0), 0);
  const visibleExpenses = (currentData?.data?.categories || []).flatMap(cat => cat.expenses || []);
  const referenceDate = visibleExpenses.length > 0
    ? new Date([...visibleExpenses].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
    : new Date(selectedYear || new Date().getFullYear(), (selectedMonth || 1) - 1, 1);
  const weeklyExpenses = visibleExpenses.filter(exp => {
    const date = new Date(exp.date);
    return date >= startOfWeek(referenceDate) && date <= endOfWeek(referenceDate);
  });
  const weeklyLimit = monthlyLimit / getWeeksInMonth(referenceDate);
  const weeklySpent = weeklyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalLimit = trendMode === 'weekly' ? weeklyLimit : monthlyLimit;
  const totalSpent = trendMode === 'weekly' ? weeklySpent : monthlySpent;
  const totalLeft = Math.max(0, totalLimit - totalSpent);
  const utilizationPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const periodLabel = budgetMeta?.label || currentData?.metadata?.label || 'Current';
  const displayPeriodLabel = trendMode === 'weekly' ? formatWeeklyLabel(referenceDate) : periodLabel;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-500">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Toaster position="top-right" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="container mx-auto px-6 sm:px-10 lg:px-14 py-4 flex items-center justify-between gap-5">
          <img src={logo} alt="FinSense logo" className="h-10 object-contain" />
          <Navbar />
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 max-w-6xl">

        {/* TITLE + MONTH PICKER + ADD CATEGORY */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight" data-testid="budget-title">My Budgets</h1>
            <p className="text-lg text-slate-600 mt-2 max-w-md">
              Showing data for <span className="font-semibold text-indigo-600" data-testid="period-label">{displayPeriodLabel}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <Select
              value={`${selectedYear}-${selectedMonth}`}
              onValueChange={(value) => {
                const [y, m] = value.split('-').map(Number);
                setSelectedYear(y); setSelectedMonth(m); setExpandedCards({});
              }}
            >
              <SelectTrigger data-testid="month-picker" className="w-full sm:min-w-[220px] h-12 rounded-2xl border-0 bg-white/90 shadow-[0_14px_35px_rgba(99,102,241,0.14)] text-slate-700 font-semibold px-4 text-base">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-0 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                {availableMonths.map((m) => (
                  <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`} className="rounded-xl">
                    {m.label} ({m.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── ROLLING MONTHLY BUDGET CARD ── */}
        <Card className="rounded-[28px] border-0 bg-white shadow-[0_18px_50px_rgba(99,102,241,0.10)] p-6 sm:p-8 mb-8" data-testid="rolling-budget-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-indigo-500 mb-1">Current Month Budget</p>
              <h2 className="text-2xl font-bold text-slate-900">{rbLabel}</h2>
            </div>
            <button
              onClick={() => setEditBudgetDialog({ open: true, amount: rb.budget_amount > 0 ? rb.budget_amount.toString() : '' })}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors"
              data-testid="edit-budget-btn"
            >
              <Pencil className="w-3 h-3" /> Edit Budget
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {/* Monthly Budget */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Monthly Budget</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(rb.budget_amount)}</p>
            </div>

            {/* Carry Forward */}
            <div className={`rounded-2xl p-4 ${carryPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1">
                {carryPositive
                  ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                  : <TrendingDown className="w-3 h-3 text-red-500" />}
                Carry Forward
              </p>
              <p className={`text-xl font-bold ${carryPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {carryPositive ? '+' : ''}{formatCurrency(rb.carry_forward)}
              </p>
            </div>

            {/* Available Budget */}
            <div className="bg-indigo-50 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Available Budget</p>
              <p className="text-xl font-bold text-indigo-700">{formatCurrency(rb.available_budget)}</p>
            </div>

            {/* Spent */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Spent</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(rb.spent)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Budget Usage</span>
              <span className="text-[11px] font-bold text-slate-500">{rbSpentPct.toFixed(0)}% used</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rbIsOver ? 'bg-red-500' : rbSpentPct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                style={{ width: `${rbSpentPct}%` }}
              />
            </div>
          </div>

          {/* Remaining */}
          <div className={`flex items-center justify-between rounded-2xl px-5 py-4 mb-5 ${rbIsOver ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <span className="text-sm font-semibold text-slate-700">Remaining</span>
            <span className={`text-lg font-bold ${rbIsOver ? 'text-red-600' : 'text-emerald-600'}`}>
              {rbIsOver ? '-' : ''}{formatCurrency(Math.abs(rb.remaining))}
              {rbIsOver && <span className="text-xs font-normal ml-1">(overspent)</span>}
            </span>
          </div>

          {/* Explanations */}
          {!rb.is_set && (
            <div className="mb-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 font-medium">
              No budget set for {rbLabel}. Click "Edit Budget" to set one.
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Unused budget automatically carries forward to the next month.</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-slate-400">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Overspending is deducted from next month's budget.</span>
            </div>
          </div>
        </Card>

        {/* ── OVERVIEW CARD (category totals) ── */}
        <Card className="relative overflow-hidden rounded-[28px] border-0 bg-gradient-to-br from-[#e5dcff] via-[#efe6ff] to-[#e7dcff] p-5 sm:p-8 mb-10 shadow-[0_28px_80px_rgba(109,40,217,0.16)]" data-testid="budget-overview-card">
          <div className="pointer-events-none absolute -top-16 left-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute top-8 right-24 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-8">
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.2em] font-bold text-violet-500 mb-3">
                {trendMode === 'weekly' ? 'Current Week Overview' : 'Current Month Overview'}
              </p>
              <p className="text-[2.75rem] md:text-5xl font-bold text-slate-900 tracking-tight mb-4" data-testid="total-budget-spent">
                {formatCurrency(totalSpent)}
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-400">Usage</span>
                <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-slate-500">{utilizationPct.toFixed(0)}% utilized</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/70 overflow-hidden mb-4 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${utilizationPct > 90 ? 'bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899]' : utilizationPct > 70 ? 'bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#ec4899]' : 'bg-gradient-to-r from-[#5b5fff] via-[#8b5cf6] to-[#d946ef]'}`}
                  style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                  data-testid="usage-bar"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-base">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-slate-700 font-medium" data-testid="total-spent">{formatCurrency(totalSpent)} spent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block" />
                  <span className="text-slate-600" data-testid="total-left">{formatCurrency(totalLeft)} left</span>
                </div>
              </div>
            </div>
            {topInsight && (
              <div className="flex items-start relative" data-testid="weekly-insight-card">
                <div className="bg-gradient-to-br from-white/45 via-violet-200/45 to-fuchsia-200/30 backdrop-blur-sm rounded-[24px] p-5 sm:p-6 w-full border border-white/35 shadow-[0_18px_45px_rgba(139,92,246,0.12)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-bold text-slate-800">Data Insight</span>
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed">{topInsight.message}</p>
                  {topInsight.confidence != null && (
                    <p className="text-[10px] text-indigo-400 mt-3 font-medium">Confidence: {(topInsight.confidence * 100).toFixed(0)}%</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── CATEGORY CARDS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-testid="budget-categories-grid">
          {visibleBudgets.map((budget, idx) => {
            const pct = budget.percentage || 0;
            const status = getStatusInfo(pct);
            const { Icon, colors: catColors } = getCategoryVisual(budget.category);
            const isOver = pct > 100;
            const overAmount = Math.max(0, (budget.current || 0) - (budget.limit || 0));
            const barColor = status.barOverride || catColors.bar;
            return (
              <Card key={budget.category + idx} className="rounded-[24px] border-0 bg-white shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 flex flex-col" data-testid={`budget-card-${budget.category}`}>
                <div className={`h-12 w-12 rounded-2xl ${catColors.bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${catColors.icon}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{budget.category}</h3>
                <p className="text-base text-slate-600 mb-1">{formatCurrency(budget.limit)} Budget</p>
                {budget.is_custom && (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Custom</span>
                )}
                <button
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-500 font-bold uppercase tracking-wider mb-5 hover:text-indigo-700 transition-colors w-fit"
                  onClick={() => setAdjustDialog({ open: true, category: budget.category, limit: budget.limit?.toFixed(0) || '0' })}
                  data-testid={`adjust-${budget.category}`}
                >
                  <Pencil className="w-3 h-3" /> Adjust
                </button>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {isOver ? (
                      <>
                        <p className="text-[11px] text-red-500 font-semibold uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Over by {formatCurrency(overAmount)}</p>
                        <p className="text-xl font-bold text-red-600" data-testid={`spent-${budget.category}`}>{formatCurrency(budget.current)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase">Spent</p>
                        <p className="text-xl font-bold text-slate-900" data-testid={`spent-${budget.category}`}>{formatCurrency(budget.current)}</p>
                      </>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${status.color}`} data-testid={`status-${budget.category}`}>{status.label}</span>
                </div>
                <button
                  className="mt-4 flex items-center justify-center gap-1 text-[11px] text-indigo-500 font-semibold uppercase tracking-wider hover:text-indigo-700 transition-colors w-full py-2 rounded-xl hover:bg-indigo-50"
                  onClick={() => setExpandedCards(prev => ({ ...prev, [budget.category]: !prev[budget.category] }))}
                  data-testid={`toggle-expenses-${budget.category}`}
                >
                  {expandedCards[budget.category] ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Expenses</> : <><ChevronDown className="w-3.5 h-3.5" /> Show Expenses</>}
                </button>
                {expandedCards[budget.category] && (() => {
                  const expenses = getCategoryExpenses(budget.category);
                  return (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-1 max-h-52 overflow-y-auto" data-testid={`expense-list-${budget.category}`}>
                      {expenses.length > 0 ? expenses.slice(0, 20).map(exp => (
                        <div key={exp.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 group text-xs">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-medium text-slate-800 truncate">{exp.description}</p>
                            <p className="text-slate-400 text-[10px]">{exp.date}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-semibold text-slate-700">{formatCurrency(exp.amount)}</span>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-600 p-1 rounded" onClick={() => handleDeleteExpense(exp.id)} data-testid={`delete-exp-${exp.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )) : <p className="text-xs text-slate-400 text-center py-3">No expenses in {periodLabel}</p>}
                      {expenses.length > 20 && <p className="text-[10px] text-slate-400 text-center pt-1">Showing 20 of {expenses.length}</p>}
                    </div>
                  );
                })()}
              </Card>
            );
          })}
          {visibleBudgets.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-slate-400 mb-2">No budget data available</p>
              <p className="text-sm text-slate-500">Add expenses from the Dashboard to auto-generate budgets</p>
            </div>
          )}
        </div>

        {visibleBudgets.length > 0 && (
          <div className="mt-10 p-5 bg-indigo-50/50 rounded-2xl text-center">
            <p className="text-xs text-slate-500">
              {budgetMeta.method_label || 'Budget = historical monthly mean + 1 std deviation'}.
              Based on {budgets[0]?.months_of_data || 0}+ months of data.
            </p>
          </div>
        )}
      </main>

      {/* EDIT MONTHLY BUDGET DIALOG */}
      <Dialog open={editBudgetDialog.open} onOpenChange={open => setEditBudgetDialog(d => ({ ...d, open }))}>
        <DialogContent className="rounded-[24px]" data-testid="edit-budget-dialog">
          <DialogHeader><DialogTitle>Set Budget for {rbLabel}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="rb-amount">Monthly Budget Amount (₹)</Label>
              <Input
                id="rb-amount"
                type="number"
                min="0"
                step="0.01"
                value={editBudgetDialog.amount}
                onChange={e => setEditBudgetDialog(d => ({ ...d, amount: e.target.value }))}
                placeholder="e.g. 20000"
                data-testid="budget-amount-input"
              />
            </div>
            {rb.carry_forward !== 0 && (
              <div className={`text-xs rounded-xl p-3 ${rb.carry_forward > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {rb.carry_forward > 0
                  ? `+${formatCurrency(rb.carry_forward)} surplus will carry forward from last month`
                  : `${formatCurrency(Math.abs(rb.carry_forward))} overspend from last month will be deducted`}
              </div>
            )}
            <Button
              className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl"
              onClick={handleSaveBudget}
              disabled={savingBudget}
              data-testid="save-budget-btn"
            >
              {savingBudget ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD CATEGORY DIALOG */}
      <Dialog open={addCategoryDialog.open} onOpenChange={open => setAddCategoryDialog(d => ({ ...d, open }))}>
        <DialogContent className="rounded-[24px]" data-testid="add-category-dialog">
          <DialogHeader><DialogTitle>Update Category Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Available budget info */}
            {rb.is_set && rb.available_budget > 0 && (() => {
              const selectedLimit = parseFloat(addCategoryDialog.limit || '0') || 0;
              const existingLimit = budgets.find(b => b.category.toLowerCase() === (addCategoryDialog.category || '').toLowerCase())?.limit || 0;
              const otherTotal = budgets.reduce((s, b) => b.category.toLowerCase() === (addCategoryDialog.category || '').toLowerCase() ? s : s + (b.limit || 0), 0);
              const newTotal = otherTotal + selectedLimit;
              const remainingAfter = rb.available_budget - newTotal;
              const isExceeded = newTotal > rb.available_budget;
              return (
                <div className={`rounded-xl p-3 text-xs ${isExceeded ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isExceeded
                    ? `Budget limit exceeded. Please enter an amount within your remaining available budget.`
                    : `Available: ${formatCurrency(rb.available_budget)} — Allocated: ${formatCurrency(newTotal)} — Remaining: ${formatCurrency(remainingAfter)}`}
                </div>
              );
            })()}
            <div>
              <Label htmlFor="new-category-select">Category</Label>
              <Select
                value={addCategoryDialog.category}
                onValueChange={val => setAddCategoryDialog(d => ({ ...d, category: val }))}
              >
                <SelectTrigger id="new-category-select" data-testid="new-category-name-input">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Food','Transport','Shopping','Entertainment','Utilities',
                    'Healthcare','Rent','Education','Travel','Fitness','Pets','Savings','Other',
                    ...budgets.map(b => b.category)
                  ]
                    .filter((c, i, arr) => arr.indexOf(c) === i)
                    .sort()
                    .map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-category-limit">Budget Limit (₹)</Label>
              <Input
                id="new-category-limit"
                type="number"
                min="0"
                step="0.01"
                value={addCategoryDialog.limit}
                onChange={e => setAddCategoryDialog(d => ({ ...d, limit: e.target.value }))}
                placeholder="0.00"
                data-testid="new-category-limit-input"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl disabled:opacity-50"
              onClick={handleCreateCategory}
              disabled={(() => {
                if (!rb.is_set || rb.available_budget <= 0) return false;
                const selectedLimit = parseFloat(addCategoryDialog.limit || '0') || 0;
                const otherTotal = budgets.reduce((s, b) => b.category.toLowerCase() === (addCategoryDialog.category || '').toLowerCase() ? s : s + (b.limit || 0), 0);
                return otherTotal + selectedLimit > rb.available_budget;
              })()}
              data-testid="create-category-btn"
            >
              Update Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADJUST CATEGORY BUDGET DIALOG */}
      <Dialog open={adjustDialog.open} onOpenChange={open => setAdjustDialog(a => ({ ...a, open }))}>
        <DialogContent className="rounded-[24px]" data-testid="adjust-budget-dialog">
          <DialogHeader><DialogTitle>Adjust {adjustDialog.category} Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {rb.is_set && rb.available_budget > 0 && (() => {
              const newLimit = parseFloat(adjustDialog.limit || '0') || 0;
              const otherTotal = budgets.reduce((s, b) => b.category.toLowerCase() === adjustDialog.category.toLowerCase() ? s : s + (b.limit || 0), 0);
              const newTotal = otherTotal + newLimit;
              const isExceeded = newTotal > rb.available_budget;
              return (
                <div className={`rounded-xl p-3 text-xs ${isExceeded ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isExceeded
                    ? 'Budget limit exceeded. Please enter an amount within your remaining available budget.'
                    : `Available: ${formatCurrency(rb.available_budget)} — Allocated: ${formatCurrency(newTotal)} — Remaining: ${formatCurrency(rb.available_budget - newTotal)}`}
                </div>
              );
            })()}
            <div>
              <Label htmlFor="new-limit">New Budget Limit (₹)</Label>
              <Input id="new-limit" type="number" min="0" step="0.01" value={adjustDialog.limit} onChange={e => setAdjustDialog(a => ({ ...a, limit: e.target.value }))} data-testid="adjust-limit-input" />
            </div>
            <Button
              className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl disabled:opacity-50"
              disabled={(() => {
                if (!rb.is_set || rb.available_budget <= 0) return false;
                const newLimit = parseFloat(adjustDialog.limit || '0') || 0;
                const otherTotal = budgets.reduce((s, b) => b.category.toLowerCase() === adjustDialog.category.toLowerCase() ? s : s + (b.limit || 0), 0);
                return otherTotal + newLimit > rb.available_budget;
              })()}
              onClick={async () => {
                const limit = parseFloat(adjustDialog.limit);
                if (isNaN(limit) || limit < 0) { toast.error('Enter a valid amount'); return; }
                if (rb.is_set && rb.available_budget > 0) {
                  const otherTotal = budgets.reduce((s, b) => b.category.toLowerCase() === adjustDialog.category.toLowerCase() ? s : s + (b.limit || 0), 0);
                  if (otherTotal + limit > rb.available_budget) {
                    toast.error('Budget limit exceeded. Please enter an amount within your remaining available budget.');
                    return;
                  }
                }
                try {
                  await api.postCustomBudgetCategory({ category: adjustDialog.category, limit, month: selectedMonth, year: selectedYear });
                  await loadData(selectedMonth, selectedYear);
                  setAdjustDialog({ open: false, category: '', limit: '' });
                  toast.success(`${adjustDialog.category} budget updated to ${formatCurrency(limit)}`);
                } catch (err) {
                  toast.error(err?.response?.data?.detail || 'Failed to update budget');
                }
              }}
              data-testid="adjust-save-btn"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-50" data-testid="fab-add">
        <button onClick={() => setAddCategoryDialog({ open: true, category: '', limit: '' })} className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-300/50 flex items-center justify-center hover:scale-105 transition-transform">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
