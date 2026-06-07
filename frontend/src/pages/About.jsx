import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home">
            <img src={logo} alt="FinSense" className="h-10 object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/home" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link to="/about" className="text-indigo-600 font-semibold">About</Link>
            <Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="text-center py-20 px-6 bg-white border-b border-slate-100">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">About FinSense</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Transforming personal finance management through intelligent analysis and data-driven insights
          </p>
        </section>

        {/* Mission + What is FinFusion */}
        <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              FinSense is designed to empower individuals with data-driven insights and smart recommendations
              to improve their financial health. We leverage AI to analyze spending patterns and provide
              actionable roadmaps for sustainable financial growth.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">What is FinSense?</h2>
            <p className="text-slate-600 leading-relaxed">
              FinSense is an AI-powered personal finance platform that tracks your expenses, forecasts future
              spending using LSTM models, generates smart budgets from historical data, and provides deep
              insights into your financial behaviour — all in one place.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white border-t border-slate-100 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Our Core Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '🔒', title: 'Privacy First', desc: 'Your financial data stays on your device. We never sell personal data.' },
                { icon: '🤖', title: 'AI-Powered', desc: 'Machine learning models that learn from your spending patterns over time.' },
                { icon: '📊', title: 'Data Transparency', desc: 'Every insight is backed by real numbers — no vague suggestions.' },
                { icon: '⚡', title: 'Real-Time', desc: 'Instant analytics as you add expenses, not end-of-month surprises.' },
                { icon: '🎯', title: 'Goal-Oriented', desc: 'Smart budgets that adapt to your actual spending history.' },
                { icon: '🤝', title: 'Collaborative', desc: 'Group expense splitting so finances stay fair with friends and family.' },
              ].map((v) => (
                <div key={v.title} className="bg-[#f5f7fb] rounded-2xl p-6 border border-slate-100">
                  <div className="text-3xl mb-3">{v.icon}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Built by Students, for Everyone</h2>
          <p className="text-slate-500 max-w-xl mx-auto mb-10">
            FinSense was created by the AIML Department at CSPIT, CHARUSAT as a capstone project
            in AI-powered finance.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get in Touch →
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
