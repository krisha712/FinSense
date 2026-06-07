import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import UserMenu from '@/components/UserMenu';
import logo from '@/assets/logo.png';
import { Brain, Wallet, TrendingUp, Shield, Users, Target, Zap, BarChart2, Heart } from 'lucide-react';

export default function AboutDashboard() {
  const navigate = useNavigate();

  const features = [
    { icon: Brain,     title: 'AI-Powered Insights',         desc: 'Machine learning models analyze your spending patterns and deliver personalized financial recommendations.' },
    { icon: TrendingUp, title: 'LSTM Forecasting',           desc: 'Predict future expenses using deep learning models trained on your personal transaction history.' },
    { icon: Wallet,    title: 'Smart Budget Management',     desc: 'Auto-generate budgets from historical data and track your progress in real time.' },
    { icon: BarChart2, title: 'Detailed Analytics',          desc: 'Visualize spending by category, compare months, and spot trends at a glance.' },
    { icon: Users,     title: 'Group Expense Splitting',     desc: 'Manage shared expenses with friends and family — fair splits, zero confusion.' },
    { icon: Shield,    title: 'Privacy First',               desc: 'Your financial data is yours. We never sell or share personal information with third parties.' },
  ];

  const values = [
    { emoji: '🔒', title: 'Privacy First',      desc: 'Your financial data stays secure. We never sell personal data.' },
    { emoji: '🤖', title: 'AI-Powered',         desc: 'Models that learn from your spending patterns over time.' },
    { emoji: '📊', title: 'Data Transparency',  desc: 'Every insight is backed by real numbers — no vague suggestions.' },
    { emoji: '⚡', title: 'Real-Time',          desc: 'Instant analytics as you add expenses, not end-of-month surprises.' },
    { emoji: '🎯', title: 'Goal-Oriented',      desc: 'Smart budgets that adapt to your actual spending history.' },
    { emoji: '🤝', title: 'Collaborative',      desc: 'Group expense splitting so finances stay fair with friends and family.' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb]">

      {/* Header — matches dashboard */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <img
            src={logo}
            alt="FinSense"
            className="h-9 object-contain cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          />
          <Navbar />
          <UserMenu />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Hero */}
        <section className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 mb-5">
            <Heart size={28} className="text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">About FinSense</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Transforming personal finance management through intelligent analysis and data-driven insights.
          </p>
        </section>

        {/* Mission + What is FinSense */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <Zap size={18} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              FinSense is designed to empower individuals with data-driven insights and smart recommendations
              to improve their financial health. We leverage AI to analyze spending patterns and provide
              actionable roadmaps for sustainable financial growth.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <Target size={18} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">What is FinSense?</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              FinSense is an AI-powered personal finance platform that tracks your expenses, forecasts future
              spending using LSTM models, generates smart budgets from historical data, and provides deep
              insights into your financial behaviour — all in one place.
            </p>
          </div>
        </section>

        {/* Key Features */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Our Core Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-[#f5f7fb] rounded-2xl p-5 border border-slate-100">
                <div className="text-2xl mb-2">{v.emoji}</div>
                <h3 className="font-semibold text-slate-900 mb-1 text-sm">{v.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built by */}
        <section className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Built by Students, for Everyone</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            FinSense was created by the AIML Department at CSPIT, CHARUSAT as a capstone project
            in AI-powered personal finance.
          </p>
        </section>

      </main>
    </div>
  );
}
