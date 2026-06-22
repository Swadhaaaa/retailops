import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';

const STATUS_OPTIONS = ['Open', 'Under Review', 'In Progress', 'Needs Clarification', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical', 'Urgent'];
const CHECKLIST_ITEMS = [
  ['documents_verified', 'Documents verified'],
  ['issue_investigated', 'Issue investigated'],
  ['requester_updated', 'Requester updated'],
  ['final_confirmation_done', 'Final confirmation done']
];

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const isResolved = (ticket) => ['Resolved', 'Closed'].includes(ticket.status);
const isUnclaimed = (ticket) => !ticket.claimed_by
  && (!ticket.assigned_to || ['Unassigned', ticket.assigned_department, ticket.business_unit].includes(ticket.assigned_to));
const attachmentName = (filename) => filename?.split('_').slice(1).join('_') || filename || 'Attachment';

const getCurrentUser = (contextUser) => {
  if (contextUser) return contextUser;
  try {
    return JSON.parse(localStorage.getItem('user') || 'null') || {};
  } catch {
    return {};
  }
};

const getDepartmentName = (user) => user?.department?.trim() || 'Department';
const getUserDisplayName = (user) => user?.name?.trim() || 'Department User';

const getUserRoleLabel = (user) => {
  const role = user?.role?.trim();
  if (!role) return 'Department User';
  if (role.toLowerCase() === 'department') return 'Department User';
  return role.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getTicketOwnerName = (ticket) => isUnclaimed(ticket) ? null : ticket.assigned_to || ticket.claimed_by;

const calculateDepartmentStats = (tickets) => ({
  total: tickets.length,
  open: tickets.filter((ticket) => ticket.status === 'Open').length,
  progress: tickets.filter((ticket) => ['Under Review', 'In Progress'].includes(ticket.status)).length,
  waiting: tickets.filter((ticket) => ticket.status === 'Needs Clarification').length,
  resolved: tickets.filter(isResolved).length
});

const calculateQueueCounts = (tickets, userId) => ({
  'All Tickets': tickets.length,
  'New / Unclaimed': tickets.filter((ticket) => isUnclaimed(ticket) && ticket.status === 'Open').length,
  'Assigned to Me': tickets.filter((ticket) => ticket.claimed_by === userId).length,
  'In Progress': tickets.filter((ticket) => ['Under Review', 'In Progress'].includes(ticket.status)).length,
  'Waiting for User': tickets.filter((ticket) => ticket.status === 'Needs Clarification').length,
  Escalated: tickets.filter((ticket) => Number(ticket.escalation_count || 0) > 0).length,
  Resolved: tickets.filter(isResolved).length
});

const calculateWorkload = (tickets) => {
  const byOwner = {};
  tickets.filter((ticket) => !isUnclaimed(ticket) && !isResolved(ticket)).forEach((ticket) => {
    const owner = ticket.assigned_to || ticket.claimed_by;
    if (owner) byOwner[owner] = (byOwner[owner] || 0) + 1;
  });
  return {
    owners: Object.entries(byOwner).sort((a, b) => b[1] - a[1]),
    unclaimed: tickets.filter(isUnclaimed).length
  };
};

const statusClass = (status) => {
  if (['Resolved', 'Closed'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['In Progress', 'Under Review'].includes(status)) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Needs Clarification') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const priorityClass = (priority) => {
  if (['Critical', 'Urgent', 'High'].includes(priority)) return 'border-red-200 bg-red-50 text-brandRed';
  if (priority === 'Medium') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-blue-200 bg-blue-50 text-brandNavy';
};

const DepartmentDashboard = () => {
  const { user: contextUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(contextUser), [contextUser]);
  const department = getDepartmentName(user);
  const userDisplayName = getUserDisplayName(user);
  const userRoleLabel = getUserRoleLabel(user);

  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState('All Tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [working, setWorking] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({
    resolution_summary: '', root_cause: '', action_taken: '', resolution_remarks: '',
    checklist: { documents_verified: false, issue_investigated: false, requester_updated: false, final_confirmation_done: false }
  });
  const [escalationForm, setEscalationForm] = useState({ target_department: '', reason: '' });
  const [reopenReason, setReopenReason] = useState('');

  const fetchTickets = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const response = await api.get('/tickets/department/assigned');
      setTickets(response.data || []);
      setError('');
    } catch (err) {
      console.error('Department tickets fetch failed:', err);
      setError(`Unable to load ${department} tickets. Please refresh.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department]);

  useEffect(() => {
    api.get('/tickets/department/assigned').then((response) => {
      setTickets(response.data || []);
      setError('');
    }).catch((err) => {
      console.error('Department tickets fetch failed:', err);
      setError(`Unable to load ${department} tickets. Please refresh.`);
    }).finally(() => setLoading(false));
    api.get('/tickets/departments').then((response) => {
      if (response.data?.length) setDepartments(response.data);
    }).catch((err) => console.error('Department list fetch failed:', err));
    const interval = setInterval(() => fetchTickets({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, [department, fetchTickets]);

  const refreshSelectedTicket = async (ticketId = selectedTicket?.ticket_id) => {
    if (!ticketId) return;
    const response = await api.get(`/tickets/${ticketId}`);
    setSelectedTicket(response.data);
  };

  const openDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailsLoading(true);
    setNoteText('');
    setShowResolutionForm(false);
    setReopenReason('');
    try { await refreshSelectedTicket(ticket.ticket_id); }
    catch (err) { alert(err.response?.data?.error || 'Unable to open ticket details.'); }
    finally { setDetailsLoading(false); }
  };

  const closeDetails = () => {
    setSelectedTicket(null);
    setNoteText('');
    setShowResolutionForm(false);
    setEscalationForm({ target_department: '', reason: '' });
    setReopenReason('');
  };

  const runAction = async (key, action, { close = false, onSuccess } = {}) => {
    setWorking(key);
    try {
      await action();
      if (close) closeDetails(); else await refreshSelectedTicket();
      await fetchTickets({ silent: true });
      onSuccess?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to complete this action.');
    } finally { setWorking(''); }
  };

  const stats = useMemo(() => calculateDepartmentStats(tickets), [tickets]);
  const queueCounts = useMemo(() => calculateQueueCounts(tickets, user.user_id), [tickets, user.user_id]);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    let queueMatch = true;
    if (queue === 'New / Unclaimed') queueMatch = isUnclaimed(ticket) && ticket.status === 'Open';
    if (queue === 'Assigned to Me') queueMatch = ticket.claimed_by === user.user_id;
    if (queue === 'In Progress') queueMatch = ['Under Review', 'In Progress'].includes(ticket.status);
    if (queue === 'Waiting for User') queueMatch = ticket.status === 'Needs Clarification';
    if (queue === 'Escalated') queueMatch = Number(ticket.escalation_count || 0) > 0;
    if (queue === 'Resolved') queueMatch = isResolved(ticket);
    return queueMatch;
  }), [tickets, queue, user.user_id]);

  const workload = useMemo(() => calculateWorkload(tickets), [tickets]);

  const selectedIsMine = selectedTicket?.claimed_by === user.user_id;
  const availableDepartments = departments.filter((item) => item !== (selectedTicket?.assigned_department || department));

  const updateStatus = (status) => {
    if (status === 'Resolved') { setShowResolutionForm(true); return; }
    runAction('status', () => api.put(`/tickets/${selectedTicket.ticket_id}/status`, { status }));
  };

  const updatePriority = (priority) => runAction('priority', () => api.put(`/tickets/${selectedTicket.ticket_id}/priority`, { priority }));
  const claimTicket = () => runAction('claim', () => api.post(`/tickets/${selectedTicket.ticket_id}/claim`));
  const releaseTicket = () => runAction('release', () => api.post(`/tickets/${selectedTicket.ticket_id}/release`));

  const saveInternalNote = (event) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    runAction('note', () => api.post(`/tickets/${selectedTicket.ticket_id}/notes`, { note_text: noteText.trim() }), { onSuccess: () => setNoteText('') });
  };

  const submitResolution = (event) => {
    event.preventDefault();
    runAction('resolve', () => api.post(`/tickets/${selectedTicket.ticket_id}/resolve`, resolutionForm), { onSuccess: () => setShowResolutionForm(false) });
  };

  const submitEscalation = (event) => {
    event.preventDefault();
    runAction('escalate', () => api.post(`/tickets/${selectedTicket.ticket_id}/reassign-department`, escalationForm), { close: true });
  };

  const reopenTicket = (event) => {
    event.preventDefault();
    runAction('reopen', () => api.post(`/tickets/${selectedTicket.ticket_id}/reopen`, { reason: reopenReason }), { onSuccess: () => setReopenReason('') });
  };

  const downloadAttachment = async (filename) => {
    try {
      const response = await api.get(`/tickets/download/${filename}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachmentName(filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to download attachment.'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };
  return (
    <div className="min-h-screen bg-[#F3F5FB] font-dmSans text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-5">
          <img src={relianceLogo} alt="Reliance Retail" className="h-9 w-auto object-contain" />
          <div className="min-w-0"><p className="font-sora text-sm font-extrabold text-brandDarkNavy">QMS Portal</p><p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-brandRed">{department}</p></div>
        </div>
        <div className="px-4 py-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/55 p-3.5">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brandNavy text-xs font-extrabold text-white">{userDisplayName.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-extrabold text-brandDarkNavy">{userDisplayName}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">{userRoleLabel}</p></div></div>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-5">
          <div><p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            <button type="button" onClick={() => setQueue('All Tickets')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-extrabold transition-all duration-200 ${queue === 'All Tickets' ? 'bg-brandNavy text-white shadow-lg' : 'text-slate-600 hover:bg-blue-50 hover:text-brandNavy'}`}><span>Department Overview</span><span className="text-[9px]">{queueCounts['All Tickets']}</span></button>
            <button type="button" onClick={() => setQueue('New / Unclaimed')} className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${queue === 'New / Unclaimed' ? 'bg-red-50 text-brandRed' : 'text-slate-500 hover:bg-slate-50 hover:text-brandNavy'}`}><span>New / Unclaimed</span><span className="text-[9px] font-extrabold">{queueCounts['New / Unclaimed']}</span></button>
            <button type="button" onClick={() => setQueue('Assigned to Me')} className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${queue === 'Assigned to Me' ? 'bg-blue-50 text-brandNavy' : 'text-slate-500 hover:bg-slate-50 hover:text-brandNavy'}`}><span>Assigned to Me</span><span className="text-[9px] font-extrabold">{queueCounts['Assigned to Me']}</span></button>
          </div>
          <div><p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Ticket Views</p>{['In Progress', 'Waiting for User', 'Escalated', 'Resolved'].map((item) => <button type="button" key={item} onClick={() => setQueue(item)} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${queue === item ? 'border-l-[3px] border-brandRed bg-red-50 text-brandRed' : 'text-slate-500 hover:bg-slate-50 hover:text-brandNavy'}`}><span>{item}</span><span className="text-[9px] font-extrabold">{queueCounts[item]}</span></button>)}</div>
          <div><p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Reports</p><button type="button" onClick={() => navigate('/department-analytics')} className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-brandNavy">Analytics</button></div>
        </nav>
        <div className="border-t border-slate-100 p-4"><button type="button" onClick={handleLogout} className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[10px] font-extrabold text-brandRed transition-all duration-200 hover:bg-brandRed hover:text-white">Sign Out</button></div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl lg:ml-64">
        <div className="mx-auto flex h-[72px] max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-3">
            <img src={relianceLogo} alt="Reliance Retail" className="h-8 w-auto lg:hidden" />
            <div>
              <p className="font-sora text-sm font-extrabold text-brandDarkNavy">Department Dashboard</p>
              <div className="mt-0.5 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-wider">
                <span className="text-slate-400">{userRoleLabel}</span>
                <span className={`rounded-full px-2 py-0.5 ${error ? 'bg-red-50 text-brandRed' : loading || refreshing ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {error ? 'Connection Issue' : loading || refreshing ? 'Syncing Workflow' : 'Workflow Active'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-brandNavy/20 hover:bg-blue-50 hover:text-brandNavy"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a3 3 0 1 1-5.714 0" /></svg></button>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brandNavy text-[10px] font-extrabold text-white">{userDisplayName.charAt(0).toUpperCase()}</span><div className="hidden sm:block"><p className="max-w-[120px] truncate text-[10px] font-extrabold text-brandDarkNavy">{userDisplayName}</p><p className="text-[8px] font-semibold text-slate-400">{userRoleLabel}</p></div></div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1500px] space-y-5 bg-white px-5 py-6 lg:ml-64">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-stretch">
          <div className="flex flex-col justify-center rounded-[20px] border border-slate-200/80 bg-gradient-to-r from-white to-blue-50/35 p-5 shadow-[0_12px_32px_rgba(15,27,76,0.055)] transition-shadow duration-200 hover:shadow-[0_16px_36px_rgba(15,27,76,0.08)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brandRed">{department.toUpperCase()} Operations</p>
            <h1 className="mt-1 font-sora text-2xl font-extrabold text-brandDarkNavy">{department} Department</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">Manage {department} tickets assigned to your department in real time.</p>
          </div>

          <div className="w-full">
            <div className="relative flex h-full min-h-[132px] flex-col overflow-hidden rounded-[20px] border border-brandRed bg-brandRed p-4 shadow-[0_14px_34px_rgba(227,24,55,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(227,24,55,0.24)]">
              <span className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-white/[0.07]" />
              <div className="relative">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-white/70">Department Workload</p>
              </div>
              <div className="relative mt-3 grid flex-1 grid-cols-2 gap-2.5">
                <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5">
                  <p className="font-sora text-2xl font-extrabold leading-none text-white">{workload.owners.reduce((sum, [, count]) => sum + count, 0)}</p>
                  <p className="mt-1.5 text-[8px] font-extrabold uppercase tracking-wider text-white/65">Active</p>
                </div>
                <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-brandNavy/25 px-3 py-2.5">
                  <p className="font-sora text-2xl font-extrabold leading-none text-white">{workload.unclaimed}</p>
                  <p className="mt-1.5 text-[8px] font-extrabold uppercase tracking-wider text-white/65">Unclaimed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            ['Total Assigned', stats.total, 'text-brandNavy'], ['Open', stats.open, 'text-brandRed'],
            ['In Progress', stats.progress, 'text-blue-600'], ['Waiting / Clarification', stats.waiting, 'text-amber-600'],
            ['Resolved', stats.resolved, 'text-emerald-600']
          ].map(([label, value, tone]) => <div key={label} className="rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,27,76,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brandNavy/15 hover:shadow-[0_12px_28px_rgba(15,27,76,0.08)]"><div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-brandNavy to-brandRed" /><p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-2 font-sora text-3xl font-extrabold ${tone}`}>{value}</p></div>)}
        </section>

        <section>
          <div className="min-w-0 overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(15,27,76,0.055)]">
            <div className="border-b border-slate-100 p-4">
              <div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-brandRed">Live Department Queue</p><h3 className="mt-1 font-sora text-base font-extrabold text-brandDarkNavy">{queue}</h3></div>
            </div>

            {loading ? <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-100 border-t-brandNavy" /><p className="mt-3 text-xs font-extrabold text-brandDarkNavy">Loading {department} tickets</p><p className="mt-1 text-[10px] font-semibold text-slate-400">Synchronizing the latest department queue...</p></div>
              : error ? <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-brandRed"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 16.5h.01" /></svg></span><p className="mt-3 text-xs font-extrabold text-brandDarkNavy">{error}</p><button onClick={() => fetchTickets()} className="mt-3 rounded-xl bg-brandNavy px-4 py-2 text-[10px] font-extrabold text-white transition-all duration-200 hover:bg-brandRed">Try Again</button></div>
                : filteredTickets.length === 0 ? <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brandNavy"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z M8.25 9h7.5" /></svg></span><p className="mt-3 font-sora text-sm font-extrabold text-brandDarkNavy">{tickets.length === 0 ? `No tickets assigned to ${department} right now.` : 'No tickets in this queue'}</p>{tickets.length > 0 && <p className="mt-1 text-[10px] font-semibold text-slate-400">Choose another queue to see more work.</p>}</div>
                  : <div className="max-h-[620px] overflow-auto">
                    <table className="w-full min-w-[1050px] text-left">
                      <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                        <tr className="border-b border-slate-200 text-[8px] uppercase tracking-[0.14em] text-slate-400">
                          <th className="px-5 py-3">Ticket</th>
                          <th className="px-4 py-3">Owner</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Requester</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTickets.map((ticket) => <tr key={ticket.ticket_id} className="group transition-colors duration-200 hover:bg-blue-50/45">
                          <td className="px-5 py-3.5"><p className="font-sora text-[10px] font-extrabold text-brandNavy">#{ticket.ticket_id}</p><p className="mt-0.5 max-w-[240px] truncate text-[11px] font-bold text-slate-700">{ticket.title}</p></td>
                          <td className="px-4 py-3.5 text-[10px] font-semibold text-slate-600">{getTicketOwnerName(ticket) || 'Unclaimed'}</td>
                          <td className="px-4 py-3.5"><span className={`inline-flex min-w-[78px] justify-center rounded-full border px-2.5 py-1 text-[8px] font-extrabold ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
                          <td className="px-4 py-3.5"><span className={`inline-flex min-w-[54px] justify-center rounded-full border px-2.5 py-1 text-[8px] font-extrabold ${priorityClass(ticket.priority)}`}>{ticket.priority}</span></td>
                          <td className="px-4 py-3.5 text-[10px] font-semibold text-slate-600">{ticket.category_name || `#${ticket.category_id}`}</td>
                          <td className="px-4 py-3.5 text-[10px] font-semibold text-slate-600">{ticket.vendor_name || ticket.raised_by}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[9px] font-bold text-slate-500">{formatDate(ticket.created_at)}</td>
                          <td className="px-4 py-3.5 text-right"><button onClick={() => openDetails(ticket)} className="rounded-lg border border-brandNavy bg-brandNavy px-3 py-1.5 text-[8px] font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-brandRed hover:bg-brandRed hover:shadow-md">Process / View</button></td>
                        </tr>)}
                      </tbody>
                    </table>
                  </div>}
          </div>

        </section>
      </main>

      {selectedTicket && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-brandDarkNavy/45 p-4 backdrop-blur-sm sm:p-6"><button aria-label="Close details" className="absolute inset-0 cursor-default" onClick={closeDetails} /><div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,27,76,0.24)]"><div className="h-1 bg-gradient-to-r from-brandNavy via-blue-600 to-brandRed" /><div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4"><div><p className="text-[9px] font-extrabold uppercase tracking-widest text-brandRed">Process Ticket #{selectedTicket.ticket_id}</p><h2 className="mt-1 font-sora text-xl font-extrabold text-brandDarkNavy">{selectedTicket.title}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{selectedTicket.assigned_department || department} | {getTicketOwnerName(selectedTicket) ? `Owned by ${getTicketOwnerName(selectedTicket)}` : 'Unclaimed'}</p></div><button onClick={closeDetails} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-500">Close</button></div>
        <div className="grid flex-1 overflow-y-auto lg:grid-cols-2">
          <section className="space-y-4 p-5">{detailsLoading && <p className="rounded-xl bg-blue-50 p-3 text-xs font-bold text-brandNavy">Refreshing complete ticket details...</p>}
            <div className="grid grid-cols-2 gap-3">{[['Requester', selectedTicket.vendor_name || selectedTicket.raised_by], ['Category', selectedTicket.category_name || `#${selectedTicket.category_id}`], ['Status', selectedTicket.status], ['Priority', selectedTicket.priority]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-extrabold text-brandDarkNavy">{value}</p></div>)}</div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Ticket Summary</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selectedTicket.description}</p></div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Attachment</p>{selectedTicket.has_attachment ? <div className="mt-2 flex items-center justify-between gap-3"><p className="truncate text-xs font-bold text-slate-700">{attachmentName(selectedTicket.attachment_path)}</p><button onClick={() => downloadAttachment(selectedTicket.attachment_path)} className="rounded-xl bg-brandNavy px-3 py-2 text-[10px] font-extrabold text-white">Download</button></div> : <p className="mt-2 text-xs font-bold text-slate-400">No attachment uploaded.</p>}</div>
            {(selectedTicket.resolution_summary || selectedTicket.root_cause) && <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-[9px] font-extrabold uppercase text-emerald-700">Resolution Details</p><div className="mt-3 space-y-2 text-xs font-semibold text-slate-700"><p><b>Summary:</b> {selectedTicket.resolution_summary}</p><p><b>Root cause:</b> {selectedTicket.root_cause}</p><p><b>Actions taken:</b> {selectedTicket.action_taken}</p><p className="text-[10px] text-slate-400">Resolved by {selectedTicket.resolved_by || selectedTicket.resolution_submitted_by} on {formatDate(selectedTicket.resolved_at)}</p></div></div>}
            <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Activity Timeline</p><div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{(selectedTicket.activity || []).map((item) => <div key={item.activity_id} className="relative border-l-2 border-brandNavy/15 pl-4"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-brandRed" /><p className="text-xs font-extrabold text-brandDarkNavy">{item.action_text}</p><p className="mt-1 text-[9px] font-semibold text-slate-400">{item.actor_name || 'System'} | {formatDate(item.created_at)}</p></div>)}</div></div>
          </section>

          <aside className="space-y-4 border-t border-slate-200 bg-slate-100/50 p-5 lg:border-l lg:border-t-0">
            <div className="rounded-2xl border border-white bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Ownership</p><div className="mt-2 flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-brandDarkNavy">{getTicketOwnerName(selectedTicket) || 'Available to claim'}</p><p className="mt-1 text-[9px] font-semibold text-slate-400">{selectedTicket.claimed_at ? `Claimed ${formatDate(selectedTicket.claimed_at)}` : 'No department owner'}</p></div>{isUnclaimed(selectedTicket) ? <button disabled={!!working} onClick={claimTicket} className="rounded-xl bg-brandNavy px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{working === 'claim' ? 'Claiming...' : 'Claim Ticket'}</button> : selectedIsMine ? <button disabled={!!working} onClick={releaseTicket} className="rounded-xl border border-brandRed/20 px-4 py-2.5 text-xs font-extrabold text-brandRed disabled:opacity-50">{working === 'release' ? 'Releasing...' : 'Release'}</button> : null}</div></div>
            <div className="grid grid-cols-2 gap-3"><label className="rounded-2xl bg-white p-4"><span className="mb-2 block text-[9px] font-extrabold uppercase text-slate-400">Update Status</span><select value={selectedTicket.status} disabled={!!working} onChange={(event) => updateStatus(event.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-bold">{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="rounded-2xl bg-white p-4"><span className="mb-2 block text-[9px] font-extrabold uppercase text-slate-400">Update Priority</span><select value={selectedTicket.priority} disabled={!!working} onChange={(event) => updatePriority(event.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-bold">{PRIORITY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
            {showResolutionForm && <form onSubmit={submitResolution} className="rounded-2xl border border-emerald-100 bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-emerald-700">Resolution Form</p>{[['root_cause', 'Root cause'], ['action_taken', 'Actions taken'], ['resolution_summary', 'Resolution summary'], ['resolution_remarks', 'Optional remarks']].map(([key, label]) => <label key={key} className="mt-3 block"><span className="mb-1 block text-[9px] font-extrabold uppercase text-slate-400">{label}</span><textarea required={key !== 'resolution_remarks'} value={resolutionForm[key]} onChange={(event) => setResolutionForm((prev) => ({ ...prev, [key]: event.target.value }))} className="min-h-[70px] w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-semibold" /></label>)}<div className="mt-3 space-y-2">{CHECKLIST_ITEMS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={resolutionForm.checklist[key]} onChange={(event) => setResolutionForm((prev) => ({ ...prev, checklist: { ...prev.checklist, [key]: event.target.checked } }))} />{label}</label>)}</div><button disabled={!!working || !Object.values(resolutionForm.checklist).every(Boolean)} className="mt-4 w-full rounded-xl bg-brandRed px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{working === 'resolve' ? 'Resolving...' : 'Resolve Ticket'}</button></form>}
            {isResolved(selectedTicket) && <form onSubmit={reopenTicket} className="rounded-2xl bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Reopen Ticket</p><textarea required value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="Mandatory reason for reopening..." className="mt-2 min-h-[70px] w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-semibold" /><button disabled={!!working} className="mt-2 w-full rounded-xl bg-brandNavy px-4 py-3 text-xs font-extrabold text-white">{working === 'reopen' ? 'Reopening...' : `Reopen Ticket (${selectedTicket.reopened_count || 0} prior)`}</button></form>}
            <form onSubmit={saveInternalNote} className="rounded-2xl bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Internal Department Notes</p><textarea required value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Visible only to admin and department users..." className="mt-2 min-h-[80px] w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-semibold" /><button disabled={!!working || !noteText.trim()} className="mt-2 w-full rounded-xl bg-brandNavy px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{working === 'note' ? 'Saving...' : 'Add Internal Note'}</button><div className="mt-3 max-h-44 space-y-2 overflow-y-auto">{(selectedTicket.internal_notes || []).map((note) => <div key={note.note_id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">{note.note_text}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{note.created_by_name} | {formatDate(note.created_at)}</p></div>)}</div></form>
            <form onSubmit={submitEscalation} className="rounded-2xl bg-white p-4"><p className="text-[9px] font-extrabold uppercase text-slate-400">Escalate / Reassign</p><select required value={escalationForm.target_department} onChange={(event) => setEscalationForm((prev) => ({ ...prev, target_department: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-xs font-bold"><option value="">Target department</option>{availableDepartments.map((item) => <option key={item}>{item}</option>)}</select><textarea required value={escalationForm.reason} onChange={(event) => setEscalationForm((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Mandatory escalation reason..." className="mt-2 min-h-[70px] w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-semibold" /><button disabled={!!working} className="mt-2 w-full rounded-xl bg-brandRed px-4 py-3 text-xs font-extrabold text-white">{working === 'escalate' ? 'Transferring...' : 'Transfer Ticket'}</button>{(selectedTicket.escalations || []).length > 0 && <div className="mt-3 space-y-2">{selectedTicket.escalations.map((item) => <div key={item.escalation_id} className="rounded-xl bg-red-50/60 p-3 text-[10px] font-semibold text-slate-600"><b>{item.from_department} to {item.to_department}</b><p className="mt-1">{item.reason}</p><p className="mt-1 text-slate-400">{formatDate(item.created_at)}</p></div>)}</div>}</form>
          </aside>
        </div></div></div>}
    </div>
  );
};

export default DepartmentDashboard;
