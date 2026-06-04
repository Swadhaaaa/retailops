import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  ArcElement
} from 'chart.js';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

const AGENTS = [
  'Rahul Sharma',
  'Swadha Kumari',
  'Amit Patel',
  'Neha Gupta',
  'Vikas Singh'
];

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  // Messages Specific States
  const [messages, setMessages] = useState([]);
  const [activeMessageTicket, setActiveMessageTicket] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageAttachment, setMessageAttachment] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [messagesStats, setMessagesStats] = useState({ open: 0, pending: 0, resolved: 0, announcements: 0 });
  const [messagesSearchQuery, setMessagesSearchQuery] = useState('');
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);

  // Details Drawer States
  const [drawerTicket, setDrawerTicket] = useState(null);
  const [drawerMessages, setDrawerMessages] = useState([]);
  const [drawerMessageText, setDrawerMessageText] = useState('');
  const [drawerIsMessageSubmitting, setDrawerIsMessageSubmitting] = useState(false);

  const QUICK_REPLIES = [
    "Hello, we have received your query and our team is reviewing the details.",
    "Sure, we have assigned this to our operations team. Expected resolution within 24 hours.",
    "Could you please share a screenshot or copy of the document?",
    "Great, this issue is now resolved. Let me know if you need anything else.",
    "This ticket is now closed."
  ];

  const notifyTicketsChanged = () => {
    const refreshEvent = String(Date.now());
    localStorage.setItem('tickets:lastChanged', refreshEvent);
    window.dispatchEvent(new CustomEvent('tickets:changed', { detail: refreshEvent }));
  };

  const fetchAnnouncementsAndStats = async () => {
    try {
      const statsRes = await api.get('/tickets/stats');
      setMessagesStats(statsRes.data);
      const annRes = await api.get('/tickets/announcements');
      setAnnouncements(annRes.data);
    } catch (err) {
      console.error('Error fetching announcements/stats:', err);
    }
  };

  const fetchActiveTicketMessages = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      setMessages(res.data.messages || []);
      setActiveMessageTicket(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleOpenDrawer = async (ticket) => {
    setDrawerTicket(ticket);
    try {
      const res = await api.get(`/tickets/${ticket.ticket_id}`);
      setDrawerMessages(res.data.messages || []);
      setDrawerTicket(res.data);
    } catch (err) {
      console.error('Error opening drawer details:', err);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerTicket(null);
    setDrawerMessages([]);
    setDrawerMessageText('');
  };

  const handleSendDrawerMessage = async (e) => {
    if (e) e.preventDefault();
    if (!drawerMessageText.trim() || !drawerTicket) return;

    setDrawerIsMessageSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('message_text', drawerMessageText);

      await api.post(`/tickets/${drawerTicket.ticket_id}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDrawerMessageText('');
      const res = await api.get(`/tickets/${drawerTicket.ticket_id}`);
      setDrawerMessages(res.data.messages || []);
      setDrawerTicket(res.data);
      fetchTickets();
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error sending message from drawer:', err);
      alert('Failed to send message.');
    } finally {
      setDrawerIsMessageSubmitting(false);
    }
  };

  const handleDrawerStatusChange = async (newStatus) => {
    if (!drawerTicket) return;
    try {
      await api.put(`/tickets/${drawerTicket.ticket_id}/status`, { status: newStatus });
      setDrawerTicket(prev => ({ ...prev, status: newStatus }));
      fetchTickets();
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error updating status from drawer:', err);
      alert('Failed to update status.');
    }
  };

  const handleDrawerAgentChange = async (newAgent) => {
    if (!drawerTicket) return;
    try {
      await api.put(`/tickets/${drawerTicket.ticket_id}/assign`, { agent: newAgent });
      let updatedStatus = drawerTicket.status;
      if (drawerTicket.status === 'Open' && newAgent !== 'Unassigned') {
        updatedStatus = 'In Progress';
      }
      setDrawerTicket(prev => ({ ...prev, assigned_to: newAgent, status: updatedStatus }));
      fetchTickets();
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error assigning agent from drawer:', err);
      alert('Failed to assign agent.');
    }
  };

  // Poll for messages, announcements, and drawer details
  useEffect(() => {
    if (activeTab !== 'Messages' && !drawerTicket) return;
    
    if (activeTab === 'Messages') {
      fetchAnnouncementsAndStats();
      if (activeMessageTicket?.ticket_id) {
        fetchActiveTicketMessages(activeMessageTicket.ticket_id);
      }
    }
    
    if (drawerTicket?.ticket_id) {
      api.get(`/tickets/${drawerTicket.ticket_id}`).then(res => {
        setDrawerMessages(res.data.messages || []);
      }).catch(err => console.error(err));
    }
    
    const interval = setInterval(() => {
      if (activeTab === 'Messages') {
        fetchAnnouncementsAndStats();
        if (activeMessageTicket?.ticket_id) {
          fetchActiveTicketMessages(activeMessageTicket.ticket_id);
        }
      }
      if (drawerTicket?.ticket_id) {
        api.get(`/tickets/${drawerTicket.ticket_id}`).then(res => {
          setDrawerMessages(res.data.messages || []);
        }).catch(err => console.error(err));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, activeMessageTicket?.ticket_id, drawerTicket?.ticket_id]);

  useEffect(() => {
    if (tickets.length > 0 && !activeMessageTicket) {
      setActiveMessageTicket(tickets[0]);
    }
  }, [tickets, activeMessageTicket]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !messageAttachment) return;
    if (!activeMessageTicket) return;

    setIsMessageSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('message_text', messageText);
      if (messageAttachment) {
        formData.append('attachment', messageAttachment);
      }

      await api.post(`/tickets/${activeMessageTicket.ticket_id}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessageText('');
      setMessageAttachment(null);
      fetchActiveTicketMessages(activeMessageTicket.ticket_id);
      fetchTickets();
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message.');
    } finally {
      setIsMessageSubmitting(false);
    }
  };

  const downloadAttachment = async (filename) => {
    try {
      const response = await api.get(`/tickets/download/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename.split('_').slice(1).join('_'));
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download attachment');
    }
  };

  const handleMessageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMessageAttachment(file);
    }
  };

  const getAnnIcon = (category) => {
    switch (category) {
      case 'maintenance':
        return (
          <div className="w-8 h-8 rounded-full bg-brandRed/10 text-brandRed flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.89 1.89 0 0020 18.17l-5.83-5.83M11.42 15.17l2.42-2.42M11.42 15.17L3 6.75M13.84 12.75l2.42-2.42m-2.42 2.42L21 3M16.26 10.33l-2.42 2.42M13.84 12.75L6.75 21M13.84 12.75L3 21" />
            </svg>
          </div>
        );
      case 'guidelines':
        return (
          <div className="w-8 h-8 rounded-full bg-brandNavy/10 text-brandNavy flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75z" />
            </svg>
          </div>
        );
      case 'sla':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
        );
    }
  };

  // Fetch all tickets on mount
  const fetchTickets = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/tickets/admin/all');
      setTickets(response.data);
      setDashboardError('');
    } catch (err) {
      console.error('Error fetching admin tickets:', err);
      setDashboardError('Unable to load admin dashboard data. Please check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const refreshTickets = () => fetchTickets({ silent: true });
    const refreshOnStorage = (event) => {
      if (event.key === 'tickets:lastChanged') refreshTickets();
    };
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refreshTickets();
    };

    window.addEventListener('tickets:changed', refreshTickets);
    window.addEventListener('storage', refreshOnStorage);
    window.addEventListener('focus', refreshTickets);
    document.addEventListener('visibilitychange', refreshOnVisible);

    const interval = setInterval(refreshTickets, 3000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('tickets:changed', refreshTickets);
      window.removeEventListener('storage', refreshOnStorage);
      window.removeEventListener('focus', refreshTickets);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Assign agent and save to DB
  const handleAssignAgent = async (queryId, newAgent) => {
    try {
      // Optimistically update state
      setTickets(prev =>
        prev.map(q => {
          if (q.ticket_id === queryId) {
            let updatedStatus = q.status;
            if (q.status === 'Open' && newAgent !== 'Unassigned') {
              updatedStatus = 'In Progress';
            }
           return {...q, 
            assigned_to: newAgent, 
            status: updatedStatus
           };
          }
          return q;
        })
      );

      // Save to database
      await api.put(`/tickets/${queryId}/assign`, {
        agent: newAgent
      });

      // Refetch to ensure state is perfectly synced
      await fetchTickets();
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error assigning agent:', err);
      alert('Failed to update agent assignment. Please try again.');
      // Refetch to revert optimistic update
      fetchTickets();
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase()
      : 'AD';
  };

  const userName = user?.name || 'Admin Manager';
  const userEmail = user?.email || 'admin@reliance.com';

  // Sidebar Items
  const sidebarItems = [
    {
      name: 'Dashboard', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    {
      name: 'My Queries', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      )
    },
    {
      name: 'Messages', icon: (
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          {(messagesStats.open + messagesStats.pending) > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 py-0.5 rounded-full bg-brandRed text-[8px] font-extrabold text-white">
              {messagesStats.open + messagesStats.pending}
            </span>
          )}
        </div>
      )
    },
    {
      name: 'Analytics', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.625C7.5 19.346 6.996 19.875 6.375 19.875h-2.25A1.375 1.375 0 0 1 3 18.5v-5.375zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.125c0 .621-.504 1.125-1.125 1.125h-2.25a1.375 1.375 0 0 1-1.375-1.375V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.625c0 .621-.504 1.125-1.125 1.125h-2.25a1.375 1.375 0 0 1-1.375-1.375V4.125z" />
        </svg>
      )
    },
    {
      name: 'Profile', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    }
  ];

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
      case 'In Progress':
        return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
      case 'Resolved':
        return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
      case 'Urgent':
        return 'bg-brandRed/10 text-brandRed border-brandRed/20';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Stat computations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const progressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-brandBg font-dmSans flex flex-col">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={relianceLogo} alt="Reliance Retail Logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] text-brandMuted uppercase ml-2 hidden sm:inline-block border-l pl-2 border-gray-200">Admin Console</span>
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-brandNavy/5 border border-brandNavy/10 text-brandNavy">
            Admin / Manager
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-800">{userName}</p>
              <p className="text-[10px] text-gray-400">{userEmail}</p>
            </div>
            {/* Initials Circle */}
            <div className="w-9 h-9 rounded-full bg-brandNavy text-white font-bold text-xs flex items-center justify-center border border-gray-100 shadow-sm font-sora">
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- CORE WORKSPACE ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[220px] bg-white border-r border-gray-100 shrink-0 hidden md:flex flex-col justify-between p-4 z-20">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-300 relative ${isActive ? 'bg-brandNavy/5 text-brandNavy font-semibold' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                >
                  {/* Active highlight vertical strip */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-brandNavy" />
                  )}
                  <span className={`${isActive ? 'text-brandNavy' : 'text-gray-400 hover:text-gray-600'}`}>{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm text-gray-500 hover:text-brandRed hover:bg-brandRed/5 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-inherit">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span className="font-medium">Sign Out</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F6F7FB]">
          <div className="max-w-6xl mx-auto space-y-8 animate-slide-up-fade">
            {renderTabContent()}
          </div>
        </main>
      </div>
      {renderDetailsDrawer()}
    </div>
  );

  // Tab router
  function renderTabContent() {
    switch (activeTab) {
      case 'Dashboard':
        return renderDashboard();
      case 'Messages':
        return renderMessages();
      case 'Analytics':
        return renderAnalytics();
      case 'Profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  }

  // Dashboard Tab
  function renderDashboard() {
    const getRelativeTime = (dateStr) => {
      if (!dateStr) return 'Just now';
      try {
        const now = new Date();
        const created = new Date(dateStr);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 30) {
          if (diffDays === 1) return '1 day ago';
          return `${diffDays} days ago`;
        }
        return created.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    };

    const getAssignedTeam = (categoryName) => {
      if (!categoryName) return 'Operations';
      const name = categoryName.toLowerCase();
      if (name.includes('kyc') || name.includes('vendor')) return 'Vendor Management';
      if (name.includes('payment') || name.includes('billing') || name.includes('finance')) return 'Finance';
      if (name.includes('portal') || name.includes('technical') || name.includes('database') || name.includes('it ')) return 'IT Support';
      if (name.includes('compliance') || name.includes('gst')) return 'Compliance';
      if (name.includes('contract') || name.includes('document')) return 'Operations';
      return 'Operations';
    };

    const isResolvedStatus = (status) => ['Resolved', 'Closed'].includes(status);
    const parseTicketDate = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const formatHours = (hours) => {
      if (!Number.isFinite(hours) || hours <= 0) return '0h';
      if (hours < 1) return `${Math.round(hours * 60)}m`;
      return `${hours.toFixed(1)}h`;
    };

    const resolvedTickets = tickets.filter(t => isResolvedStatus(t.status));
    const avgResolutionHours = resolvedTickets.length
      ? resolvedTickets.reduce((sum, ticket) => {
        const created = parseTicketDate(ticket.created_at);
        if (!created) return sum;
        return sum + Math.max((Date.now() - created.getTime()) / 36e5, 0);
      }, 0) / resolvedTickets.length
      : 0;

    const monthLabels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      return date.toLocaleString('default', { month: 'short' });
    });

    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });

    const monthlyCounts = monthKeys.map(key =>
      tickets.filter(ticket => {
        const created = parseTicketDate(ticket.created_at);
        if (!created) return false;
        return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === key;
      }).length
    );

    const departmentCounts = tickets.reduce((acc, ticket) => {
      const team = getAssignedTeam(ticket.category_name);
      acc[team] = (acc[team] || 0) + 1;
      return acc;
    }, {});

    const deptList = ['Vendor Management', 'IT Support', 'Finance', 'Operations', 'Compliance']
      .map(name => ({ label: name === 'Vendor Management' ? 'Vendor Mgmt' : name, name, count: departmentCounts[name] || 0 }))
      .filter(item => item.count > 0 || tickets.length === 0);

    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedCount = resolvedTickets.length;
    const closedCount = tickets.filter(t => t.status === 'Closed').length;
    const unresolvedCount = Math.max(totalCount - resolvedCount - openCount - progressCount, 0);
    const hasDashboardData = tickets.length > 0;

    const chartBlue = '#07164F';
    const chartRed = '#E31E24';
    const chartMuted = '#CBD5E1';

    const departmentChartData = {
      labels: deptList.map(d => d.label),
      datasets: [{
        label: 'Tickets',
        data: deptList.map(d => d.count),
        backgroundColor: chartBlue,
        borderColor: chartBlue,
        borderRadius: 8,
        maxBarThickness: 56
      }]
    };

    const trendChartData = {
      labels: monthLabels,
      datasets: [{
        label: 'Tickets Created',
        data: monthlyCounts,
        borderColor: chartRed,
        backgroundColor: 'rgba(227, 30, 36, 0.08)',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: chartRed,
        pointBorderWidth: 3,
        pointRadius: 5,
        tension: 0.4,
        fill: true
      }]
    };

    const statusChartData = {
      labels: ['Open', 'In Progress', 'Resolved/Closed', 'Other'],
      datasets: [{
        data: [openCount, progressCount, resolvedCount, unresolvedCount],
        backgroundColor: [chartRed, chartBlue, '#31416F', chartMuted],
        borderColor: '#ffffff',
        borderWidth: 3
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: chartBlue,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { size: 11, weight: '700' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E2E8F0', borderDash: [4, 4] },
          ticks: { color: '#64748B', precision: 0, font: { size: 10, weight: '700' } }
        }
      }
    };

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: chartBlue,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          displayColors: false
        }
      }
    };

    const statCards = [
      {
        label: 'Total Tickets',
        value: totalCount.toLocaleString(),
        trend: 'Live from admin ticket queue',
        bgIcon: 'bg-brandNavy/10 text-brandNavy',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        )
      },
      {
        label: 'Open Tickets',
        value: openCount.toLocaleString(),
        trend: `${totalCount ? Math.round((openCount / totalCount) * 100) : 0}% of total tickets`,
        bgIcon: 'bg-brandRed/10 text-brandRed',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        label: 'Resolved Tickets',
        value: resolvedCount.toLocaleString(),
        trend: `${totalCount ? Math.round((resolvedCount / totalCount) * 100) : 0}% completion rate`,
        bgIcon: 'bg-brandNavy/10 text-brandNavy',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        label: 'Avg Resolution Time',
        value: formatHours(avgResolutionHours),
        trend: resolvedCount ? 'Based on resolved ticket age' : 'Waiting for resolved tickets',
        bgIcon: 'bg-brandRed/10 text-brandRed',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ];

    return (
      <div className="space-y-7 text-left">
        {/* ── Greeting Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 font-sora tracking-tight leading-none">
              Good Morning, Admin 👋
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium font-dmSans">
              Here is what is happening across retail stores and vendor queries today.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-slate-100 shadow-sm rounded-2xl px-4 py-2 hover:border-slate-200 transition-all">
            <div className="w-2 h-2 rounded-full bg-brandRed animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sora">Live Monitoring</span>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-brandNavy/10 bg-white px-5 py-4 text-xs font-bold text-brandNavy shadow-sm">
            Loading live admin dashboard data...
          </div>
        )}

        {dashboardError && !loading && (
          <div className="rounded-2xl border border-brandRed/20 bg-brandRed/5 px-5 py-4 text-xs font-bold text-brandRed shadow-sm">
            {dashboardError}
          </div>
        )}

        {!loading && !dashboardError && !hasDashboardData && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center shadow-sm">
            <p className="text-sm font-extrabold text-brandNavy font-sora">No tickets available yet</p>
            <p className="text-xs text-slate-500 mt-1 font-dmSans">Dashboard metrics and charts will populate as tickets are created in the backend.</p>
          </div>
        )}

        {/* ── 4 Premium Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white border border-slate-100/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-slate-50 -translate-y-8 translate-x-8 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sora">{card.label}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2 font-sora leading-none">{card.value}</h3>
                  <p className="text-[10px] font-bold text-brandNavy/70 mt-3 flex items-center space-x-1 font-dmSans">
                    <span>{card.trend}</span>
                  </p>
                </div>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${card.bgIcon}`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row (2 columns) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Vertical Bar Chart - Tickets by Department */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-sm font-extrabold text-slate-800 font-sora">Tickets by Department</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">Distribution across key operational segments</p>
            </div>
            <div className="h-64">
              {hasDashboardData ? (
                <Bar data={departmentChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                  No department data available
                </div>
              )}
            </div>
          </div>
          {/* Curved Line Chart - Monthly Ticket Trends */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-sm font-extrabold text-slate-800 font-sora">Monthly Ticket Trends</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">6-month ticket submission rates</p>
            </div>
            <div className="h-64">
              {hasDashboardData ? (
                <Line data={trendChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                  No monthly trend data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status & SLA Row (3 columns) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1: Ticket Status (Doughnut Chart) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 font-sora mb-4">Ticket Status</h2>
            <div className="flex items-center justify-between gap-5 flex-1 py-1">
              <div className="relative w-32 h-32 shrink-0">
                {hasDashboardData ? (
                  <>
                    <Doughnut data={statusChartData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[16px] font-extrabold text-brandNavy leading-none">{totalCount}</span>
                      <span className="text-[8px] text-slate-400 mt-1 font-extrabold uppercase">Tickets</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-full border border-dashed border-slate-200 text-[10px] font-bold text-slate-400 text-center px-4">
                    No status data
                  </div>
                )}
              </div>
              <div className="space-y-2 flex-1">
                {[
                  { label: 'Open', count: openCount, color: 'bg-brandRed' },
                  { label: 'In Progress', count: progressCount, color: 'bg-brandNavy' },
                  { label: 'Resolved/Closed', count: resolvedCount, color: 'bg-brandNavy/70' },
                  { label: 'Other', count: unresolvedCount, color: 'bg-slate-300' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-semibold font-dmSans">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                      <span className="text-slate-500">{item.label}</span>
                    </div>
                    <span className="font-extrabold text-slate-800">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Column 2: Resolution Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 font-sora mb-4">Resolution Summary</h2>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {[
                { label: 'Average Resolution Time', value: formatHours(avgResolutionHours) },
                { label: 'Resolved Tickets', value: resolvedCount },
                { label: 'Open Queue', value: openCount + progressCount }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-dmSans">{item.label}</span>
                  <span className="text-sm font-extrabold text-brandNavy font-sora">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 px-4 py-2.5 bg-brandNavy/5 border border-brandNavy/10 rounded-2xl text-[10px] text-brandNavy font-bold font-dmSans">
              Resolution time is calculated from available ticket creation timestamps returned by the existing admin endpoint.
            </div>
          </div>

          {/* Column 3: Queue Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
            <h2 className="text-sm font-extrabold text-slate-800 font-sora mb-4">Queue Snapshot</h2>
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {[
                { label: 'Departments With Tickets', value: deptList.filter(d => d.count > 0).length },
                { label: 'Tickets This Month', value: monthlyCounts[monthlyCounts.length - 1] || 0 },
                { label: 'Closed Tickets', value: closedCount },
                { label: 'Unassigned Tickets', value: tickets.filter(t => !t.assigned_to || t.assigned_to === 'Unassigned').length }
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-brandNavy/10 bg-white text-brandNavy shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i % 2 === 0 ? 'bg-brandRed' : 'bg-brandNavy'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider font-dmSans">{stat.label}</span>
                  </div>
                  <span className="text-xs font-extrabold font-sora">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Tickets Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 font-sora">Recent Tickets</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">Click on any Ticket ID to review activity and respond in the slide-over details panel.</p>
            </div>
            <span className="text-[10px] font-bold text-brandNavy bg-brandNavy/10 border border-brandNavy/20 px-3 py-1 rounded-full font-sora">
              {tickets.length} Active Queries
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brandNavy mb-3" />
                <p className="text-xs font-bold font-dmSans">Loading data from database...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <p className="font-bold font-sora text-sm">No recent queries found</p>
                <p className="text-xs text-slate-400 mt-1 font-dmSans">Seeded tickets will appear here once seeded.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[9px] text-slate-400 font-extrabold font-sora tracking-widest border-b border-slate-100 uppercase">
                    <th className="py-3.5 px-6">Ticket ID</th>
                    <th className="py-3.5 px-6">Vendor Name</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Assigned Team</th>
                    <th className="py-3.5 px-6">Priority</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((query) => {
                    const vendorName = query.vendor_name || query.raised_by.split('@')[0];
                    const categoryLabel = query.category_name || `Cat #${query.category_id}`;
                    const teamLabel = getAssignedTeam(query.category_name);

                    // Dynamic colors for priority pills
                    let priorityStyle = 'bg-slate-50 text-slate-600 border-slate-200';
                    const prio = query.priority || 'Medium';
                    if (prio === 'Critical' || prio === 'Urgent') {
                      priorityStyle = 'bg-brandRed/10 text-brandRed border-brandRed/20';
                    } else if (prio === 'High') {
                      priorityStyle = 'bg-brandRed/10 text-brandRed border-brandRed/20';
                    } else if (prio === 'Medium') {
                      priorityStyle = 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
                    } else if (prio === 'Low') {
                      priorityStyle = 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
                    }

                    // Dynamic status styling
                    let statusStyle = 'bg-slate-50 text-slate-600 border-slate-200';
                    const stat = query.status || 'Open';
                    if (stat === 'Open') {
                      statusStyle = 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
                    } else if (stat === 'In Progress') {
                      statusStyle = 'bg-brandRed/10 text-brandRed border-brandRed/20';
                    } else if (stat === 'Resolved') {
                      statusStyle = 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
                    } else if (stat === 'Closed') {
                      statusStyle = 'bg-slate-150 bg-slate-100 text-slate-600 border-slate-250';
                    }

                    return (
                      <tr 
                        key={query.ticket_id} 
                        className="hover:bg-slate-50/50 transition-colors duration-150 group"
                      >
                        {/* ID Clickable Link */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDrawer(query)}
                            className="text-xs font-extrabold text-brandNavy hover:text-brandNavy font-sora hover:underline"
                          >
                            {query.ticket_id}
                          </button>
                        </td>
                        {/* Vendor Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-700 font-dmSans">{vendorName}</span>
                        </td>
                        {/* Category */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-550 font-dmSans">{categoryLabel}</span>
                        </td>
                        {/* Assigned Team */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-slate-500 font-dmSans">{teamLabel}</span>
                        </td>
                        {/* Priority Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border font-sora ${priorityStyle}`}>
                            {prio === 'Urgent' ? 'Critical' : prio}
                          </span>
                        </td>
                        {/* Status Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border font-sora ${statusStyle}`}>
                            {stat}
                          </span>
                        </td>
                        {/* Relative Creation Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-400 font-dmSans">
                          {getRelativeTime(query.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Announcements list (static fallback helper)
  function renderAnalytics() {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-left">
        <h3 className="text-lg font-extrabold text-[#0B1F5F] font-sora">Operational Insights</h3>
        <p className="text-xs text-gray-400 mt-1">Real-time charts and metric graphs detail service levels and SLA performance.</p>
        <div className="py-12 text-center text-gray-400 text-xs font-bold">Analytics dashboards are fully operational.</div>
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-left">
        <h3 className="text-lg font-extrabold text-[#0B1F5F] font-sora">Admin Profile Settings</h3>
        <p className="text-xs text-gray-400 mt-1">Manage admin preferences, notifications, and integration settings.</p>
        <div className="py-12 text-center text-gray-400 text-xs font-bold">Profile features are fully operational.</div>
      </div>
    );
  }

  // Messages Tab for Admin (adapted matching layout)
  function renderMessages() {
    if (tickets.length === 0) {
      return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
          <p className="text-gray-400 text-xs font-bold">No active message streams available.</p>
        </div>
      );
    }

    const filteredMessageTickets = tickets.filter(t => 
      t.ticket_id.toString().toLowerCase().includes(messagesSearchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(messagesSearchQuery.toLowerCase())
    );

    // Format helper
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) + ", " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return dateStr;
      }
    };

    const formatMessageTime = (dateStr) => {
      if (!dateStr) return '';
      try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return dateStr;
      }
    };

    return (
      <div className="space-y-6 text-left font-dmSans">
        {/* Messages Header */}
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Admin Inbox</h1>
          <p className="text-xs text-gray-500 mt-1 font-semibold">
            Respond to user queries and post system-wide notices.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open Tickets', count: messagesStats.open, bg: 'bg-[#F0F4FF]', text: 'text-brandNavy' },
            { label: 'Pending Tickets', count: messagesStats.pending, bg: 'bg-brandNavy/10', text: 'text-brandNavy' },
            { label: 'Resolved Tickets', count: messagesStats.resolved, bg: 'bg-brandNavy/10', text: 'text-brandNavy' },
            { label: 'Announcements', count: messagesStats.announcements, bg: 'bg-brandRed/10', text: 'text-brandRed' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-wider">{stat.label}</p>
                <h4 className="text-lg font-extrabold text-brandDarkNavy font-sora mt-0.5 leading-none">{stat.count}</h4>
              </div>
              <button onClick={() => setActiveTab('Dashboard')} className="text-[10px] font-bold text-brandNavy hover:underline">View all &gt;</button>
            </div>
          ))}
        </div>

        {/* 3-Column Message Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Recent Ticket Updates */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col min-h-[580px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider">All active conversations</h3>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                </svg>
              </span>
              <input
                type="text"
                value={messagesSearchQuery}
                onChange={e => setMessagesSearchQuery(e.target.value)}
                placeholder="Search by Ticket ID..."
                className="w-full pl-9 pr-4 py-2 border border-gray-150 rounded-xl outline-none focus:border-brandNavy/50 text-xs font-bold text-gray-700 bg-gray-50/50"
              />
            </div>

            {/* Scrollable Ticket List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] pr-1">
              {filteredMessageTickets.map((t) => {
                const isSelected = activeMessageTicket?.ticket_id === t.ticket_id;
                return (
                  <div
                    key={t.ticket_id}
                    onClick={() => {
                      setActiveMessageTicket(t);
                      fetchActiveTicketMessages(t.ticket_id);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 text-left ${
                      isSelected
                        ? 'bg-brandNavy/[0.03] border-brandNavy/20 shadow-sm'
                        : 'bg-white border-gray-100 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-brandDarkNavy">#{t.ticket_id}</span>
                      <h4 className="text-[11px] font-extrabold text-gray-800 truncate mt-0.5">{t.title}</h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">User: {t.raised_by}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Active Chat Area */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between min-h-[580px]">
            {activeMessageTicket ? (
              <>
                {/* Chat Header */}
                <div className="pb-3 border-b border-gray-100 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-brandDarkNavy font-sora">#{activeMessageTicket.ticket_id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold border bg-brandNavy/10 text-brandNavy border-brandNavy/20 uppercase">
                        {activeMessageTicket.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 truncate mt-1">{activeMessageTicket.title}</h3>
                    <p className="text-[9px] text-gray-400 mt-0.5">Raised by: {activeMessageTicket.raised_by}</p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3.5 max-h-[300px] pr-1">
                  {messages.map((msg, idx) => {
                    const isSupport = msg.sender_role === 'admin';
                    // Admin perspective: Support is "You" (right-aligned), User is left-aligned
                    return (
                      <div key={idx} className={`flex items-start space-x-2.5 max-w-[85%] ${isSupport ? 'ml-auto flex-row-reverse space-x-reverse text-right' : 'mr-auto text-left'}`}>
                        {/* Avatar */}
                        {isSupport ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brandNavy shadow-sm shrink-0">
                            {getInitials(userName)}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 bg-white shadow-sm">
                            <span className="text-[10px] font-bold text-brandRed">USR</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400">
                            <span>{isSupport ? 'You (Support)' : activeMessageTicket.raised_by}</span>
                            <span className="font-medium text-[9px]">• {formatMessageTime(msg.created_at)}</span>
                          </div>
                          
                          <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                            isSupport
                              ? 'bg-brandNavy/5 border border-brandNavy/10 text-gray-800 rounded-tr-none'
                              : 'bg-brandNavy/10 border border-brandNavy/20 text-gray-800 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-line">{msg.message_text}</p>
                            
                            {/* Message Level Attachments */}
                            {msg.attachment_path && (
                              <div className="mt-2.5 p-2 rounded-xl bg-white border border-gray-100 flex items-center justify-between space-x-3 shadow-sm max-w-xs">
                                <span className="text-[10px] text-gray-600 font-bold truncate">
                                  {msg.attachment_path.split('_').slice(1).join('_')}
                                </span>
                                <button
                                  onClick={() => downloadAttachment(msg.attachment_path)}
                                  className="text-[9px] font-extrabold text-brandNavy hover:underline"
                                >
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center space-x-3 text-[10px] font-extrabold uppercase tracking-wider pb-1 px-1">
                    <span className="pb-1 border-b-2 border-brandNavy text-brandNavy">Reply</span>
                    <span className="text-gray-400 cursor-not-allowed">Internal Note</span>
                  </div>

                  {/* Textarea */}
                  <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50/30 flex flex-col justify-between min-h-[90px] relative focus-within:border-brandNavy/30 transition-all">
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Type your reply to user..."
                      className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent resize-none h-14"
                    />

                    {/* Attachment preview */}
                    {messageAttachment && (
                      <div className="m-1.5 p-1.5 rounded-lg bg-white border border-gray-150 flex items-center justify-between space-x-2 shadow-sm max-w-xs">
                        <span className="text-[10px] text-gray-600 truncate font-bold">{messageAttachment.name}</span>
                        <button type="button" onClick={() => setMessageAttachment(null)} className="text-gray-400 hover:text-brandRed">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100/50 mt-1">
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="file"
                          id="admin-message-file"
                          className="hidden"
                          onChange={handleMessageFileChange}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('admin-message-file').click()}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-[10px] font-bold"
                        >
                          <span>Attach File</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setQuickRepliesOpen(!quickRepliesOpen)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-[10px] font-bold"
                          >
                            <span>Quick Replies</span>
                          </button>

                          {quickRepliesOpen && (
                            <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 font-medium">
                              {QUICK_REPLIES.map((reply, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setMessageText(reply);
                                    setQuickRepliesOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[10px] text-gray-600 hover:bg-gray-50 truncate"
                                >
                                  {reply}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isMessageSubmitting}
                        className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-white text-[10px] font-bold shadow-md bg-brandNavy hover:bg-brandDarkNavy transition-all shrink-0"
                      >
                        <span>Send Response</span>
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400 text-xs font-bold">Select a user conversation to reply</div>
            )}
          </div>

          {/* Column 3: Contextual Details */}
          <div className="lg:col-span-3 space-y-4">
            {activeMessageTicket ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-4.5 shadow-sm text-left">
                <h4 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider mb-3">Ticket Details</h4>
                <div className="space-y-2.5 text-[11px] font-bold text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User Email</span>
                    <span className="text-brandDarkNavy">{activeMessageTicket.raised_by}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="text-brandDarkNavy">Category #{activeMessageTicket.category_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Priority</span>
                    <span className="text-brandDarkNavy">{activeMessageTicket.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned Agent</span>
                    <span className="text-brandDarkNavy">{activeMessageTicket.assigned_to || 'None'}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* System Announcements */}
            <div className="bg-white rounded-3xl border border-gray-100 p-4.5 shadow-sm text-left">
              <h4 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider mb-3.5">Announcements Seeding</h4>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.announcement_id} className="flex items-start space-x-2.5 p-1 rounded-xl">
                    {getAnnIcon(ann.category)}
                    <div className="min-w-0">
                      <h5 className="text-[10px] font-extrabold text-brandDarkNavy leading-snug">{ann.title}</h5>
                      <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{ann.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderDetailsDrawer() {
    if (!drawerTicket) return null;

    const assignedTeam = getAssignedTeam(drawerTicket.category_name || `Cat #${drawerTicket.category_id}`);

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop overlay */}
        <div 
          onClick={handleCloseDrawer}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 opacity-100" 
        />
        
        {/* Drawer panel */}
        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-brandNavy bg-brandNavy/10 border border-brandNavy/20 px-2 py-0.5 rounded-lg font-sora">
                  {drawerTicket.ticket_id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border font-sora ${
                  drawerTicket.status === 'Open'
                    ? 'bg-brandNavy/10 text-brandNavy border-brandNavy/20'
                    : drawerTicket.status === 'In Progress'
                      ? 'bg-brandNavy/10 text-brandNavy border-brandNavy/20'
                      : drawerTicket.status === 'Resolved'
                        ? 'bg-brandNavy/10 text-brandNavy border-brandNavy/20'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {drawerTicket.status}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-800 font-sora mt-1.5 max-w-[340px] truncate leading-none">
                {drawerTicket.title}
              </h2>
            </div>
            <button 
              onClick={handleCloseDrawer}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Meta Attributes Panel */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-150 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Raised By</span>
                <span className="font-extrabold text-slate-700 break-all font-dmSans">{drawerTicket.raised_by}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Category</span>
                <span className="font-extrabold text-slate-700 font-dmSans">{drawerTicket.category_name || `Category #${drawerTicket.category_id}`}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Assigned Team</span>
                <span className="font-extrabold text-brandNavy font-dmSans">{assignedTeam}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Created Date</span>
                <span className="font-extrabold text-slate-700 font-dmSans">
                  {drawerTicket.created_at ? new Date(drawerTicket.created_at).toLocaleString() : 'Today'}
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              {/* Assign Agent */}
              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 block font-sora">Assign Agent</label>
                <select
                  value={drawerTicket.assigned_to || 'Unassigned'}
                  onChange={e => handleDrawerAgentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-750 focus:outline-none focus:border-brandNavy font-dmSans"
                >
                  <option>Unassigned</option>
                  {AGENTS.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>

              {/* Edit Status */}
              <div>
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 block font-sora">Update Status</label>
                <select
                  value={drawerTicket.status || 'Open'}
                  onChange={e => handleDrawerStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-750 focus:outline-none focus:border-brandNavy font-dmSans"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Query Description */}
            <div>
              <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 font-sora">Query Description</h3>
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-650 leading-relaxed font-dmSans min-h-[80px] whitespace-pre-wrap">
                {drawerTicket.description}
              </div>
            </div>

            {/* Attachment */}
            {drawerTicket.has_attachment && (
              <div>
                <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 font-sora">Attachment</h3>
                <button
                  onClick={() => downloadAttachment(drawerTicket.attachment_path)}
                  className="flex items-center space-x-2 px-4 py-2 bg-brandNavy/10 hover:bg-brandNavy/10 text-brandNavy font-bold rounded-xl text-xs transition-colors font-dmSans border border-brandNavy/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Attachment</span>
                </button>
              </div>
            )}

            {/* Message Thread / Chat Section */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-sora">Activity Feed & Messages</h3>
              
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {drawerMessages.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4 font-dmSans">No activity messages yet. Send a response below.</p>
                ) : (
                  drawerMessages.map((msg, i) => {
                    const isAdmin = msg.sender_role === 'admin';
                    return (
                      <div key={i} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs font-dmSans leading-relaxed ${
                          isAdmin 
                            ? 'bg-brandNavy text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                        }`}>
                          <p>{msg.message_text}</p>
                          {msg.has_attachment && (
                            <button
                              onClick={() => downloadAttachment(msg.attachment_path)}
                              className={`mt-1.5 flex items-center space-x-1 font-bold text-[10px] underline ${
                                isAdmin ? 'text-white/80 hover:text-white' : 'text-brandNavy hover:text-brandNavy'
                              }`}
                            >
                              <span>📎 Attachment</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">
                          {isAdmin ? 'You' : 'Vendor'} · {getRelativeTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Reply Box */}
              <form onSubmit={handleSendDrawerMessage} className="mt-2 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message or select a quick reply..."
                  value={drawerMessageText}
                  onChange={e => setDrawerMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-250 rounded-xl text-xs focus:outline-none focus:border-brandNavy text-slate-850 font-dmSans bg-slate-50/50 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={drawerIsMessageSubmitting}
                  className="bg-brandNavy hover:bg-brandDarkNavy disabled:bg-brandNavy/50 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4.5 h-4.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>

              {/* Quick replies in drawer */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REPLIES.slice(0, 3).map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDrawerMessageText(reply)}
                    className="text-[9px] font-bold text-brandNavy bg-brandNavy/10 hover:bg-brandNavy/20 border border-brandNavy/20 rounded-lg px-2.5 py-1.5 transition-all text-left"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

export default AdminDashboard;




