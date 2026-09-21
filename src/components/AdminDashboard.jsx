'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Users,
  PlaneTakeoff,
  Receipt,
  Wallet,
  ArrowRightLeft,
  Megaphone,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PIE_COLORS = [
  '#14b8a6',
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#0ea5e9',
  '#8b5cf6',
  '#f97316',
  '#84cc16',
  '#06b6d4',
];

const inr = (n) =>
  '₹' +
  Number(n || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      {label ? <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p> : null}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {typeof p.value === 'number' ? inr(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    // (no setLoading here — the full-screen spinner only shows on first load,
    //  background refreshes update data silently to avoid flicker)
    setError(null);
    try {
      const [profiles, trips, expenses, settlements, announcements, membersCount] =
        await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('trips').select('*').order('created_at', { ascending: false }),
          supabase.from('expenses').select('*').order('created_at', { ascending: false }),
          supabase.from('settlements').select('*').order('settled_at', { ascending: false }),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }),
          supabase.from('trip_members').select('id', { count: 'exact', head: true }),
        ]);

      const bad = [profiles, trips, expenses, settlements, announcements, membersCount].find(
        (r) => r.error
      );
      if (bad) {
        console.warn('Admin analytics fetch warning:', bad.error);
        setError(bad.error.message);
      }

      setData({
        profiles: profiles.data || [],
        trips: trips.data || [],
        expenses: expenses.data || [],
        settlements: settlements.data || [],
        announcements: announcements.data || [],
        membersCount: membersCount.count || 0,
      });
    } catch (err) {
      console.error('Admin analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    load();

    // Auto-refresh every 15s so the dashboard is always "live".
    const pollId = setInterval(load, 15000);
    return () => clearInterval(pollId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const stats = useMemo(() => {
    if (!data) return null;

    const totalSpent = data.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const settledAmount = data.settlements.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const avgTickets = totalSpent / (data.trips.length || 1);

    const catMap = {};
    data.expenses.forEach((e) => {
      const c = e.category || 'Other';
      catMap[c] = (catMap[c] || 0) + Number(e.amount || 0);
    });
    const categories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monthMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthMap[`${d.getFullYear()}-${d.getMonth()}`] = 0;
    }
    data.expenses.forEach((e) => {
      const raw = e.created_at || e.date;
      const d = raw ? new Date(raw) : null;
      if (!d || isNaN(d.getTime())) return; // skip malformed/null dates
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthMap) monthMap[key] += Number(e.amount || 0);
    });
    const monthly = Object.entries(monthMap).map(([key, value]) => {
      const [, m] = key.split('-');
      return { month: MONTHS[Number(m)], spent: Math.round(value) };
    });

    const growthMap = {};
    const nowG = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(nowG.getFullYear(), nowG.getMonth() - i, 1);
      growthMap[`${d.getFullYear()}-${d.getMonth()}`] = 0;
    }
    const sortedProfiles = data.profiles
      .slice()
      .filter((p) => p.created_at)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const eligibleKeys = Object.keys(growthMap);
    sortedProfiles.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (eligibleKeys.includes(key)) growthMap[key]++;
    });
    let acc = 0;
    const userGrowth = eligibleKeys.map((key) => {
      acc += growthMap[key];
      const [, m] = key.split('-');
      return { month: MONTHS[Number(m)], users: acc };
    });

    // Spend is attributed to EVERY payer of a multi-payer expense (not just the
    // first "paid_by"), so the leaderboard reflects real contributions. If each
    // payer contributed an equal share we split evenly; otherwise we trust the
    // stored per-payer `amount` entries.
    const spenderMap = {};
    data.expenses.forEach((e) => {
      const total = Number(e.amount || 0);
      let payers;
      try {
        payers = Array.isArray(e.payers) ? e.payers : [];
      } catch {
        payers = [];
      }
      if (payers.length > 1) {
        let split = 0;
        const explicit = payers.every((p) => p && typeof p === 'object' && p.amount != null);
        if (explicit) {
          split = payers.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        } else {
          split = total / payers.length;
        }
        const names = payers.map((p) =>
          typeof p === 'string' ? p : p.name || p.memberName || 'Unknown'
        );
        names.forEach((n, i) => {
          const share = explicit ? Number(payers[i]?.amount || 0) : split;
          spenderMap[n] = (spenderMap[n] || 0) + share;
        });
      } else if (payers.length === 1) {
        const n = typeof payers[0] === 'string' ? payers[0] : payers[0].name || 'Unknown';
        spenderMap[n] = (spenderMap[n] || 0) + total;
      } else {
        const p = e.paid_by || 'Unknown';
        spenderMap[p] = (spenderMap[p] || 0) + total;
      }
    });
    const topSpenders = Object.entries(spenderMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      totalSpent,
      settledAmount,
      avgTickets,
      categories,
      monthly,
      userGrowth,
      topSpenders,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (!data || !stats) return null;

  const kpiCards = [
    { label: 'Registered Users', value: data.profiles.length, sub: 'total accounts', icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Active Trips', value: data.trips.length, sub: 'created on platform', icon: PlaneTakeoff, color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Expenses Logged', value: data.expenses.length, sub: data.membersCount + ' trip members', icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Amount Spent', value: inr(stats.totalSpent), sub: 'avg ' + inr(Math.round(stats.avgTickets)) + '/trip', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Settlements', value: data.settlements.length, sub: inr(stats.settledAmount), icon: ArrowRightLeft, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
    { label: 'Announcements', value: data.announcements.length, sub: 'community posts', icon: Megaphone, color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/20' },
  ];

return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2.5 rounded-2xl text-slate-950 shadow-lg shadow-teal-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-500" />
              Admin Analytics Hub
            </h1>
            <p className="text-xs text-slate-400">Signed in as {user && user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
              Some data unavailable
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          {lastUpdated && (
            <span className="text-[10px] text-slate-400 hidden lg:inline">
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <a
            href="/app"
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:border-teal-500/40 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to App
          </a>
          <button
            onClick={load}
            className="flex items-center gap-1.5 bg-teal-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-teal-400 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {kpiCards.map(function (c) {
          const Icon = c.icon;
          return (
            <div key={c.label} className={'rounded-2xl border p-3 sm:p-4 bg-white dark:bg-slate-900 ' + c.bg}>
              <div className={'flex items-center gap-1.5 mb-1 ' + c.color}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 truncate">{c.label}</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight break-words">{c.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Live users table */}
      <Card title="Live Users" icon={Users}>
        {data.profiles.length ? (
          <div className="overflow-auto max-h-[360px] no-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">UPI</th>
                  <th className="py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.profiles.slice(0, 30).map(function (p) {
                  return (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {(p.name || 'U')[0] ? (p.name || 'U')[0].toUpperCase() : 'U'}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{p.name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-slate-500 dark:text-slate-300 truncate max-w-[180px]">{p.email || '—'}</td>
                      <td className="py-2 pr-3 text-slate-500 dark:text-slate-300 truncate max-w-[140px]">{p.upi_id || '—'}</td>
                      <td className="py-2 text-slate-400 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">No users yet.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="User Growth" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={168}>
            <AreaChart data={stats.userGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="users" name="Users" stroke="#14b8a6" strokeWidth={2.5} fill="url(#gUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Spend by Category" icon={PieIcon}>
          <div className="flex flex-col sm:flex-row items-center justify-center h-[168px] gap-2">
            <ResponsiveContainer width="55%" height={168}>
              <PieChart>
                <Pie
                  data={stats.categories.length ? stats.categories : [{ name: 'No data', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(stats.categories.length ? stats.categories : [{ name: 'No data', value: 1 }]).map(function (_, i) {
                    return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 sm:w-[45%]">
              {(stats.categories.length ? stats.categories : [{ name: 'No data', value: 0 }])
                .slice(0, 6)
                .map(function (c, i) {
                  const pct = stats.totalSpent ? Math.round((c.value / stats.totalSpent) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Monthly Spend" icon={Wallet}>
          <ResponsiveContainer width="100%" height={168}>
            <BarChart data={stats.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? v / 1000 + 'k' : v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#14b8a6', opacity: 0.08 }} />
              <Bar dataKey="spent" name="Spent" radius={[8, 8, 0, 0]}>
                {stats.monthly.map(function (_, i) {
                  return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top Spenders" icon={Wallet}>
          {stats.topSpenders.length ? (
            <ResponsiveContainer width="100%" height={168}>
              <BarChart layout="vertical" data={stats.topSpenders} margin={{ top: 2, right: 8, left: 6, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#6366f1', opacity: 0.08 }} />
                <Bar dataKey="value" name="Spent" radius={[0, 8, 8, 0]} barSize={18}>
                  {stats.topSpenders.map(function (_, i) {
                    return <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-20">No spenders yet.</p>
          )}
        </Card>
      </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Recent Trips" icon={PlaneTakeoff}>
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {data.trips.slice(0, 14).map(function (t) {
              return (
                <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="min-w-0">
                    <div className="text-slate-800 dark:text-slate-100 font-medium truncate">{t.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {(t.creator_name || 'Organizer') + ' · ' + fmtDate(t.created_at)}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(t.created_at)}
                  </span>
                </div>
              );
            })}
            {data.trips.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No trips yet.</p>
            )}
          </div>
        </Card>

        <Card title="Recent Settlements" icon={ArrowRightLeft}>
          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {data.settlements.slice(0, 14).map(function (s) {
              return (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="min-w-0">
                    <div className="text-slate-700 dark:text-slate-200 truncate">
                      {s.from_member + ' → ' + s.to_member}
                    </div>
                    <div className="text-[11px] text-slate-400">{fmtDate(s.settled_at || s.created_at)}</div>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{inr(s.amount)}</span>
                </div>
              );
            })}
            {data.settlements.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No settlements yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
      <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
        <span className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-500 flex-shrink-0">
          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}