import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import Footer from '@/components/Footer';

const steps = [
  { num: '01', title: 'Add Expenses', desc: 'Log transactions manually, by voice, or scan a receipt with OCR.' },
  { num: '02', title: 'AI Analysis', desc: 'System analyses patterns and builds personalised insights.' },
  { num: '03', title: 'View Insights', desc: 'Review spending trends, anomalies, and budget health.' },
  { num: '04', title: 'Forecast Future', desc: 'Get 30-day AI-powered spending forecasts to plan ahead.' },
];

const features = [
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'AI-Powered Analysis',
    desc: 'Automated anomaly detection and intelligent spending assessment powered by machine learning.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Smart Forecasting',
    desc: 'LSTM neural network predicts your next 30 days of spending based on historical patterns.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Smart Budgets',
    desc: 'Budgets auto-generated from your historical spending — not arbitrary limits.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Receipt OCR',
    desc: 'Scan any receipt photo — amount, date, and category are extracted automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Group Expenses',
    desc: 'Split bills with friends, track who owes whom, and settle debts automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure Auth',
    desc: 'JWT authentication with Google Sign-In support. Your data stays private.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home">
            <img src={logo} alt="FinSense" className="h-10 object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/home" className="text-indigo-600 font-semibold">Home</Link>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link>
            <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="text-center py-24 px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Take Control of Your <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Financial Future
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            AI-powered expense tracking, smart budgets, 30-day forecasting, and group expense splitting —
            all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors"
            >
              Start for Free
            </Link>
            <Link
              to="/about"
              className="border border-white/30 hover:border-white/60 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6 bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-14">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-20 px-6 bg-[#f5f7fb]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-14">Key Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-indigo-600 text-white text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to take control?</h2>
          <p className="text-indigo-200 mb-8 max-w-xl mx-auto">
            Join thousands of users managing their finances smarter with FinSense.
          </p>
          <Link
            to="/login"
            className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
          >
            Get Started Free →
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
