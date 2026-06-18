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

const FALLBACK_DEPARTMENTS = [
  'Finance',
  'IT Support',
  'Compliance',
  'Supply Chain',
  'Logistics',
  'Inventory',
  'Operations'
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

const attachmentName = (filename) => filename?.split('_').slice(1).join('_') || filename || 'Attachment';

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
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionSaving, setResolutionSaving] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({
    resolution_summary: '',
    root_cause: '',
    action_taken: '',
    resolution_remarks: ''
  });
  const [escalationForm, setEscalationForm] = useState({
    target_department: '',
    reason: ''
  });
  const [escalating, setEscalating] = useState(false);

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

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/tickets/departments');
      if (response.data?.length) setDepartments(response.data);
    } catch (err) {
      console.error('Department list fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
    const interval = setInterval(() => fetchTickets({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, []);

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
    try {
      await refreshSelectedTicket(ticket.ticket_id);
    } catch (err) {
      console.error('Ticket details failed:', err);
      alert('Unable to open ticket details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedTicket(null);
    setNoteText('');
    setShowResolutionForm(false);
    setResolutionForm({
      resolution_summary: '',
      root_cause: '',
      action_taken: '',
      resolution_remarks: ''
    });
    setEscalationForm({ target_department: '', reason: '' });
  };

  const updateStatus = async (status) => {
    if (!selectedTicket) return;
    if (status === 'Resolved') {
      setShowResolutionForm(true);
      return;
    }

    setStatusUpdating(true);
    try {
      await api.put(`/tickets/${selectedTicket.ticket_id}/status`, { status });
      await refreshSelectedTicket();
      await fetchTickets({ silent: true });
    } catch (err) {
      console.error('Status update failed:', err);
      alert(err.response?.data?.error || 'Unable to update ticket status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const claimTicket = async () => {
    if (!selectedTicket) return;
    setClaiming(true);
    try {
      await api.post(`/tickets/${selectedTicket.ticket_id}/claim`);
      await refreshSelectedTicket();
      await fetchTickets({ silent: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to claim ticket.');
    } finally {
      setClaiming(false);
    }
  };

  const saveInternalNote = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !noteText.trim()) return;
    setNoteSaving(true);
    try {
      await api.post(`/tickets/${selectedTicket.ticket_id}/notes`, { note_text: noteText.trim() });
      setNoteText('');
      await refreshSelectedTicket();
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to save internal note.');
    } finally {
      setNoteSaving(false);
    }
  };

  const submitResolution = async (event) => {
    event.preventDefault();
    if (!selectedTicket) return;
    setResolutionSaving(true);
    try {
      await api.post(`/tickets/${selectedTicket.ticket_id}/resolve`, resolutionForm);
      setShowResolutionForm(false);
      await refreshSelectedTicket();
      await fetchTickets({ silent: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to submit resolution.');
    } finally {
      setResolutionSaving(false);
    }
  };

  const submitEscalation = async (event) => {
    event.preventDefault();
    if (!selectedTicket) return;
    setEscalating(true);
    try {
      await api.post(`/tickets/${selectedTicket.ticket_id}/reassign-department`, escalationForm);
      setEscalationForm({ target_department: '', reason: '' });
      closeDetails();
      await fetchTickets({ silent: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to transfer ticket.');
    } finally {
      setEscalating(false);
    }
  };

  const downloadAttachment = async (filename) => {
    try {
      const response = await api.get(`/tickets/download/${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachmentName(filename));
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download attachment');
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

  const currentOwner = selectedTicket?.assigned_to;
  const isUnclaimed = !currentOwner || ['Unassigned', selectedTicket?.assigned_department, department].includes(currentOwner);
  const availableDepartments = departments.filter(item => item !== (selectedTicket?.assigned_department || department));

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
          <button type="button" onClick={handleLogout} className="rounded-xl border border-brandNavy/10 bg-white px-4 py-2 text-xs font-extrabold text-brandNavy shadow-sm transition hover:bg-brandNavy hover:text-white">
            Sign Out
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="rounded-[24px] border border-white/70 bg-white/72 p-6 shadow-[0_18px_45px_rgba(15,27,76,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-sora text-2xl font-extrabold text-brandDarkNavy">{department} Ticket Queue</h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">Claim, investigate, resolve, or transfer only tickets assigned to your department.</p>
            </div>
            <span className="self-start rounded-full border border-brandRed/15 bg-brandRed/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-brandRed md:self-auto">
              Structured Department Workflow
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
              <p className="text-[10px] font-semibold text-slate-400">Owner, status, priority, category, requester, and date</p>
            </div>
            <button type="button" onClick={() => fetchTickets()} className="rounded-xl border border-brandNavy/10 bg-white px-3 py-2 text-[10px] font-extrabold text-brandNavy transition hover:bg-brandNavy hover:text-white">
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
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-white/70 bg-white/50 text-[9px] uppercase tracking-widest text-slate-400 font-sora">
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Owner</th>
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
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{ticket.assigned_to || 'Unclaimed'}</td>
                      <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
                      <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${priorityClass(ticket.priority)}`}>{ticket.priority}</span></td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{ticket.category_name || `Category #${ticket.category_id}`}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-600">{ticket.vendor_name || ticket.raised_by}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-500">{formatDate(ticket.created_at)}</td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => openDetails(ticket)} className="rounded-xl bg-brandNavy px-3 py-2 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-brandDarkNavy">
                          Process
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
          <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-brandNavy to-brandRed" />
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-sora">Ticket #{selectedTicket.ticket_id}</p>
                <h3 className="mt-1 truncate font-sora text-xl font-extrabold text-brandDarkNavy">{selectedTicket.title}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Department: {selectedTicket.assigned_department || department} | Owner: {selectedTicket.assigned_to || 'Unclaimed'}</p>
              </div>
              <button type="button" onClick={closeDetails} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
              <section className="space-y-5 p-5 lg:col-span-6">
                {detailsLoading && <div className="rounded-2xl border border-brandNavy/10 bg-brandNavy/5 px-4 py-3 text-xs font-bold text-brandNavy">Refreshing ticket details...</div>}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Status', selectedTicket.status],
                    ['Priority', selectedTicket.priority],
                    ['Category', selectedTicket.category_name || `Category #${selectedTicket.category_id}`],
                    ['Created', formatDate(selectedTicket.created_at)]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="mt-1 break-words text-sm font-extrabold text-brandDarkNavy">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Requester</p>
                  <p className="mt-2 break-all text-sm font-extrabold text-brandDarkNavy">{selectedTicket.vendor_name || selectedTicket.raised_by}</p>
                </div>

                <div>
                  <h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Description</h4>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm font-semibold leading-relaxed text-slate-700">{selectedTicket.description}</div>
                </div>

                <div>
                  <h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Attachments</h4>
                  {selectedTicket.has_attachment ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-brandDarkNavy">{attachmentName(selectedTicket.attachment_path)}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">Uploaded by requester</p>
                      </div>
                      <button type="button" onClick={() => downloadAttachment(selectedTicket.attachment_path)} className="rounded-xl bg-brandNavy px-4 py-2 text-[10px] font-extrabold text-white transition hover:bg-brandDarkNavy">Download</button>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs font-bold text-slate-400">No attachments uploaded.</p>
                  )}
                </div>

                {(selectedTicket.resolution_summary || selectedTicket.root_cause || selectedTicket.action_taken) && (
                  <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/50 p-4">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 font-sora">Resolution Details</h4>
                    <div className="mt-3 space-y-3 text-xs font-semibold text-slate-700">
                      <p><span className="font-extrabold text-brandDarkNavy">Summary:</span> {selectedTicket.resolution_summary}</p>
                      <p><span className="font-extrabold text-brandDarkNavy">Root Cause:</span> {selectedTicket.root_cause}</p>
                      <p><span className="font-extrabold text-brandDarkNavy">Action Taken:</span> {selectedTicket.action_taken}</p>
                      {selectedTicket.resolution_remarks && <p><span className="font-extrabold text-brandDarkNavy">Remarks:</span> {selectedTicket.resolution_remarks}</p>}
                      <p className="text-[10px] text-slate-400">Submitted by {selectedTicket.resolution_submitted_by || 'staff'} on {formatDate(selectedTicket.resolution_submitted_at)}</p>
                    </div>
                  </div>
                )}
              </section>

              <aside className="space-y-5 border-t border-slate-100 bg-slate-50/50 p-5 lg:col-span-6 lg:border-l lg:border-t-0">
                <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Claim Ticket</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-brandDarkNavy">{selectedTicket.assigned_to || 'Unclaimed'}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">{isUnclaimed ? 'Available for department ownership' : 'Already owned by a department member'}</p>
                    </div>
                    <button type="button" onClick={claimTicket} disabled={claiming || !isUnclaimed} className="rounded-2xl bg-brandNavy px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-brandDarkNavy disabled:cursor-not-allowed disabled:opacity-50">
                      {claiming ? 'Claiming...' : 'Claim'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Update Status</label>
                  <select value={selectedTicket.status || 'Open'} onChange={event => updateStatus(event.target.value)} disabled={statusUpdating} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-brandDarkNavy outline-none focus:border-brandNavy">
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400">Choosing Resolved opens the mandatory resolution form.</p>
                </div>

                {showResolutionForm && (
                  <form onSubmit={submitResolution} className="rounded-[20px] border border-emerald-100 bg-white/90 p-4 shadow-sm">
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 font-sora">Resolution Form</p>
                    {[
                      ['resolution_summary', 'Resolution Summary'],
                      ['root_cause', 'Root Cause'],
                      ['action_taken', 'Action Taken'],
                      ['resolution_remarks', 'Optional Resolution Remarks']
                    ].map(([key, label]) => (
                      <label key={key} className="mb-3 block">
                        <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
                        <textarea value={resolutionForm[key]} onChange={event => setResolutionForm(prev => ({ ...prev, [key]: event.target.value }))} className="min-h-[74px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy" />
                      </label>
                    ))}
                    <button type="submit" disabled={resolutionSaving} className="w-full rounded-2xl bg-brandRed px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#C2112C] disabled:opacity-50">
                      {resolutionSaving ? 'Submitting...' : 'Submit Resolution'}
                    </button>
                  </form>
                )}

                <form onSubmit={saveInternalNote} className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Internal Notes</label>
                  <textarea value={noteText} onChange={event => setNoteText(event.target.value)} placeholder="Add investigation notes visible only to Admin and Department users..." className="min-h-[96px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy" />
                  <button type="submit" disabled={noteSaving || !noteText.trim()} className="mt-3 w-full rounded-2xl bg-brandNavy px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-brandDarkNavy disabled:opacity-50">
                    {noteSaving ? 'Saving...' : 'Add Internal Note'}
                  </button>
                  <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                    {(selectedTicket.internal_notes || []).length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-400">No internal notes yet.</p>
                    ) : (
                      selectedTicket.internal_notes.map(note => (
                        <div key={note.note_id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                          <p className="text-xs font-bold text-slate-700">{note.note_text}</p>
                          <p className="mt-1 text-[9px] font-semibold text-slate-400">{note.created_by_name || note.created_by} | {formatDate(note.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </form>

                <form onSubmit={submitEscalation} className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Escalate / Reassign Department</p>
                  <select value={escalationForm.target_department} onChange={event => setEscalationForm(prev => ({ ...prev, target_department: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-brandDarkNavy outline-none focus:border-brandNavy">
                    <option value="">Select target department</option>
                    {availableDepartments.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <textarea value={escalationForm.reason} onChange={event => setEscalationForm(prev => ({ ...prev, reason: event.target.value }))} placeholder="Mandatory escalation reason..." className="mt-3 min-h-[82px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy" />
                  <button type="submit" disabled={escalating || !escalationForm.target_department || !escalationForm.reason.trim()} className="mt-3 w-full rounded-2xl bg-brandRed px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#C2112C] disabled:opacity-50">
                    {escalating ? 'Transferring...' : 'Transfer Ticket'}
                  </button>
                </form>

                <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <h4 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">Activity Timeline</h4>
                  <div className="max-h-72 space-y-3 overflow-y-auto">
                    {(selectedTicket.activity || []).length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs font-bold text-slate-400">No activity recorded yet.</p>
                    ) : (
                      selectedTicket.activity.map(item => (
                        <div key={item.activity_id} className="relative border-l-2 border-brandNavy/20 pl-4">
                          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brandRed" />
                          <p className="text-xs font-extrabold text-brandDarkNavy">{item.action_text}</p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-400">{item.actor_name || item.actor_id || 'System'} | {formatDate(item.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
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
