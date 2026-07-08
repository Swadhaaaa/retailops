import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const STATUS_OPTIONS = ['Open', 'Under Review', 'In Progress', 'Needs Clarification', 'Resolved', 'Closed'];
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

const DepartmentDashboard = () => {
  const { user: contextUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = useMemo(() => getCurrentUser(contextUser), [contextUser]);

  const normalizeTicketDetail = (ticket) => {
    if (!ticket) return ticket;

    const rawMessages = Array.isArray(ticket.messages)
      ? ticket.messages
      : Array.isArray(ticket.comments)
        ? ticket.comments
        : [];

    const normalizedMessages = rawMessages.map((msg) => {
      const body = msg.body || msg.message_text || msg.content || msg.message || '';
      const attachmentPath = msg.attachment_path || msg.stored_path || msg.file_path || null;
      const isCurrentUser = user && (String(msg.author_id) === String(user.user_id) || String(msg.author_id) === String(user.email));
      const senderRole = msg.sender_role || (isCurrentUser ? 'user' : 'admin');

      return {
        ...msg,
        message_text: body,
        sender_role: senderRole,
        created_at: msg.created_at || msg.createdAt || msg.timestamp,
        attachment_path: attachmentPath,
        has_attachment: Boolean(attachmentPath),
        author_name: msg.author_name || msg.sender_name || msg.author_id || (senderRole === 'admin' ? 'Support' : 'You')
      };
    });

    const normalizedAttachments = Array.isArray(ticket.attachments)
      ? ticket.attachments.map((item) => ({
        ...item,
        stored_path: item.stored_path || item.attachment_path || item.path || item.file_path || null,
        file_name: item.file_name || item.name || item.original_name || item.filename || 'Attachment'
      }))
      : [];

    return {
      ...ticket,
      messages: normalizedMessages,
      comments: normalizedMessages,
      attachments: normalizedAttachments,
      attachment_path: ticket.attachment_path || normalizedAttachments[0]?.stored_path || null,
      has_attachment: Boolean(ticket.has_attachment || ticket.attachment_path || normalizedAttachments.length)
    };
  };
  const department = getDepartmentName(user);
  const userDisplayName = getUserDisplayName(user);
  const userRoleLabel = getUserRoleLabel(user);

  const [tickets, setTickets] = useState([]);
  const [departmentAgents, setDepartmentAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('queue');
  const [queue, setQueue] = useState('All Tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [working, setWorking] = useState('');
  const [noteText, setNoteText] = useState('');
  const [clarificationNote, setClarificationNote] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({
    resolution_summary: '', root_cause: '', action_taken: '', resolution_remarks: '',
    checklist: { documents_verified: false, issue_investigated: false, requester_updated: false, final_confirmation_done: false }
  });
  const [transferForm, setTransferForm] = useState({ target_agent: '' });
  const [reopenReason, setReopenReason] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

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
    api.get('/users/agents').then((response) => {
      setDepartmentAgents(response.data || []);
    }).catch((err) => console.error('Department users fetch failed:', err));
    const interval = setInterval(() => fetchTickets({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, [department, fetchTickets]);

  const refreshSelectedTicket = async (ticketId = selectedTicket?.ticket_id) => {
    if (!ticketId) return;
    const response = await api.get(`/tickets/${ticketId}`);
    setSelectedTicket(normalizeTicketDetail(response.data));
  };

  const openDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailsLoading(true);
    setNoteText('');
    setClarificationNote('');
    setShowResolutionForm(false);
    setTransferForm({ target_agent: '' });
    setReopenReason('');
    try { await refreshSelectedTicket(ticket.ticket_id); }
    catch (err) { alert(err.response?.data?.error || 'Unable to open ticket details.'); }
    finally { setDetailsLoading(false); }
  };

  const closeDetails = () => {
    setSelectedTicket(null);
    setNoteText('');
    setClarificationNote('');
    setShowResolutionForm(false);
    setTransferForm({ target_agent: '' });
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
    if (queue === 'Clarified by User') queueMatch = ticket.has_user_clarification && !isResolved(ticket);
    if (queue === 'Escalated') queueMatch = Number(ticket.escalation_count || 0) > 0;
    if (queue === 'Resolved') queueMatch = isResolved(ticket);
    return queueMatch;
  }), [tickets, queue, user.user_id]);
  const clarifiedTickets = useMemo(() => tickets.filter((ticket) => ticket.has_user_clarification && !isResolved(ticket)), [tickets]);

  const workload = useMemo(() => calculateWorkload(tickets), [tickets]);
  const analytics = useMemo(() => {
    const countBy = (key) => Object.entries(tickets.reduce((result, ticket) => {
      const value = ticket[key] || 'Unspecified';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {}));
    const statusRows = ['Open', 'In Progress', 'Under Review', 'Needs Clarification', 'Resolved', 'Closed']
      .map((status) => [status, tickets.filter((ticket) => ticket.status === status).length])
      .filter(([, count]) => count > 0);

    return {
      categoryRows: countBy('category_name'),
      statusRows,
      statusTotal: statusRows.reduce((sum, [, count]) => sum + count, 0),
      active: tickets.filter((ticket) => !isResolved(ticket)).length,
      resolved: tickets.filter(isResolved).length,
      unclaimed: tickets.filter(isUnclaimed).length
    };
  }, [tickets]);
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 27, 76, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
        padding: 12,
        cornerRadius: 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 10, weight: '700' } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        ticks: { precision: 0, color: '#64748B', font: { size: 10, weight: '700' } }
      }
    }
  }), []);
  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 27, 76, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        displayColors: false,
        padding: 12,
        cornerRadius: 12
      }
    }
  }), []);
  const categoryChartData = useMemo(() => ({
    labels: analytics.categoryRows.map(([label]) => label),
    datasets: [{
      data: analytics.categoryRows.map(([, count]) => count),
      backgroundColor: 'rgba(15, 27, 76, 0.82)',
      borderColor: '#0F1B4C',
      borderRadius: 12,
      borderSkipped: false,
      maxBarThickness: 46
    }]
  }), [analytics.categoryRows]);
  const statusChartData = useMemo(() => ({
    labels: analytics.statusRows.map(([label]) => label),
    datasets: [{
      data: analytics.statusRows.map(([, count]) => count),
      backgroundColor: ['#E31837', '#2563EB', '#F59E0B', '#FBBF24', '#059669', '#64748B'],
      borderColor: '#ffffff',
      borderWidth: 4
    }]
  }), [analytics.statusRows]);

  const selectedIsMine = selectedTicket?.claimed_by === user.user_id;
  const selectedIsResolved = selectedTicket ? isResolved(selectedTicket) : false;
  const availableAgents = selectedTicket ? departmentAgents.filter((agent) => {
    const owner = getTicketOwnerName(selectedTicket);
    return agent.name && agent.name !== owner;
  }) : [];

  const updateStatus = (status) => {
    if (status === 'Resolved') { setShowResolutionForm(true); return; }
    runAction('status', () => api.put(`/tickets/${selectedTicket.ticket_id}/status`, { status }));
  };

  const sendClarificationNote = (event) => {
    event.preventDefault();
    if (!clarificationNote.trim()) return;
    runAction(
      'clarification-note',
      () => api.put(`/tickets/${selectedTicket.ticket_id}/status`, {
        status: 'Needs Clarification',
        clarification_note: clarificationNote.trim()
      }),
      { onSuccess: () => setClarificationNote('') }
    );
  };

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

  const submitTransfer = (event) => {
    event.preventDefault();
    runAction('transfer', () => api.put(`/tickets/${selectedTicket.ticket_id}/assign`, { agent: transferForm.target_agent }), { close: true });
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
            <button type="button" onClick={() => { setActiveView('queue'); setQueue('All Tickets'); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-extrabold transition-all duration-200 ${activeView === 'queue' && queue === 'All Tickets' ? 'border border-blue-200 bg-blue-50 text-brandNavy shadow-sm' : 'text-slate-600 hover:bg-blue-50 hover:text-brandNavy'}`}><span>Department Overview</span><span className="text-[9px]">{queueCounts['All Tickets']}</span></button>
            <button type="button" onClick={() => { setActiveView('queue'); setQueue('New / Unclaimed'); }} className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${activeView === 'queue' && queue === 'New / Unclaimed' ? 'bg-red-50 text-brandRed' : 'text-slate-500 hover:bg-slate-50 hover:text-brandNavy'}`}><span>New / Unclaimed</span><span className="text-[9px] font-extrabold">{queueCounts['New / Unclaimed']}</span></button>
            <button type="button" onClick={() => { setActiveView('queue'); setQueue('Assigned to Me'); }} className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${activeView === 'queue' && queue === 'Assigned to Me' ? 'bg-blue-50 text-brandNavy' : 'text-slate-500 hover:bg-slate-50 hover:text-brandNavy'}`}><span>Assigned to Me</span><span className="text-[9px] font-extrabold">{queueCounts['Assigned to Me']}</span></button>
          </div>
          <div><p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Ticket Views</p>{['In Progress', 'Waiting for User', 'Escalated', 'Resolved'].map((item) => <button type="button" key={item} onClick={() => { setActiveView('queue'); setQueue(item); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${activeView === 'queue' && queue === item ? 'border-l-[3px] border-brandRed bg-red-50 text-brandRed' : 'text-slate-500 hover:bg-slate-50 hover:text-brandNavy'}`}><span>{item}</span><span className="text-[9px] font-extrabold">{queueCounts[item]}</span></button>)}</div>
          <div><p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Reports</p><button type="button" onClick={() => setActiveView('analytics')} className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 ${activeView === 'analytics' ? 'border border-brandNavy/20 bg-blue-50 text-brandNavy' : 'text-slate-500 hover:bg-blue-50 hover:text-brandNavy'}`}>Analytics</button></div>
        </nav>
        <div className="border-t border-slate-100 p-4"><button type="button" onClick={handleLogout} className="w-full rounded-2xl border border-brandRed/15 bg-brandRed/5 px-3 py-3 text-center text-xs font-extrabold text-brandRed transition-all duration-200 hover:border-brandRed/25 hover:bg-brandRed/10">Sign Out</button></div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl lg:ml-64">
        <div className="mx-auto flex h-[72px] max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-3">
            <img src={relianceLogo} alt="Reliance Retail" className="h-8 w-auto lg:hidden" />
          </div>
          <div className="flex items-center gap-2">
            {clarifiedTickets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveView('queue');
                  setQueue('Clarified by User');
                }}
                className="relative rounded-xl border border-brandRed/20 bg-red-50 px-3 py-2 text-[10px] font-extrabold text-brandRed transition hover:bg-red-100"
              >
                User clarified
                <span className="ml-2 rounded-full bg-brandRed px-1.5 py-0.5 text-[8px] text-white">{clarifiedTickets.length}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-left transition hover:border-brandNavy/25 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-brandNavy/20"
              aria-label="Open department user profile"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brandNavy text-[10px] font-extrabold text-white">{userDisplayName.charAt(0).toUpperCase()}</span>
              <span className="hidden sm:block">
                <span className="block max-w-[120px] truncate text-[10px] font-extrabold text-brandDarkNavy">{userDisplayName}</span>
                <span className="block text-[8px] font-semibold text-slate-400">{userRoleLabel}</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brandDarkNavy/40 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close department user profile"
            onClick={() => setShowProfileModal(false)}
          />
          <section className="relative w-full max-w-sm rounded-[24px] border border-white/70 bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500 transition hover:bg-brandRed hover:text-white"
              aria-label="Close profile"
            >
              x
            </button>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brandNavy text-base font-extrabold text-white">{userDisplayName.charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <h2 className="truncate font-sora text-base font-extrabold text-brandDarkNavy">{userDisplayName}</h2>
                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{userRoleLabel}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Email', user?.email || 'Not available'],
                ['Department', department],
                ['Role', userRoleLabel]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-xs font-bold text-brandDarkNavy">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-[1500px] space-y-5 bg-white px-5 py-6 lg:ml-64">
        {activeView === 'analytics' ? (
          <>
            <section className="rounded-[20px] border border-brandRed/25 bg-gradient-to-r from-white to-blue-50/35 p-5 shadow-[0_12px_32px_rgba(15,27,76,0.055)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brandRed">{department.toUpperCase()} Reports</p>
              <h1 className="mt-1 font-sora text-2xl font-extrabold text-brandDarkNavy">Analytics Summary</h1>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Total Tickets', tickets.length, 'text-brandNavy'],
                ['Active Work', analytics.active, 'text-brandRed'],
                ['Resolved', analytics.resolved, 'text-emerald-600'],
                ['Unclaimed', analytics.unclaimed, 'text-amber-600']
              ].map(([label, value, tone]) => <div key={label} className="rounded-[18px] border border-brandRed/25 bg-white p-4 shadow-[0_8px_24px_rgba(15,27,76,0.045)]"><div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-brandNavy to-brandRed" /><p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-2 font-sora text-3xl font-extrabold ${tone}`}>{value}</p></div>)}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[20px] border border-brandNavy/25 bg-white p-5 shadow-[0_12px_35px_rgba(15,27,76,0.055)]">
                <h2 className="font-sora text-base font-extrabold text-brandDarkNavy">Tickets by Category</h2>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">Distribution of assigned tickets by category.</p>
                <div className="mt-5 h-72">
                  {analytics.categoryRows.length ? <Bar data={categoryChartData} options={chartOptions} /> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">No category data available</div>}
                </div>
              </div>

              <div className="rounded-[20px] border border-brandRed/25 bg-white p-5 shadow-[0_12px_35px_rgba(15,27,76,0.055)]">
                <h2 className="font-sora text-base font-extrabold text-brandDarkNavy">Status Summary</h2>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">How department tickets are distributed by status.</p>
                <div className="mt-5 h-72">
                  {analytics.statusRows.length ? <Bar data={statusChartData} options={chartOptions} /> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">No status data available</div>}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-[20px] border border-brandNavy/25 bg-white p-5 shadow-[0_12px_35px_rgba(15,27,76,0.055)]">
                <h2 className="font-sora text-base font-extrabold text-brandDarkNavy">Status Split</h2>
                <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
                  <div className="relative h-64">
                    {analytics.statusRows.length ? <>
                      <Doughnut data={statusChartData} options={doughnutOptions} />
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-sora text-2xl font-extrabold text-brandNavy">{analytics.statusTotal}</span>
                        <span className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Tickets</span>
                      </div>
                    </> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">No status data available</div>}
                  </div>
                  <div className="space-y-2.5">
                    {analytics.statusRows.map(([label, count], index) => {
                      const percent = analytics.statusTotal ? Math.round((count / analytics.statusTotal) * 100) : 0;
                      const colors = ['bg-brandRed', 'bg-blue-600', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-600', 'bg-slate-500'];
                      return <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">{label}</span>
                          </div>
                          <span className="font-sora text-xs font-extrabold text-brandNavy">{count} ({percent}%)</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                          <div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>;
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-brandRed/25 bg-white p-5 shadow-[0_12px_35px_rgba(15,27,76,0.055)]">
                <h2 className="font-sora text-base font-extrabold text-brandDarkNavy">Status Counts</h2>
                <div className="mt-5 space-y-3">
                  {analytics.statusRows.length ? analytics.statusRows.map(([label, count], index) => <div key={label} className={`flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-sm ${index % 2 === 0 ? 'border-brandRed/25' : 'border-brandNavy/25'}`}><span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span><span className="font-sora text-sm font-extrabold text-brandNavy">{count}</span></div>) : <p className="text-xs font-bold text-slate-400">No status data available.</p>}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-stretch">
              <div className="flex flex-col justify-center rounded-[20px] border border-brandRed/25 bg-gradient-to-r from-white to-blue-50/35 p-5 shadow-[0_12px_32px_rgba(15,27,76,0.055)] transition-shadow duration-200 hover:border-brandRed/35 hover:shadow-[0_16px_36px_rgba(15,27,76,0.08)]">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brandRed">{department.toUpperCase()} Operations</p>
                <h1 className="mt-1 font-sora text-2xl font-extrabold text-brandDarkNavy">{department} Department</h1>
                <p className="mt-1 text-xs font-semibold text-slate-500">Manage {department} tickets assigned to your department in real time.</p>
              </div>

              <div className="w-full">
                <div className="relative flex h-full min-h-[132px] flex-col overflow-hidden rounded-[20px] border border-brandRed/25 bg-gradient-to-br from-red-50 via-rose-50/80 to-white p-4 shadow-[0_14px_34px_rgba(227,24,55,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brandRed/35 hover:shadow-[0_18px_40px_rgba(227,24,55,0.12)]">
                  <span className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-brandRed/[0.05]" />
                  <div className="relative">
                    <p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-brandRed/75">Department Workload</p>
                  </div>
                  <div className="relative mt-3 grid flex-1 grid-cols-2 gap-2.5">
                    <div className="flex flex-col justify-center rounded-xl border border-brandRed/25 bg-white/70 px-3 py-2.5">
                      <p className="font-sora text-2xl font-extrabold leading-none text-brandRed">{workload.owners.reduce((sum, [, count]) => sum + count, 0)}</p>
                      <p className="mt-1.5 text-[8px] font-extrabold uppercase tracking-wider text-brandRed/60">Active</p>
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-brandRed/25 bg-brandNavy/[0.06] px-3 py-2.5">
                      <p className="font-sora text-2xl font-extrabold leading-none text-brandNavy">{workload.unclaimed}</p>
                      <p className="mt-1.5 text-[8px] font-extrabold uppercase tracking-wider text-brandNavy/55">Unclaimed</p>
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
              ].map(([label, value, tone]) => <div key={label} className="rounded-[18px] border border-brandRed/25 bg-white p-4 shadow-[0_8px_24px_rgba(15,27,76,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brandRed/35 hover:shadow-[0_12px_28px_rgba(15,27,76,0.08)]"><div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-brandNavy to-brandRed" /><p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-2 font-sora text-3xl font-extrabold ${tone}`}>{value}</p></div>)}
            </section>

            {clarifiedTickets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveView('queue');
                  setQueue('Clarified by User');
                }}
                className="flex w-full items-center justify-between rounded-xl border border-brandNavy/20 bg-blue-50/70 px-4 py-2.5 text-left shadow-sm transition hover:border-brandNavy/35 hover:bg-blue-50"
              >
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-brandNavy">User Clarified</p>
                  <p className="mt-0.5 text-xs font-bold text-brandDarkNavy">
                    {clarifiedTickets.length} {clarifiedTickets.length === 1 ? 'ticket has' : 'tickets have'} new clarification from user.
                  </p>
                </div>
                <span className="rounded-lg bg-brandNavy px-3 py-1.5 text-[10px] font-extrabold text-white">View</span>
              </button>
            )}

            <section>
              <div className="min-w-0 overflow-hidden rounded-[20px] border border-brandRed/25 bg-white shadow-[0_12px_35px_rgba(15,27,76,0.055)]">
                <div className="border-b border-slate-100 p-4">
                  <div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-brandRed">Live Department Queue</p><h3 className="mt-1 font-sora text-base font-extrabold text-brandDarkNavy">{queue}</h3></div>
                </div>

                {loading ? <div className="flex min-h-[280px] flex-col items-center justify-center text-center"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-100 border-t-brandNavy" /><p className="mt-3 text-xs font-extrabold text-brandDarkNavy">Loading {department} tickets</p><p className="mt-1 text-[10px] font-semibold text-slate-400">Synchronizing the latest department queue...</p></div>
                  : error ? <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-brandRed"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 16.5h.01" /></svg></span><p className="mt-3 text-xs font-extrabold text-brandDarkNavy">{error}</p><button onClick={() => fetchTickets()} className="mt-3 rounded-xl bg-brandNavy px-4 py-2 text-[10px] font-extrabold text-white transition-all duration-200 hover:bg-brandRed">Try Again</button></div>
                    : filteredTickets.length === 0 ? <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brandNavy"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75Z M8.25 9h7.5" /></svg></span><p className="mt-3 font-sora text-sm font-extrabold text-brandDarkNavy">{tickets.length === 0 ? `No tickets assigned to ${department} right now.` : 'No tickets in this queue'}</p>{tickets.length > 0 && <p className="mt-1 text-[10px] font-semibold text-slate-400">Choose another queue to see more work.</p>}</div>
                      : <div className="max-h-[620px] overflow-auto">
                        <table className="w-full min-w-[1050px] text-left">
                          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                            <tr className="border-b border-slate-200 text-[9px] uppercase tracking-[0.14em] text-slate-400">
                              <th className="px-5 py-3">Ticket</th>
                              <th className="px-4 py-3">Owner</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Category</th>
                              <th className="px-4 py-3">Requester</th>
                              <th className="px-4 py-3">Created</th>
                              <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredTickets.map((ticket) => <tr key={ticket.ticket_id} className="group transition-colors duration-200 hover:bg-blue-50/45">
                              <td className="px-5 py-3.5"><p className="font-sora text-[11px] font-extrabold text-brandNavy">#{ticket.ticket_id}</p><p className="mt-0.5 max-w-[240px] truncate text-xs font-bold text-slate-700">{ticket.title}</p></td>
                              <td className="px-4 py-3.5 text-[11px] font-semibold text-slate-600">{getTicketOwnerName(ticket) || 'Unclaimed'}</td>
                              <td className="px-4 py-3.5"><span className={`inline-flex min-w-[82px] justify-center rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
                              <td className="px-4 py-3.5 text-[11px] font-semibold text-slate-600">{ticket.category_name || `#${ticket.category_id}`}</td>
                              <td className="px-4 py-3.5 text-[11px] font-semibold text-slate-600">{ticket.vendor_name || ticket.raised_by}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-[10px] font-bold text-slate-500">{formatDate(ticket.created_at)}</td>
                              <td className="px-4 py-3.5 text-center"><button onClick={() => openDetails(ticket)} className="min-w-[112px] rounded-lg border border-brandNavy bg-brandNavy px-3 py-1.5 text-[9px] font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-brandRed hover:bg-brandRed hover:shadow-md">Process / View</button></td>
                            </tr>)}
                          </tbody>
                        </table>
                      </div>}
              </div>

            </section>
          </>
        )}
      </main>

      {selectedTicket && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-brandDarkNavy/45 p-3 backdrop-blur-sm sm:p-5"><button aria-label="Close details" className="absolute inset-0 cursor-default" onClick={closeDetails} /><div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-brandRed/25 bg-white shadow-[0_28px_80px_rgba(15,27,76,0.24)]"><div className="h-1 bg-gradient-to-r from-brandNavy via-blue-600 to-brandRed" /><div className="flex items-start justify-between border-b border-brandRed/20 bg-white px-5 py-2.5"><div><p className="text-[9px] font-extrabold uppercase tracking-widest text-brandRed">Process Ticket #{selectedTicket.ticket_id}</p><h2 className="mt-0.5 font-sora text-lg font-extrabold text-brandDarkNavy">{selectedTicket.title}</h2><p className="mt-0.5 text-xs font-semibold text-slate-500">{selectedTicket.assigned_department || department} | {getTicketOwnerName(selectedTicket) ? `Owned by ${getTicketOwnerName(selectedTicket)}` : 'Unclaimed'}</p></div><button onClick={closeDetails} aria-label="Close details" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-red-50 hover:text-brandRed"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.4" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button></div>
        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-2.5 p-3">{detailsLoading && <p className="rounded-lg bg-blue-50 p-2 text-xs font-bold text-brandNavy">Refreshing complete ticket details...</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{[['Requester', selectedTicket.vendor_name || selectedTicket.raised_by], ['Category', selectedTicket.category_name || `#${selectedTicket.category_id}`], ['Status', selectedTicket.status]].map(([label, value]) => <div key={label} className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-extrabold text-brandDarkNavy" title={value}>{value}</p></div>)}</div>
            <div className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Ticket Summary</p><p className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">{selectedTicket.description}</p></div>
            <div className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Attachment</p>{selectedTicket.has_attachment ? <div className="mt-1.5 flex items-center justify-between gap-3"><p className="truncate text-xs font-bold text-slate-700">{attachmentName(selectedTicket.attachment_path)}</p><button onClick={() => downloadAttachment(selectedTicket.attachment_path)} className="rounded-md bg-brandNavy px-3 py-1.5 text-[10px] font-extrabold text-white">Download</button></div> : <p className="mt-1.5 text-xs font-bold text-slate-400">No attachment uploaded.</p>}</div>
            {(selectedTicket.resolution_summary || selectedTicket.root_cause) && <div className="rounded-lg border border-brandRed/25 bg-emerald-50/60 px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-emerald-700">Resolution Details</p><div className="mt-1.5 space-y-1 text-xs font-semibold text-slate-700"><p><b>Summary:</b> {selectedTicket.resolution_summary}</p><p><b>Root cause:</b> {selectedTicket.root_cause}</p><p><b>Actions taken:</b> {selectedTicket.action_taken}</p><p className="text-[10px] text-slate-400">Resolved by {selectedTicket.resolved_by || selectedTicket.resolution_submitted_by} on {formatDate(selectedTicket.resolved_at)}</p></div></div>}
            <div className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Activity Timeline</p><div className="mt-2 max-h-56 space-y-2 overflow-y-auto">{(selectedTicket.activity || []).map((item) => <div key={item.activity_id} className="relative border-l-2 border-brandNavy/15 pl-3"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-brandRed" /><p className="text-xs font-extrabold text-brandDarkNavy">{item.action_text}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{item.actor_name || 'System'} | {formatDate(item.created_at)}</p></div>)}</div></div>
          </section>

          <aside className="space-y-2.5 border-t border-brandRed/20 bg-slate-100/50 p-3 lg:border-l lg:border-t-0">
            <div className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Ownership</p><div className="mt-1.5 flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-brandDarkNavy">{selectedIsResolved ? 'Released after resolution' : getTicketOwnerName(selectedTicket) || 'Available to claim'}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{selectedIsResolved ? 'No active department owner' : selectedTicket.claimed_at ? `Claimed ${formatDate(selectedTicket.claimed_at)}` : 'No department owner'}</p></div>{selectedIsResolved ? null : isUnclaimed(selectedTicket) ? <button disabled={!!working} onClick={claimTicket} className="rounded-md bg-brandNavy px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-50">{working === 'claim' ? 'Claiming...' : 'Claim Ticket'}</button> : selectedIsMine ? <button disabled={!!working} onClick={releaseTicket} className="rounded-md border border-brandRed/20 px-3 py-1.5 text-xs font-extrabold text-brandRed disabled:opacity-50">{working === 'release' ? 'Releasing...' : 'Release'}</button> : null}</div></div>
            <label className="block rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><span className="mb-1.5 block text-[8px] font-extrabold uppercase text-slate-400">Update Status</span><select value={selectedTicket.status} disabled={!!working} onChange={(event) => updateStatus(event.target.value)} className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-bold">{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
            {selectedTicket.status === 'Needs Clarification' && <form onSubmit={sendClarificationNote} className="rounded-lg border border-brandRed/25 bg-red-50/40 px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-brandRed">Note to User</p><textarea required value={clarificationNote} onChange={(event) => setClarificationNote(event.target.value)} placeholder="Tell the user what details are needed..." className="mt-1.5 min-h-[48px] w-full resize-none rounded-md border border-brandRed/20 bg-white p-2 text-xs font-semibold outline-none focus:border-brandRed" /><button disabled={!!working || !clarificationNote.trim()} className="mt-2 w-full rounded-md bg-brandRed px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{working === 'clarification-note' ? 'Sending...' : 'Send Note to User'}</button></form>}
            {showResolutionForm && <form onSubmit={submitResolution} className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-emerald-700">Resolution Form</p>{[['root_cause', 'Root cause'], ['action_taken', 'Actions taken'], ['resolution_summary', 'Resolution summary'], ['resolution_remarks', 'Optional remarks']].map(([key, label]) => <label key={key} className="mt-1.5 block"><span className="mb-1 block text-[8px] font-extrabold uppercase text-slate-400">{label}</span><textarea required={key !== 'resolution_remarks'} value={resolutionForm[key]} onChange={(event) => setResolutionForm((prev) => ({ ...prev, [key]: event.target.value }))} className="min-h-[44px] w-full resize-none rounded-md border border-slate-200 p-2 text-xs font-semibold" /></label>)}<div className="mt-2 space-y-1">{CHECKLIST_ITEMS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={resolutionForm.checklist[key]} onChange={(event) => setResolutionForm((prev) => ({ ...prev, checklist: { ...prev.checklist, [key]: event.target.checked } }))} />{label}</label>)}</div><button disabled={!!working || !Object.values(resolutionForm.checklist).every(Boolean)} className="mt-2.5 w-full rounded-md bg-brandRed px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{working === 'resolve' ? 'Resolving...' : 'Resolve Ticket'}</button></form>}
            {isResolved(selectedTicket) && <form onSubmit={reopenTicket} className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Reopen Ticket</p><textarea required value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} placeholder="Mandatory reason for reopening..." className="mt-1.5 min-h-[44px] w-full resize-none rounded-md border border-slate-200 p-2 text-xs font-semibold" /><button disabled={!!working} className="mt-2 w-full rounded-md bg-brandNavy px-4 py-2 text-xs font-extrabold text-white">{working === 'reopen' ? 'Reopening...' : `Reopen Ticket (${selectedTicket.reopened_count || 0} prior)`}</button></form>}
            <div className="grid gap-2.5 xl:grid-cols-2">
              <form onSubmit={saveInternalNote} className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Internal Department Notes</p><textarea required value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Visible only to admin and department users..." className="mt-1.5 min-h-[48px] w-full resize-none rounded-md border border-slate-200 p-2 text-xs font-semibold" /><button disabled={!!working || !noteText.trim()} className="mt-2 w-full rounded-md bg-brandNavy px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{working === 'note' ? 'Saving...' : 'Add Internal Note'}</button><div className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">{(selectedTicket.internal_notes || []).map((note) => <div key={note.note_id} className="rounded-md border border-brandRed/20 bg-slate-50 p-2"><p className="text-xs font-semibold text-slate-700">{note.note_text}</p><p className="mt-0.5 text-[9px] font-bold text-slate-400">{note.created_by_name} | {formatDate(note.created_at)}</p></div>)}</div></form>
              <form onSubmit={submitTransfer} className="rounded-lg border border-brandRed/25 bg-white px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase text-slate-400">Transfer Within Department</p><select required value={transferForm.target_agent} onChange={(event) => setTransferForm({ target_agent: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-200 p-2 text-xs font-bold"><option value="">Select department user</option>{availableAgents.map((agent) => <option key={agent.email || agent.name} value={agent.name}>{agent.name}</option>)}</select>{availableAgents.length === 0 && <p className="mt-1.5 text-[10px] font-bold text-slate-400">No other users found in {department}.</p>}<button disabled={!!working || !transferForm.target_agent} className="mt-2 w-full rounded-md bg-brandRed px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{working === 'transfer' ? 'Transferring...' : 'Transfer Ticket'}</button></form>
            </div>
          </aside>
        </div></div></div>}
    </div>
  );
};

export default DepartmentDashboard;
