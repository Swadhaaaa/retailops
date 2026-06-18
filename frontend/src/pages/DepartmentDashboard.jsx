import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';

const STATUS_OPTIONS = [
  'Open',
  'Under Review',
  'In Progress',
  'Needs Clarification',
  'Resolved',
  'Closed'
];

const priorityClass = (priority) => {
  if (priority === 'Critical' || priority === 'Urgent' || priority === 'High') {
    return 'bg-brandRed/10 text-brandRed border-brandRed/20';
  }
  if (priority === 'Medium') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
};

const statusClass = (status) => {
  if (status === 'Resolved' || status === 'Closed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (status === 'In Progress' || status === 'Under Review') {
    return 'bg-brandRed/10 text-brandRed border-brandRed/20';
  }
  if (status === 'Needs Clarification') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DepartmentDashboard = () => {
  const { user: contextUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);
  const user = contextUser || storedUser || {};
  const department = user.department || 'Department';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchTickets = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/tickets/admin/all');
      setTickets(response.data || []);
      setError('');
    } catch (err) {
      console.error('Department tickets fetch failed:', err);
      setError('Unable to load your department tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => fetchTickets({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, []);

  const openDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/tickets/${ticket.ticket_id}`);
      setSelectedTicket(response.data);
    } catch (err) {
      console.error('Ticket details failed:', err);
      alert('Unable to open ticket details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedTicket(null);
  };

  const updateStatus = async (status) => {
    if (!selectedTicket) return;
    setStatusUpdating(true);
    try {
      await api.put(`/tickets/${selectedTicket.ticket_id}/status`, { status });
      const response = await api.get(`/tickets/${selectedTicket.ticket_id}`);
      setSelectedTicket(response.data);
      await fetchTickets({ silent: true });
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Unable to update ticket status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(ticket => ticket.status === 'Open').length,
    progress: tickets.filter(ticket => ['Under Review', 'In Progress', 'Needs Clarification'].includes(ticket.status)).length,
    resolved: tickets.filter(ticket => ['Resolved', 'Closed'].includes(ticket.status)).length
  };

  return (
    <div className="min-h-screen bg-[#F3F5FB] font-dmSans text-slate-800">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(15,27,76,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(227,24,55,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <header className="relative z-10 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={relianceLogo} alt="Reliance Retail" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-sm font-extrabold text-brandDarkNavy font-sora">Department Dashboard</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{department}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-brandNavy/10 bg-white px-4 py-2 text-xs font-extrabold text-brandNavy shadow-sm transition hover:bg-brandNavy hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="rounded-[24px] border border-white/70 bg-white/72 p-6 shadow-[0_18px_45px_rgba(15,27,76,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-sora text-2xl font-extrabold text-brandDarkNavy">
                {department} Ticket Queue
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Only tickets assigned to your department are shown here.
              </p>
            </div>
            <span className="self-start rounded-full border border-brandRed/15 bg-brandRed/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brandRed md:self-auto">
              Scoped Department Access
            </span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Total Assigned', stats.total, 'text-brandNavy'],
            ['Open', stats.open, 'text-brandRed'],
            ['In Progress', stats.progress, 'text-amber-600'],
            ['Resolved', stats.resolved, 'text-emerald-600']
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-[20px] border border-white/70 bg-white/75 p-5 shadow-[0_12px_30px_rgba(15,27,76,0.07)] backdrop-blur-xl">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">{label}</p>
              <p className={`mt-2 font-sora text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[24px] border border-white/70 bg-white/76 shadow-[0_18px_45px_rgba(15,27,76,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/70 px-5 py-4">
            <div>
              <h2 className="font-sora text-sm font-extrabold text-brandDarkNavy">Assigned Tickets</h2>
              <p className="text-[10px] font-semibold text-slate-400">Status, priority, category, requester, and date</p>
            </div>
            <button
              type="button"
              onClick={() => fetchTickets()}
              className="rounded-xl border border-brandNavy/10 bg-white px-3 py-2 text-[10px] font-extrabold text-brandNavy transition hover:bg-brandNavy hover:text-white"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-xs font-bold text-slate-400">Loading department tickets...</div>
          ) : error ? (
            <div className="px-5 py-12 text-center text-xs font-bold text-brandRed">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-12 text-center text-xs font-bold text-slate-400">No tickets are assigned to {department} yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left">
                <thead>
                  <tr className="border-b border-white/70 bg-white/50 text-[9px] uppercase tracking-widest text-slate-400 font-sora">
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Raised By</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/70">
                  {tickets.map(ticket => (
                    <tr key={ticket.ticket_id} className="transition hover:bg-white/70">
                      <td className="px-5 py-4">
                        <p className="text-xs font-extrabold text-brandNavy font-sora">#{ticket.ticket_id}</p>
                        <p className="mt-1 max-w-[260px] truncate text-xs font-bold text-slate-700">{ticket.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClass(ticket.status)}`}>{ticket.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${priorityClass(ticket.priority)}`}>{ticket.priority}</span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{ticket.category_name || `Category #${ticket.category_id}`}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{ticket.vendor_name || ticket.raised_by}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">{formatDate(ticket.created_at)}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openDetails(ticket)}
                          className="rounded-xl bg-brandNavy px-3 py-2 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-brandDarkNavy"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brandNavy/35 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeDetails} />
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-brandNavy to-brandRed" />
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sora">Ticket #{selectedTicket.ticket_id}</p>
                <h3 className="mt-1 truncate font-sora text-xl font-extrabold text-brandDarkNavy">{selectedTicket.title}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Assigned to {selectedTicket.assigned_department || department}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
              <div className="space-y-5 p-5 lg:col-span-7">
                {detailsLoading && (
                  <div className="rounded-2xl border border-brandNavy/10 bg-brandNavy/5 px-4 py-3 text-xs font-bold text-brandNavy">Refreshing ticket details...</div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Status</p>
                    <p className="mt-1 text-sm font-extrabold text-brandDarkNavy">{selectedTicket.status}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Priority</p>
                    <p className="mt-1 text-sm font-extrabold text-brandDarkNavy">{selectedTicket.priority}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Category</p>
                    <p className="mt-1 text-sm font-extrabold text-brandDarkNavy">{selectedTicket.category_name || `Category #${selectedTicket.category_id}`}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Raised By</p>
                    <p className="mt-1 break-all text-sm font-extrabold text-brandDarkNavy">{selectedTicket.vendor_name || selectedTicket.raised_by}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Description</h4>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm font-semibold leading-relaxed text-slate-700">
                    {selectedTicket.description}
                  </div>
                </div>

              </div>

              <aside className="space-y-5 border-t border-slate-100 bg-slate-50/50 p-5 lg:col-span-5 lg:border-l lg:border-t-0">
                <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Update Status</label>
                  <select
                    value={selectedTicket.status || 'Open'}
                    onChange={(event) => updateStatus(event.target.value)}
                    disabled={statusUpdating}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-brandDarkNavy outline-none focus:border-brandNavy"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;
