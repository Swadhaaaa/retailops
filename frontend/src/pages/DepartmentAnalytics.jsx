import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';

const BarList = ({ rows, max, tone }) => <div className="mt-5 space-y-4">{rows.length ? rows.map(([label, count]) => <div key={label}><div className="flex justify-between text-xs font-bold text-slate-600"><span>{label}</span><span>{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${(count / max) * 100}%` }} /></div></div>) : <p className="text-xs font-bold text-slate-400">No data available.</p>}</div>;

const DepartmentAnalytics = () => {
  const { user: contextUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);
  const user = contextUser || storedUser || {};

  useEffect(() => {
    api.get('/tickets/department/assigned')
      .then((response) => setTickets(response.data || []))
      .catch((err) => console.error('Department analytics fetch failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const resolved = tickets.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status));
  const averageHours = resolved.length ? resolved.reduce((sum, ticket) => {
    const start = new Date(ticket.created_at).getTime();
    const end = new Date(ticket.resolved_at || ticket.updated_at).getTime();
    return sum + Math.max(0, end - start) / 3600000;
  }, 0) / resolved.length : 0;

  const distribution = (key) => Object.entries(tickets.reduce((result, ticket) => {
    const value = ticket[key] || 'Unspecified';
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);

  const categoryData = distribution('category_name');
  const statusData = distribution('status');
  const maxCategory = Math.max(1, ...categoryData.map(([, count]) => count));
  const maxStatus = Math.max(1, ...statusData.map(([, count]) => count));

  return <div className="min-h-screen bg-[#F3F5FB] font-dmSans text-slate-800">
    <header className="border-b border-white/70 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><img src={relianceLogo} alt="Reliance Retail" className="h-9 w-auto" /><div><p className="font-sora text-sm font-extrabold text-brandDarkNavy">Department Analytics</p><p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{user.department} performance module</p></div></div><button onClick={() => navigate('/department-dashboard')} className="rounded-xl bg-brandNavy px-4 py-2 text-xs font-extrabold text-white">Back to Operations</button></div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-5 py-6">
      <section className="rounded-[24px] border border-white/80 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,27,76,0.08)]"><p className="text-[10px] font-extrabold uppercase tracking-wider text-brandRed">Separate Reporting Workspace</p><h1 className="mt-1 font-sora text-2xl font-extrabold text-brandDarkNavy">{user.department} Ticket Analytics</h1><p className="mt-1 text-xs font-semibold text-slate-500">Performance reporting stays separate from the daily ticket workflow.</p></section>
      {loading ? <div className="rounded-[24px] bg-white p-14 text-center text-xs font-bold text-slate-400">Loading analytics...</div> : <>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Total tickets', tickets.length], ['Open workload', tickets.length - resolved.length], ['Resolved', resolved.length], ['Avg. resolution', `${averageHours.toFixed(1)}h`]].map(([label, value]) => <div key={label} className="rounded-[20px] border border-white/80 bg-white/80 p-5 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 font-sora text-3xl font-extrabold text-brandNavy">{value}</p></div>)}</section>
        <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-[24px] border border-white/80 bg-white/80 p-6 shadow-sm"><h2 className="font-sora text-base font-extrabold text-brandDarkNavy">Category Distribution</h2><BarList rows={categoryData} max={maxCategory} tone="bg-brandNavy" /></div><div className="rounded-[24px] border border-white/80 bg-white/80 p-6 shadow-sm"><h2 className="font-sora text-base font-extrabold text-brandDarkNavy">Status Distribution</h2><BarList rows={statusData} max={maxStatus} tone="bg-brandRed" /></div></section>
      </>}
    </main>
  </div>;
};

export default DepartmentAnalytics;
