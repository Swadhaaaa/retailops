import React, { useState, useEffect, useRef } from 'react';

const DashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // 5 SECOND AUTO SWITCH with smooth transition
  useEffect(() => {
    const timer = setInterval(() => {
      setContentVisible(false);
      setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % 3);
        setContentVisible(true);
      }, 400);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleTabClick = (i) => {
    if (i === activeTab) return;
    setContentVisible(false);
    setTimeout(() => {
      setActiveTab(i);
      setContentVisible(true);
    }, 400);
  };

  const dashboards = [
    {
      id: 0,
      title: 'Query Management Hub',
      subtitle: 'Centralized live streams & tracking',
      badge: 'Live Operations',

      content: (
        <div className="space-y-2 mt-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/10 text-[10px]">
            <span className="font-semibold tracking-wider uppercase text-white/60">
              Recent Vendor Queries
            </span>

            <span className="flex items-center text-brandRed font-bold animate-pulse text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-brandRed mr-1.5 inline-block animate-ping"></span>
              LIVE FEED
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group cursor-default showcase-stagger-1">
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-white/50 font-mono">
                  Q-3409 • Reliance Digital
                </span>

                <span className="text-sm font-medium text-white/95 group-hover:text-white transition-colors">
                  Inventory Shortage Dispute
                </span>
              </div>

              <span className="px-2 py-1 rounded text-[8px] font-semibold uppercase bg-red-500/20 text-red-300 border border-red-500/30 group-hover:bg-red-500/30 transition-all">
                Critical
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group cursor-default showcase-stagger-2">
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-white/50 font-mono">
                  Q-3408 • Smart Bazaar
                </span>

                <span className="text-sm font-medium text-white/95 group-hover:text-white transition-colors">
                  Payment Settlement Error
                </span>
              </div>

              <span className="px-2 py-1 rounded text-[8px] font-semibold uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 group-hover:bg-yellow-500/30 transition-all">
                In Progress
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group cursor-default showcase-stagger-3">
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-white/50 font-mono">
                  Q-3407 • JioMart
                </span>

                <span className="text-sm font-medium text-white/95 group-hover:text-white transition-colors">
                  Return Policy Clarification
                </span>
              </div>

              <span className="px-2 py-1 rounded text-[8px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-all">
                Resolved
              </span>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 1,
      title: 'Workflow Tracker',
      subtitle: 'End-to-end resolution pipelines',
      badge: 'Action Center',

      content: (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] pb-2 border-b border-white/10">
            <span className="font-semibold tracking-wider uppercase text-white/60">
              Ticket Lifecycle
            </span>

            <span className="text-blue-300 font-mono text-[9px]">
              TID-9804
            </span>
          </div>

          <div className="relative py-2 showcase-stagger-1">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2"></div>
            {/* Animated progress line */}
            <div className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-brandRed to-blue-500 -translate-y-1/2 animate-progress-line" style={{ width: '62%' }}></div>

            <div className="relative flex justify-between">
              {[
                ['✓', 'Raised', true],
                ['✓', 'Reviewed', true],
                ['3', 'Assigned', 'active'],
                ['4', 'Resolved', false],
              ].map(([num, label, status], idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500
                    ${status === true
                        ? 'bg-brandRed text-white shadow-lg shadow-brandRed/20'
                        : status === 'active'
                          ? 'bg-blue-500 text-white ring-4 ring-blue-500/20 animate-pulse shadow-lg shadow-blue-500/30'
                          : 'bg-white/10 text-white/40'
                      }`}
                  >
                    {num}
                  </div>

                  <span
                    className={`text-[9px] mt-1 ${status === 'active'
                        ? 'text-blue-300 font-bold'
                        : 'text-white/60'
                      }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/[0.08] transition-all duration-500 showcase-stagger-2">
            <div className="flex justify-between items-center text-[9px] text-white/50 mb-1">
              <span>ASSIGNED AGENT</span>
              <span className="text-blue-300 animate-pulse">14 MINS AGO</span>
            </div>

            <p className="text-sm font-semibold text-white">
              Swadha (Lead Ops)
            </p>

            <p className="text-[12px] text-white/70 mt-1">
              Routing to Finance Settlement queue.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/[0.08] transition-all duration-500 showcase-stagger-3">
            <div className="flex justify-between items-center text-[9px] text-white/50 mb-1">
              <span>ESTIMATED RESOLUTION</span>
              <span className="text-emerald-400">ON TRACK</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full w-[68%] animate-shimmer-bar"></div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 2,
      title: 'Operations Analytics',
      subtitle: 'Real-time performance metrics',
      badge: 'Performance Insights',

      content: (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] pb-2 border-b border-white/10">
            <span className="font-semibold tracking-wider uppercase text-white/60">
              Operational Health
            </span>

            <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ALL NORMAL
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 showcase-stagger-1">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group">
              <span className="text-[8px] text-white/50 uppercase block">
                Res. Rate
              </span>

              <span className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                98.4%
              </span>

              <span className="text-[8px] text-emerald-400 font-bold block mt-1">
                +1.2% this wk
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group">
              <span className="text-[8px] text-white/50 uppercase block">
                Avg. Resolution
              </span>

              <span className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                1.4h
              </span>

              <span className="text-[8px] text-emerald-400 font-bold block mt-1">
                Within SLA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 showcase-stagger-2">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group">
              <span className="text-[8px] text-white/50 uppercase block">
                Total Queries
              </span>

              <span className="text-lg font-bold text-white group-hover:text-brandRed transition-colors">
                1,247
              </span>

              <span className="text-[8px] text-blue-300 font-bold block mt-1">
                This month
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group">
              <span className="text-[8px] text-white/50 uppercase block">
                CSAT Score
              </span>

              <span className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors">
                4.8★
              </span>

              <span className="text-[8px] text-emerald-400 font-bold block mt-1">
                Excellent
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 showcase-stagger-3">
            <div className="flex justify-between text-[11px] font-semibold text-white/80 mb-2">
              <span>SLA Compliance Goal</span>
              <span className="text-brandRed">99.2%</span>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-brandRed h-full rounded-full w-[99.2%] animate-shimmer-bar"></div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="relative select-none w-full max-w-[520px] mx-auto py-2">

      {/* GLOW - animated */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-brandRed/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-glow-pulse" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none -z-10 animate-glow-pulse" style={{ animationDelay: '5s' }} />

      {/* MAIN CARD - fixed height for uniform size */}
      <div className="relative bg-brandNavy/35 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden min-h-[350px]">

        {/* GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>

        {dashboards.map((dash, idx) => {
          const isActive = idx === activeTab;

          return (
            <div
              key={dash.id}
              className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isActive
                  ? `relative z-10 ${contentVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-[0.98]'}`
                  : 'opacity-0 translate-y-4 scale-[0.96] absolute inset-0 pointer-events-none'
                }`}
            >
              <div className="flex justify-end items-center mb-2 relative z-10">
                <div className="flex space-x-2">
                  {dashboards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleTabClick(i)}
                      className={`transition-all duration-500 rounded-full ${i === activeTab
                          ? 'bg-brandRed w-6 h-2'
                          : 'bg-white/20 w-2 h-2'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div className="text-center mb-2 -mt-2">
                <h3 className="text-xl font-bold font-sora text-white">
                  {dash.title}
                </h3>

                <p className="text-sm text-brandMuted mt-1">
                  {dash.subtitle}
                </p>
              </div>

              {/* CONTENT - fixed height container */}
              <div className="relative z-10 rounded-2xl bg-white/[0.03] border border-white/5 p-4 backdrop-blur-sm min-h-[180px]">
                {dash.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING BOXES - with float animations */}

      <div className="absolute -top-2 -left-16 glass-panel-heavy rounded-2xl p-3 w-[145px] shadow-xl z-20 animate-soft-float-1 hover:scale-105 transition-transform duration-300 cursor-default">
        <span className="text-[9px] uppercase tracking-wider font-bold text-white/55 block">
          Active Queries
        </span>

        <div className="flex items-baseline space-x-1 mt-1">
          <span className="text-xl font-extrabold text-white">42</span>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            LIVE
          </span>
        </div>

        <p className="text-[9px] text-brandMuted mt-1">
          2 High priority
        </p>
      </div>

      <div className="absolute top-4 -right-16 glass-panel-heavy rounded-2xl p-3 w-[145px] shadow-xl z-20 animate-soft-float-2 hover:scale-105 transition-transform duration-300 cursor-default">
        <span className="text-[9px] uppercase tracking-wider font-bold text-white/55 block">
          Pending Actions
        </span>

        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xl font-extrabold text-white">
            5
          </span>

          <span className="text-[8px] uppercase tracking-wider font-bold bg-white/10 px-2 py-1 rounded text-white/70">
            Tickets
          </span>
        </div>

        <p className="text-[9px] text-brandMuted mt-1">
          Awaiting approval
        </p>
      </div>

      <div className="absolute -bottom-2 -left-14 glass-panel-heavy rounded-2xl p-3 w-[135px] shadow-xl z-20 animate-soft-float-3 hover:scale-105 transition-transform duration-300 cursor-default">
        <span className="text-[9px] uppercase tracking-wider font-bold text-white/55 block">
          SLA Target
        </span>

        <div className="mt-1">
          <span className="text-xl font-extrabold text-emerald-400">
            99.4%
          </span>
        </div>

        <p className="text-[9px] text-brandMuted mt-1">
          Excellent metrics
        </p>
      </div>

      <div className="absolute -bottom-1 -right-10 glass-panel-heavy rounded-2xl px-3 py-2 shadow-xl z-20 animate-soft-float-2 hover:scale-105 transition-transform duration-300 cursor-default" style={{ animationDelay: '2s' }}>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute inset-0"></div>
          </div>

          <span className="text-[9px] uppercase tracking-widest font-bold text-white/90">
            LIVE MONITORING
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardShowcase;