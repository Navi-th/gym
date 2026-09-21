"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell,
  Zap,
  Flame,
  ShieldCheck,
  Trophy,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Globe,
  ChevronRight,
  Activity,
  Award
} from "lucide-react";

export function HomePage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [bmiHeight, setBmiHeight] = useState<string>("175");
  const [bmiWeight, setBmiWeight] = useState<string>("70");
  const [bmiResult, setBmiResult] = useState<{ score: string; status: string } | null>(null);
  const [edgeStatus, setEdgeStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setEdgeStatus(data))
      .catch(() => setEdgeStatus({ status: "local-dev", platform: "Next.js Dev Server" }));
  }, []);

  const calculateBmi = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(bmiHeight) / 100;
    const w = parseFloat(bmiWeight);
    if (h > 0 && w > 0) {
      const score = (w / (h * h)).toFixed(1);
      let status = "Normal weight";
      const scoreNum = parseFloat(score);
      if (scoreNum < 18.5) status = "Underweight";
      else if (scoreNum >= 25 && scoreNum < 29.9) status = "Overweight";
      else if (scoreNum >= 30) status = "Obese";
      setBmiResult({ score, status });
    }
  };

  const programs = [
    { id: "hypertrophy", category: "strength", title: "Hypertrophy Elite", duration: "60 mins", intensity: "High", trainer: "Alex Vance", tag: "Most Popular" },
    { id: "hiit-burn", category: "cardio", title: "360 Inferno HIIT", duration: "45 mins", intensity: "Maximum", trainer: "Elena Rostova", tag: "High Burn" },
    { id: "crossfit-core", category: "strength", title: "Metabolic Conditioning", duration: "50 mins", intensity: "High", trainer: "Marcus Cole", tag: "Strength" },
    { id: "functional", category: "mobility", title: "Mobility & Recovery", duration: "40 mins", intensity: "Moderate", trainer: "Sarah Chen", tag: "Recovery" },
  ];

  const filteredPrograms = activeTab === "all" ? programs : programs.filter((p) => p.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 selection:bg-rose-600 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-600 to-amber-600 text-xs font-semibold py-2 px-4 text-center text-white flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>Deployed on Cloudflare Workers • Edge Speed & Instant Global Delivery</span>
        {edgeStatus?.platform && (
          <span className="ml-2 bg-black/40 px-2 py-0.5 rounded-full border border-white/20 text-[10px]">
            {edgeStatus.platform}
          </span>
        )}
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center glow-pink">
              <Dumbbell className="w-6 h-6 text-white transform -rotate-12" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-rose-400">
              PULSE<span className="text-rose-500">GYM</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-rose-400 transition-colors">Features</a>
            <a href="#programs" className="hover:text-rose-400 transition-colors">Programs</a>
            <a href="#calculator" className="hover:text-rose-400 transition-colors">BMI Calculator</a>
            <a href="#pricing" className="hover:text-rose-400 transition-colors">Membership</a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="#pricing"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 transition-all shadow-lg shadow-rose-900/30 hover:scale-105"
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-hero-pattern">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                <span>Transform Your Body & Mind</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
                FORGE YOUR <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400">
                  ULTIMATE SELF
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                State-of-the-art strength training, biometric tracking, and elite coaching delivered with ultra-fast edge performance.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#pricing"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-900/40 hover:translate-y-[-2px]"
                >
                  <span>Claim 7-Day Pass</span>
                  <ArrowRight className="w-5 h-5" />
                </a>

                <a
                  href="#calculator"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-200 glass-card hover:bg-slate-800/60 transition-all flex items-center justify-center gap-2 border border-slate-700/50"
                >
                  <span>Calculate Fitness Index</span>
                </a>
              </div>

              {/* Stats Bar */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-3xl font-extrabold text-white">2,500+</div>
                  <div className="text-xs text-slate-400 mt-1">Active Athletes</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-rose-400">99.9%</div>
                  <div className="text-xs text-slate-400 mt-1">Cloud Edge Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">45+</div>
                  <div className="text-xs text-slate-400 mt-1">Pro Coaches</div>
                </div>
              </div>
            </div>

            {/* Feature Highlights Card */}
            <div className="lg:col-span-5">
              <div className="glass-panel p-8 rounded-3xl border border-white/10 relative shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Performance Edge</span>
                  <Activity className="w-5 h-5 text-rose-500" />
                </div>

                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Real-time Biometrics</h4>
                      <p className="text-xs text-slate-400 mt-1">Sync your workout stats directly to your mobile app with latency-free sync.</p>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Elite Personal Trainers</h4>
                      <p className="text-xs text-slate-400 mt-1">Tailored workout plans designed by IFBB pros and Olympic conditioning coaches.</p>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Global Access</h4>
                      <p className="text-xs text-slate-400 mt-1">Use your pass in over 120 partner facilities worldwide seamlessly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-slate-950/60 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">TRAINING PROGRAMS</h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">Designed for every fitness goal, from explosive strength to recovery.</p>
            
            {/* Category Filter */}
            <div className="flex justify-center gap-2 mt-6">
              {["all", "strength", "cardio", "mobility"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    activeTab === cat
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-900/40"
                      : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {program.tag}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {program.duration}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">Led by Master Coach <strong className="text-slate-200">{program.trainer}</strong></p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Intensity: <span className="text-white">{program.intensity}</span></span>
                  <button className="p-2 rounded-lg bg-rose-600/20 text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive BMI Calculator */}
      <section id="calculator" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Instant Biometric Check</span>
                <h3 className="text-3xl font-black text-white mt-1">BMI & Fitness Index Calculator</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Enter your height and body mass to estimate your current Body Mass Index and receive tailored program recommendations.
                </p>

                <form onSubmit={calculateBmi} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={bmiHeight}
                      onChange={(e) => setBmiHeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white focus:outline-none focus:border-rose-500 text-sm"
                      placeholder="175"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={bmiWeight}
                      onChange={(e) => setBmiWeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-white focus:outline-none focus:border-rose-500 text-sm"
                      placeholder="70"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all text-sm shadow-lg shadow-rose-900/30"
                  >
                    Calculate Now
                  </button>
                </form>
              </div>

              <div className="flex flex-col items-center justify-center p-6 glass-card rounded-2xl border border-slate-800">
                {bmiResult ? (
                  <div className="text-center space-y-3">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Your Body Mass Index</span>
                    <div className="text-5xl font-black text-rose-400">{bmiResult.score}</div>
                    <div className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {bmiResult.status}
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs mt-2">
                      Ready to start your personalized regimen? Speak with our head coaches today.
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 space-y-2">
                    <Award className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="text-sm">Submit your measurements to view your score.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-950/60 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">MEMBERSHIP PLANS</h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">Flexible passes with zero lock-in contracts.</p>

            <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 mt-6">
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedPlan === "monthly" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setSelectedPlan("annual")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedPlan === "annual" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard */}
            <div className="glass-card p-8 rounded-3xl flex flex-col justify-between border border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Starter Pass</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect for casual training.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">${selectedPlan === "annual" ? "29" : "35"}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full gym floor access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Locker room & sauna</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mobile app keyless entry</li>
                </ul>
              </div>
              <button className="mt-8 w-full py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all">
                Select Starter
              </button>
            </div>

            {/* Pro */}
            <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border-2 border-rose-500 relative glow-pink transform md:-translate-y-3">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro Athlete Pass</h3>
                <p className="text-xs text-slate-400 mt-1">For serious strength enthusiasts.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-rose-400">${selectedPlan === "annual" ? "59" : "69"}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> All Starter benefits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Unlimited group HIIT classes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> 1-on-1 Monthly trainer check-in</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400" /> Biometric scanning & tracking</li>
                </ul>
              </div>
              <button className="mt-8 w-full py-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-900/40">
                Join Pro Athlete
              </button>
            </div>

            {/* VIP */}
            <div className="glass-card p-8 rounded-3xl flex flex-col justify-between border border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Elite VIP Pass</h3>
                <p className="text-xs text-slate-400 mt-1">All-inclusive premium experience.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">${selectedPlan === "annual" ? "99" : "119"}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> All Pro Athlete benefits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated 1-on-1 personal coach</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom nutrition meal plan</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> VIP Recovery lounge & cryotherapy</li>
                </ul>
              </div>
              <button className="mt-8 w-full py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all">
                Select VIP Pass
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#06070a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">PULSE GYM</span>
          </div>

          <p>© {new Date().getFullYear()} PULSE GYM. Powered by Next.js & Cloudflare Workers Edge.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
