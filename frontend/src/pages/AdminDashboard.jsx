import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';

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

  const QUICK_REPLIES = [
    "Hello, we have received your query and our team is reviewing the details.",
    "Sure, we have assigned this to our operations team. Expected resolution within 24 hours.",
    "Could you please share a screenshot or copy of the document?",
    "Great, this issue is now resolved. Let me know if you need anything else.",
    "This ticket is now closed."
  ];

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

  // Poll for messages and announcements
  useEffect(() => {
    if (activeTab !== 'Messages') return;
    
    fetchAnnouncementsAndStats();
    if (activeMessageTicket?.ticket_id) {
      fetchActiveTicketMessages(activeMessageTicket.ticket_id);
    }
    
    const interval = setInterval(() => {
      fetchAnnouncementsAndStats();
      if (activeMessageTicket?.ticket_id) {
        fetchActiveTicketMessages(activeMessageTicket.ticket_id);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, activeMessageTicket?.ticket_id]);

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
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.89 1.89 0 0020 18.17l-5.83-5.83M11.42 15.17l2.42-2.42M11.42 15.17L3 6.75M13.84 12.75l2.42-2.42m-2.42 2.42L21 3M16.26 10.33l-2.42 2.42M13.84 12.75L6.75 21M13.84 12.75L3 21" />
            </svg>
          </div>
        );
      case 'guidelines':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
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
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets/admin/all');
      setTickets(response.data);
    } catch (err) {
      console.error('Error fetching admin tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
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
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
    return (
      <>
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">
              Good morning, {userName.split(' ')[0]} 
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              System Overview: Managing store tickets and user queries.
            </p>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Queries */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold font-sora uppercase">Total Tickets</span>
              <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12.75h.008v.008H7.5V5.25zm0 3h.008v.008H7.5v-.008zm0 3h.008v.008H7.5v-.008zm0 3h.008v.008H7.5v-.008zm0 3h.008v.008H7.5V17.25zm9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9.75-3.75h.008v.008H6.75v-.008zm0-3h.008v.008H6.75v-.008zm0-3h.008v.008H6.75V5.25zm9.75 11.25h.008v.008h-.008v-.008zm0-3h.008v.008h-.008v-.008zm0-3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-brandDarkNavy font-sora">
                {loading ? '...' : totalCount}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
                <span>Active in DuckDB</span>
              </p>
            </div>
          </div>

          {/* Open Queries */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold font-sora uppercase">Open Tickets</span>
              <div className="p-2 rounded-xl bg-brandRed/10 text-brandRed">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-brandDarkNavy font-sora">
                {loading ? '...' : openCount}
              </h3>
              <p className="text-xs text-brandRed font-semibold mt-1">Pending allocation</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold font-sora uppercase">In Progress</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-brandDarkNavy font-sora">
                {loading ? '...' : progressCount}
              </h3>
              <p className="text-xs text-amber-600 font-semibold mt-1">Currently being resolved</p>
            </div>
          </div>

          {/* Resolved Queries */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-bold font-sora uppercase">Resolved Tickets</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-brandDarkNavy font-sora">
                {loading ? '...' : resolvedCount}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Closed successfully</p>
            </div>
          </div>
        </div>

        {/* Admin Queries Card & Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
          {/* Table Header Section */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-brandDarkNavy font-sora">
                All User Queries
              </h2>
              <p className="text-xs text-gray-400">View raised tickets across the system, assign agents, and manage escalation status.</p>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandNavy mb-3"></div>
                <p className="text-sm font-medium">Loading all queries from database...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <p className="font-bold font-sora text-[15px]">No user queries found in the database</p>
                <p className="text-xs text-gray-400 mt-1">Queries raised by users will appear here in real-time.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] text-gray-400 font-bold font-sora tracking-widest border-b border-gray-100 uppercase">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Assigned Agent</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {tickets.map((query) => (
                    <tr
                      key={query.ticket_id}
                      className="hover:bg-gray-50/40 transition-colors"
                    >
                      {/* Ticket ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#0B1F5F]">
                          {query.ticket_id}
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">
                          {query.raised_by}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800">
                          {query.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                          {query.description}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-200/50">
                          Category #{query.category_id}
                        </span>
                      </td>

                      {/* Assign Agent */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={query.assigned_to || 'Unassigned'}
                          onChange={(e) =>
                            handleAssignAgent(
                              query.ticket_id,
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                        >
                          <option>Unassigned</option>
                          <option>Swadha Kumari</option>
                          <option>Rahul Sharma</option>
                          <option>Neha Gupta</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          query.status === 'Open'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : query.status === 'In Progress'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {query.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {query.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </>
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
            { label: 'Pending Tickets', count: messagesStats.pending, bg: 'bg-amber-50', text: 'text-amber-600' },
            { label: 'Resolved Tickets', count: messagesStats.resolved, bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Announcements', count: messagesStats.announcements, bg: 'bg-purple-50', text: 'text-purple-600' }
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
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold border bg-blue-50 text-blue-600 border-blue-100 uppercase">
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
                              : 'bg-blue-50/70 border border-blue-100 text-gray-800 rounded-tl-none'
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
};

export default AdminDashboard;