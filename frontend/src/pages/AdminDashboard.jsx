import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  ArcElement
} from 'chart.js';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';
import AdminTicketDetails from '../components/AdminTicketDetails';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip
);

const AGENTS = [
  'Rahul Sharma',
  'Swadha Kumari',
  'Amit Patel',
  'Neha Gupta',
  'Vikas Singh'
];

const INITIAL_ADMIN_DIRECTORY = [
  {
    id: 1,
    name: 'Admin Manager',
    email: 'admin@reliance.com',
    role: 'Super Admin',
    department: 'Supply Chain Operations',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Rahul Sharma',
    email: 'rahul.sharma@reliance.com',
    role: 'Support Admin',
    department: 'Finance',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Swadha Kumari',
    email: 'swadha.kumari@reliance.com',
    role: 'IT Support',
    department: 'IT Support',
    status: 'Active'
  },
  {
    id: 4,
    name: 'Amit Patel',
    email: 'amit.patel@reliance.com',
    role: 'Operations Admin',
    department: 'Operations',
    status: 'Active'
  },
  {
    id: 5,
    name: 'Neha Gupta',
    email: 'neha.gupta@reliance.com',
    role: 'Compliance Admin',
    department: 'Compliance',
    status: 'Inactive'
  }
];

const DEPARTMENT_DIRECTORY = [
  { name: 'Supply Chain Operations', head: 'Admin Manager', members: 12, accent: 'brandNavy' },
  { name: 'IT Support', head: 'Swadha Kumari', members: 8, accent: 'cyan' },
  { name: 'Finance', head: 'Rahul Sharma', members: 10, accent: 'green' },
  { name: 'Operations', head: 'Amit Patel', members: 15, accent: 'purple' },
  { name: 'Compliance', head: 'Neha Gupta', members: 6, accent: 'orange' },
  { name: 'Procurement', head: 'Vikas Singh', members: 9, accent: 'blue' },
  { name: 'Store Operations', head: 'Emily Davis', members: 11, accent: 'teal' },
  { name: 'Finance & Reporting', head: 'Sarah Smith', members: 7, accent: 'indigo' },
  { name: 'Retail Operations', head: 'Robert Lee', members: 13, accent: 'rose' }
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
  const [messagesStats, setMessagesStats] = useState({ open: 0, pending: 0, resolved: 0, announcements: 0 });
  const [messagesSearchQuery, setMessagesSearchQuery] = useState('');
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);

  // Details Drawer States
  const [drawerTicket, setDrawerTicket] = useState(null);
  const [drawerMessages, setDrawerMessages] = useState([]);
  const [drawerMessageText, setDrawerMessageText] = useState('');
  const [drawerIsMessageSubmitting, setDrawerIsMessageSubmitting] = useState(false);

  // Queries detail workspace states
  const [queryTicket, setQueryTicket] = useState(null);
  const [queryMessages, setQueryMessages] = useState([]);
  const [queryComment, setQueryComment] = useState('');
  const [queryIsSubmitting, setQueryIsSubmitting] = useState(false);

  // Admin management states
  const [adminDirectory, setAdminDirectory] = useState(INITIAL_ADMIN_DIRECTORY);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    role: 'Support Admin',
    department: 'Operations',
    status: 'Active'
  });

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
      if (diffDays < 30) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      return created.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getAssignedTeam = (categoryName) => {
    if (!categoryName) return 'Operations';
    const name = categoryName.toLowerCase();
    if (name.includes('kyc') || name.includes('vendor')) return 'Supply Chain Operations';
    if (name.includes('procurement') || name.includes('purchase')) return 'Procurement';
    if (name.includes('store')) return 'Store Operations';
    if (name.includes('reporting') || name.includes('budget') || name.includes('reconciliation')) return 'Finance & Reporting';
    if (name.includes('payment') || name.includes('billing') || name.includes('finance')) return 'Finance';
    if (name.includes('portal') || name.includes('technical') || name.includes('database') || name.includes('it ')) return 'IT Support';
    if (name.includes('compliance') || name.includes('gst')) return 'Compliance';
    if (name.includes('contract') || name.includes('document')) return 'Operations';
    return 'Operations';
  };

  const fetchMessagesStats = async () => {
    try {
      const statsRes = await api.get('/tickets/stats');
      setMessagesStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching message stats:', err);
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

  const openQueryTicket = async (ticket) => {
    setQueryTicket(ticket);
    try {
      const res = await api.get(`/tickets/${ticket.ticket_id}`);
      setQueryTicket(res.data);
      setQueryMessages(res.data.messages || []);
      setActiveTab('Queries');
    } catch (err) {
      console.error('Error opening query ticket:', err);
      alert('Failed to open ticket details.');
    }
  };

  const refreshQueryTicket = async (ticketId = queryTicket?.ticket_id) => {
    if (!ticketId) return;
    const res = await api.get(`/tickets/${ticketId}`);
    setQueryTicket(res.data);
    setQueryMessages(res.data.messages || []);
  };

  const handleQueryStatusChange = async (status) => {
    if (!queryTicket) return;
    try {
      await api.put(`/tickets/${queryTicket.ticket_id}/status`, { status });
      await fetchTickets({ silent: true });
      await refreshQueryTicket(queryTicket.ticket_id);
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error updating query status:', err);
      alert('Failed to update status.');
    }
  };

  const handleQueryPriorityChange = async (priority) => {
    if (!queryTicket) return;
    try {
      await api.put(`/tickets/${queryTicket.ticket_id}/priority`, { priority });
      await fetchTickets({ silent: true });
      await refreshQueryTicket(queryTicket.ticket_id);
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error updating query priority:', err);
      alert('Failed to update priority.');
    }
  };

  const handleQueryAgentChange = async (agent) => {
    if (!queryTicket) return;
    try {
      await api.put(`/tickets/${queryTicket.ticket_id}/assign`, { agent });
      await fetchTickets({ silent: true });
      await refreshQueryTicket(queryTicket.ticket_id);
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error assigning query:', err);
      alert('Failed to assign ticket.');
    }
  };

  const resetAdminForm = () => {
    setAdminForm({
      name: '',
      email: '',
      role: 'Support Admin',
      department: 'Operations',
      status: 'Active'
    });
    setEditingAdmin(null);
  };

  const openAddAdminForm = () => {
    resetAdminForm();
    setIsAdminFormOpen(true);
  };

  const openEditAdminForm = (admin) => {
    setEditingAdmin(admin);
    setAdminForm({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      department: admin.department,
      status: admin.status
    });
    setIsAdminFormOpen(true);
  };

  const closeAdminForm = () => {
    setIsAdminFormOpen(false);
    resetAdminForm();
  };

  const handleAdminFormSubmit = (event) => {
    event.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim()) return;

    if (editingAdmin) {
      setAdminDirectory(prev =>
        prev.map(admin =>
          admin.id === editingAdmin.id
            ? { ...admin, ...adminForm, name: adminForm.name.trim(), email: adminForm.email.trim() }
            : admin
        )
      );
    } else {
      setAdminDirectory(prev => [
        ...prev,
        {
          id: Date.now(),
          ...adminForm,
          name: adminForm.name.trim(),
          email: adminForm.email.trim()
        }
      ]);
    }

    closeAdminForm();
  };

  const handleDeleteAdmin = (adminId) => {
    setAdminDirectory(prev => prev.filter(admin => admin.id !== adminId));
  };

  const handleToggleAdminStatus = (adminId) => {
    setAdminDirectory(prev =>
      prev.map(admin =>
        admin.id === adminId
          ? { ...admin, status: admin.status === 'Active' ? 'Inactive' : 'Active' }
          : admin
      )
    );
  };

  const handleSendQueryComment = async (e) => {
    if (e) e.preventDefault();
    if (!queryTicket || !queryComment.trim()) return;

    setQueryIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('message_text', queryComment);
      await api.post(`/tickets/${queryTicket.ticket_id}/message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setQueryComment('');
      await fetchTickets({ silent: true });
      await refreshQueryTicket(queryTicket.ticket_id);
      notifyTicketsChanged();
    } catch (err) {
      console.error('Error sending query comment:', err);
      alert('Failed to send comment.');
    } finally {
      setQueryIsSubmitting(false);
    }
  };

  // Poll for messages, stats, and drawer details
  useEffect(() => {
    if (activeTab !== 'Messages' && !drawerTicket && !queryTicket) return;
    
    if (activeTab === 'Messages') {
      fetchMessagesStats();
      if (activeMessageTicket?.ticket_id) {
        fetchActiveTicketMessages(activeMessageTicket.ticket_id);
      }
    }
    
    if (drawerTicket?.ticket_id) {
      api.get(`/tickets/${drawerTicket.ticket_id}`).then(res => {
        setDrawerMessages(res.data.messages || []);
      }).catch(err => console.error(err));
    }

    if (queryTicket?.ticket_id) {
      api.get(`/tickets/${queryTicket.ticket_id}`).then(res => {
        setQueryTicket(res.data);
        setQueryMessages(res.data.messages || []);
      }).catch(err => console.error(err));
    }
    
    const interval = setInterval(() => {
      if (activeTab === 'Messages') {
        fetchMessagesStats();
        if (activeMessageTicket?.ticket_id) {
          fetchActiveTicketMessages(activeMessageTicket.ticket_id);
        }
      }
      if (drawerTicket?.ticket_id) {
        api.get(`/tickets/${drawerTicket.ticket_id}`).then(res => {
          setDrawerMessages(res.data.messages || []);
        }).catch(err => console.error(err));
      }
      if (queryTicket?.ticket_id) {
        api.get(`/tickets/${queryTicket.ticket_id}`).then(res => {
          setQueryTicket(res.data);
          setQueryMessages(res.data.messages || []);
        }).catch(err => console.error(err));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, activeMessageTicket?.ticket_id, drawerTicket?.ticket_id, queryTicket?.ticket_id]);

  useEffect(() => {
    if (tickets.length > 0 && !activeMessageTicket) {
      setActiveMessageTicket(tickets[0]);
    }
    if (activeTab === 'Queries' && tickets.length > 0 && !queryTicket) {
      openQueryTicket(tickets[0]);
    }
  }, [tickets, activeMessageTicket, activeTab, queryTicket]);

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

    const interval = setInterval(refreshTickets, 10000);
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
      name: 'Queries', icon: (
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
      name: 'Departments', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m4.5-6h1.5m-1.5 3h1.5m-1.5 3h1.5M8.25 21v-3.375c0-.621.504-1.125 1.125-1.125h3.25c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      )
    },
    {
      name: 'Admin Management', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75 6.75 5.7v4.54c0 3.9 2.19 7.47 5.25 9 3.06-1.53 5.25-5.1 5.25-9V5.7L12 3.75Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM8.85 15.45c.74-1.24 1.82-1.86 3.15-1.86s2.41.62 3.15 1.86" />
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
        return 'bg-green-50 text-green-700 border-green-200';
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
    <div className="min-h-screen bg-white font-dmSans flex flex-col text-slate-800">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="h-16 premium-glass border-b border-white/50 flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
        <div className="flex items-center space-x-3">
          <img src={relianceLogo} alt="Reliance Retail Logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] text-brandMuted uppercase ml-2 hidden sm:inline-block border-l pl-2 border-gray-200">Admin Console</span>
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-white/70 border border-white/60 text-brandNavy shadow-sm backdrop-blur-md">
            Admin / Manager
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-800">{userName}</p>
              <p className="text-[10px] text-gray-400">{userEmail}</p>
            </div>
            {/* Initials Circle */}
            <div className="w-9 h-9 rounded-full bg-brandNavy text-white font-bold text-xs flex items-center justify-center border border-white/70 shadow-[0_10px_24px_rgba(15,27,76,0.2)] font-sora">
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- CORE WORKSPACE ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[248px] premium-glass border-r border-white/50 shrink-0 hidden md:flex flex-col justify-between p-4 z-20">
          <div className="space-y-1.5">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-left transition-all duration-300 relative ${isActive ? 'bg-white/85 text-brandNavy font-semibold shadow-[0_12px_28px_rgba(15,27,76,0.08)] border border-white/70' : 'text-gray-500 hover:text-brandNavy hover:bg-white/70 hover:shadow-sm'
                    }`}
                >
                  {/* Active highlight vertical strip */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-gradient-to-b from-brandNavy to-brandRed" />
                  )}
                  <span className={`w-5 h-5 shrink-0 flex items-center justify-center ${isActive ? 'text-brandNavy' : 'text-gray-400 hover:text-gray-600'}`}>{item.icon}</span>
                  <span className="font-medium whitespace-nowrap leading-none">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-left text-gray-500 hover:text-brandRed hover:bg-white/75 hover:shadow-sm transition-all duration-300"
          >
            <span className="w-5 h-5 shrink-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-inherit">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </span>
            <span className="font-medium whitespace-nowrap leading-none">Sign Out</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="admin-canvas flex-1 overflow-y-auto p-6 md:p-8">
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
      case 'Queries':
        return renderQueries();
      case 'Messages':
        return renderMessages();
      case 'Analytics':
        return renderAnalytics();
      case 'Departments':
        return renderDepartments();
      case 'Admin Management':
        return renderAdminManagement();
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
      if (name.includes('kyc') || name.includes('vendor')) return 'Supply Chain Operations';
      if (name.includes('procurement') || name.includes('purchase')) return 'Procurement';
      if (name.includes('store')) return 'Store Operations';
      if (name.includes('reporting') || name.includes('budget') || name.includes('reconciliation')) return 'Finance & Reporting';
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

    const deptList = DEPARTMENT_DIRECTORY
      .map(({ name }) => ({ label: name, name, count: departmentCounts[name] || 0 }))
      .filter(item => item.count > 0 || tickets.length === 0);

    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedCount = resolvedTickets.length;
    const closedCount = tickets.filter(t => t.status === 'Closed').length;
    const unresolvedCount = Math.max(totalCount - resolvedCount - openCount - progressCount, 0);
    const hasDashboardData = tickets.length > 0;

    const chartBlue = '#0F1B4C';
    const chartRed = '#E31837';
    const chartMuted = '#D9E2F1';

    const departmentChartData = {
      labels: deptList.map(d => d.label),
      datasets: [{
        label: 'Tickets',
        data: deptList.map(d => d.count),
        backgroundColor: 'rgba(15, 27, 76, 0.82)',
        borderColor: chartBlue,
        hoverBackgroundColor: chartRed,
        borderRadius: 14,
        borderSkipped: false,
        maxBarThickness: 56
      }]
    };

    const trendChartData = {
      labels: monthLabels,
      datasets: [{
        label: 'Tickets Created',
        data: monthlyCounts,
        borderColor: chartRed,
        backgroundColor: 'rgba(227, 24, 55, 0.08)',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: chartRed,
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true
      }]
    };

    const statusChartData = {
      labels: ['Open', 'In Progress', 'Resolved/Closed', 'Other'],
      datasets: [{
        data: [openCount, progressCount, resolvedCount, unresolvedCount],
        backgroundColor: [chartRed, chartBlue, 'rgba(15, 27, 76, 0.62)', chartMuted],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 6
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 27, 76, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { size: 11, weight: '700' } },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.18)', drawBorder: false },
          ticks: { color: '#64748B', precision: 0, font: { size: 10, weight: '700' } },
          border: { display: false }
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
          backgroundColor: 'rgba(15, 27, 76, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          displayColors: false,
          padding: 12,
          cornerRadius: 12,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          borderWidth: 1
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
              Good Morning, Admin!
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium font-dmSans">
              z
            </p>
          </div>
          <div className="flex items-center space-x-2 premium-glass-soft rounded-2xl px-4 py-2 premium-hover">
            <div className="w-2 h-2 rounded-full bg-brandRed animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sora">Live Monitoring</span>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl premium-glass px-5 py-4 text-xs font-bold text-brandNavy">
            Loading live admin dashboard data...
          </div>
        )}

        {dashboardError && !loading && (
          <div className="rounded-2xl border border-brandRed/20 bg-brandRed/5 px-5 py-4 text-xs font-bold text-brandRed shadow-sm backdrop-blur-md">
            {dashboardError}
          </div>
        )}

        {!loading && !dashboardError && !hasDashboardData && (
          <div className="rounded-2xl premium-glass px-5 py-6 text-center">
            <p className="text-sm font-extrabold text-brandNavy font-sora">No tickets available yet</p>
            <p className="text-xs text-slate-500 mt-1 font-dmSans">Dashboard metrics and charts will populate as tickets are created in the backend.</p>
          </div>
        )}

        {/* ── 4 Premium Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, i) => (
            <div key={i} className="premium-glass premium-hover rounded-[22px] p-5 relative group overflow-hidden">
              <div className={`absolute inset-x-0 bottom-0 h-1 ${i % 2 === 0 ? 'bg-brandNavy/70' : 'bg-brandRed/70'} opacity-80`} />
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br from-brandNavy/10 to-brandRed/10 -translate-y-10 translate-x-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sora">{card.label}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-2 font-sora leading-none">{card.value}</h3>
                  <p className="text-[10px] font-bold text-brandNavy/70 mt-3 flex items-center space-x-1 font-dmSans">
                    <span>{card.trend}</span>
                  </p>
                </div>
                
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${card.bgIcon}`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row (2 columns) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Vertical Bar Chart - Tickets by Department */}
          <div className="premium-glass premium-hover rounded-[22px] p-6">
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
          <div className="premium-glass premium-hover rounded-[22px] p-6">
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
          <div className="premium-glass premium-hover rounded-[22px] p-6 flex flex-col justify-between">
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
          <div className="premium-glass premium-hover rounded-[22px] p-6 flex flex-col justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 font-sora mb-4">Resolution Summary</h2>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {[
                { label: 'Average Resolution Time', value: formatHours(avgResolutionHours) },
                { label: 'Resolved Tickets', value: resolvedCount },
                { label: 'Open Queue', value: openCount + progressCount }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-dmSans">{item.label}</span>
                  <span className="text-sm font-extrabold text-brandNavy font-sora">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 px-4 py-2.5 bg-brandNavy/5 border border-brandNavy/10 rounded-2xl text-[10px] text-brandNavy font-bold font-dmSans backdrop-blur-md">
              Resolution time is calculated from available ticket creation timestamps returned by the existing admin endpoint.
            </div>
          </div>

          {/* Column 3: Queue Snapshot */}
          <div className="premium-glass premium-hover rounded-[22px] p-6 flex flex-col">
            <h2 className="text-sm font-extrabold text-slate-800 font-sora mb-4">Queue Snapshot</h2>
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {[
                { label: 'Departments With Tickets', value: deptList.filter(d => d.count > 0).length },
                { label: 'Tickets This Month', value: monthlyCounts[monthlyCounts.length - 1] || 0 },
                { label: 'Closed Tickets', value: closedCount },
                { label: 'Unassigned Tickets', value: tickets.filter(t => !t.assigned_to || t.assigned_to === 'Unassigned').length }
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-white/60 bg-white/70 text-brandNavy shadow-sm backdrop-blur-md">
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
        <div className="premium-glass rounded-[22px] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/60 flex items-center justify-between flex-wrap gap-3">
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
                  <tr className="bg-white/55 text-[9px] text-slate-400 font-extrabold font-sora tracking-widest border-b border-white/70 uppercase backdrop-blur-md">
                    <th className="py-3.5 px-6">Ticket ID</th>
                    <th className="py-3.5 px-6">User Name</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Assigned Team</th>
                    <th className="py-3.5 px-6">Priority</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/70">
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
                      statusStyle = 'bg-green-50 text-green-700 border-green-200';
                    } else if (stat === 'Closed') {
                      statusStyle = 'bg-slate-150 bg-slate-100 text-slate-600 border-slate-250';
                    }

                    return (
                      <tr 
                        key={query.ticket_id} 
                        className="premium-table-row group"
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
                        {/* User Name */}
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

  function renderQueries() {
    const selectedTicket = queryTicket || tickets[0] || null;
    const selectedTeam = getAssignedTeam(selectedTicket?.category_name || `Category #${selectedTicket?.category_id || ''}`);
    const attachments = selectedTicket
      ? [
          ...(selectedTicket.has_attachment ? [{
            name: selectedTicket.attachment_path?.split('_').slice(1).join('_') || selectedTicket.attachment_path,
            path: selectedTicket.attachment_path,
            source: 'Ticket'
          }] : []),
          ...queryMessages
            .filter(msg => msg.has_attachment && msg.attachment_path)
            .map(msg => ({
              name: msg.attachment_path.split('_').slice(1).join('_') || msg.attachment_path,
              path: msg.attachment_path,
              source: msg.sender_role === 'admin' ? 'Admin reply' : 'User reply'
            }))
        ]
      : [];

    const timeline = selectedTicket
      ? [
          {
            label: `Ticket created by ${selectedTicket.vendor_name || selectedTicket.raised_by}`,
            time: selectedTicket.created_at,
            actor: selectedTicket.vendor_name || selectedTicket.raised_by
          },
          ...(selectedTicket.assigned_to ? [{
            label: `Assigned to ${selectedTicket.assigned_to}`,
            time: selectedTicket.created_at,
            actor: 'Admin Manager'
          }] : []),
          ...queryMessages.map(msg => ({
            label: msg.message_text,
            time: msg.created_at,
            actor: msg.sender_role === 'admin' ? 'Admin Manager' : (selectedTicket.vendor_name || 'User')
          }))
        ]
      : [];

    const statusPill = (status) => {
      if (status === 'Resolved') {
        return 'bg-green-50 text-green-700 border-green-200';
      }
      if (status === 'In Progress' || status === 'Needs Clarification' || status === 'Under Review') {
        return 'bg-brandRed/10 text-brandRed border-brandRed/20';
      }
      return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
    };

    return (
      <div className="space-y-5 text-left">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brandDarkNavy font-sora">Queries</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Review, assign, update, and respond to live tickets.</p>
          </div>
          <span className="text-[10px] font-bold text-brandNavy bg-brandNavy/10 border border-brandNavy/20 px-3 py-1 rounded-full font-sora self-start sm:self-auto">
            {tickets.length} Active Queries
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-4 premium-glass rounded-[22px] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/60">
              <h2 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider">Ticket Queue</h2>
            </div>
            <div className="max-h-[720px] overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">No tickets available.</div>
              ) : (
                tickets.map(ticket => {
                  const isSelected = selectedTicket?.ticket_id === ticket.ticket_id;
                  return (
                    <button
                      key={ticket.ticket_id}
                      type="button"
                      onClick={() => openQueryTicket(ticket)}
                      className={`w-full text-left px-4 py-3 transition-all ${isSelected ? 'bg-white/80 shadow-sm text-brandNavy' : 'hover:bg-white/65 hover:shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-brandNavy font-sora truncate">#{ticket.ticket_id}</p>
                          <p className="text-[11px] font-bold text-slate-700 mt-1 truncate">{ticket.title}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                            {ticket.vendor_name || ticket.raised_by} · {ticket.category_name || `Category #${ticket.category_id}`}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${statusPill(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="xl:col-span-8">
            {!selectedTicket ? (
              <div className="premium-glass rounded-[22px] p-10 text-center text-sm font-bold text-slate-400">
                Select a ticket to view details.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 premium-glass rounded-[22px] overflow-hidden">
                <div className="lg:col-span-8 p-5 lg:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-white/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-extrabold text-brandDarkNavy font-sora">Ticket #{selectedTicket.ticket_id}</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${statusPill(selectedTicket.status)}`}>
                          {selectedTicket.status || 'Open'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[10px] font-bold text-slate-500">
                        <span>Created: {getRelativeTime(selectedTicket.created_at)}</span>
                        <span>Priority: <b className={selectedTicket.priority === 'Critical' || selectedTicket.priority === 'Urgent' || selectedTicket.priority === 'High' ? 'text-brandRed' : 'text-brandNavy'}>{selectedTicket.priority}</b></span>
                        <span>Category: {selectedTicket.category_name || `Category #${selectedTicket.category_id}`}</span>
                      </div>
                    </div>
                  </div>

                  <section>
                    <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora mb-3">Description</h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{selectedTicket.description}</p>
                  </section>

                  <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora mb-3">User Details</h3>
                      <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                        <p>Name: <span className="text-brandDarkNavy font-extrabold">{selectedTicket.vendor_name || selectedTicket.raised_by}</span></p>
                        <p>Email: <span>{selectedTicket.raised_by}</span></p>
                        <p>Phone: <span>Not available</span></p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora mb-3">Assigned Team</h3>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-extrabold text-slate-700">{selectedTicket.assigned_to || selectedTeam}</p>
                        <button
                          type="button"
                          onClick={() => handleQueryAgentChange(selectedTicket.assigned_to || AGENTS[0])}
                          className="px-4 py-2 rounded-xl border border-brandNavy/20 text-brandNavy text-[10px] font-extrabold hover:bg-brandNavy/5 premium-hover"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora mb-3">Attachments ({attachments.length})</h3>
                    {attachments.length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400">No attachments uploaded.</p>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={`${file.path}-${index}`} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-xs shadow-sm backdrop-blur-md">
                            <div>
                              <p className="font-extrabold text-slate-700">{file.name}</p>
                              <p className="text-[10px] font-semibold text-slate-400">{file.source}</p>
                            </div>
                            <button type="button" onClick={() => downloadAttachment(file.path)} className="text-brandNavy font-extrabold hover:underline">
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora mb-4">Activity Timeline</h3>
                    <div className="space-y-4">
                      {timeline.map((item, index) => (
                        <div key={`${item.time}-${index}`} className="flex gap-3">
                          <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${index === 0 ? 'bg-brandRed' : 'bg-brandNavy'}`} />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400">{getRelativeTime(item.time)}</p>
                            <p className="text-xs font-extrabold text-brandDarkNavy mt-0.5">{item.actor}</p>
                            <p className="text-xs font-semibold text-slate-600 mt-1">{item.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <form onSubmit={handleSendQueryComment} className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora mb-3">Add Internal Note / Comment</h3>
                    <textarea
                      value={queryComment}
                      onChange={e => setQueryComment(e.target.value)}
                      placeholder="Write your comment..."
                      className="w-full min-h-[110px] rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-brandNavy resize-none shadow-sm backdrop-blur-md transition-all"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={queryIsSubmitting || !queryComment.trim()}
                        className="px-6 py-2.5 rounded-xl bg-brandNavy text-white text-[10px] font-extrabold disabled:opacity-50 premium-button"
                      >
                        Send Comment
                      </button>
                    </div>
                  </form>
                </div>

                <aside className="lg:col-span-4 p-5 space-y-4 bg-white/42 backdrop-blur-md">
                  <div>
                    <label className="block text-xs font-extrabold text-brandDarkNavy font-sora mb-2">Update Status</label>
                    <select value={selectedTicket.status || 'Open'} onChange={e => handleQueryStatusChange(e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-xs font-bold outline-none focus:border-brandNavy shadow-sm">
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Needs Clarification">Waiting for User</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brandDarkNavy font-sora mb-2">Change Priority</label>
                    <select value={selectedTicket.priority || 'Medium'} onChange={e => handleQueryPriorityChange(e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-xs font-bold outline-none focus:border-brandNavy shadow-sm">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-brandDarkNavy font-sora mb-2">Assign Team</label>
                    <select value={selectedTicket.assigned_to || 'Unassigned'} onChange={e => handleQueryAgentChange(e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-xs font-bold outline-none focus:border-brandNavy shadow-sm">
                      <option value="Unassigned">Unassigned</option>
                      {AGENTS.map(agent => <option key={agent} value={agent}>{agent}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => refreshQueryTicket(selectedTicket.ticket_id)} className="w-full rounded-2xl bg-brandNavy text-white py-3 text-xs font-extrabold premium-button">
                    Update Ticket
                  </button>
                  <button type="button" onClick={() => handleQueryStatusChange('Resolved')} className={`w-full rounded-2xl border py-3 text-xs font-extrabold transition-all hover:shadow-sm ${selectedTicket.status === 'Resolved' ? 'border-green-200 bg-green-50 text-green-700' : 'border-brandRed/30 text-brandRed bg-white/70 hover:bg-brandRed/5'}`}>
                    Mark as Resolved
                  </button>
                  <select onChange={e => e.target.value && handleQueryStatusChange(e.target.value)} defaultValue="" className="w-full rounded-2xl border border-white/70 bg-white/75 px-3 py-3 text-xs font-bold text-brandNavy outline-none focus:border-brandNavy shadow-sm">
                    <option value="">More Actions</option>
                    <option value="Needs Clarification">Waiting for User</option>
                    <option value="Closed">Close Ticket</option>
                  </select>

                  <div className="rounded-2xl border border-brandNavy/10 bg-brandNavy/5 p-4 backdrop-blur-md">
                    <h3 className="text-xs font-extrabold text-brandNavy font-sora mb-3">Status Guide</h3>
                    {[
                      ['Open', 'Newly created ticket'],
                      ['In Progress', 'Work is being done'],
                      ['Waiting for User', 'Awaiting user response'],
                      ['Resolved', 'Issue resolved by admin'],
                      ['Closed', 'Ticket closed']
                    ].map(([label, desc]) => (
                      <div key={label} className="mb-2 last:mb-0">
                        <p className="text-[10px] font-extrabold text-brandNavy">{label}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    const parseTicketDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const isResolvedStatus = (status) => status === 'Resolved' || status === 'Closed';

    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress' || t.status === 'Under Review').length;
    const waitingCount = tickets.filter(t => t.status === 'Needs Clarification').length;
    const resolvedCount = tickets.filter(t => isResolvedStatus(t.status)).length;
    const urgentCount = tickets.filter(t => t.priority === 'Urgent' || t.priority === 'Critical' || t.priority === 'High').length;
    const unassignedCount = tickets.filter(t => !t.assigned_to || t.assigned_to === 'Unassigned').length;
    const completionRate = totalCount ? Math.round((resolvedCount / totalCount) * 100) : 0;

    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    const monthLabels = monthKeys.map(key => {
      const [year, month] = key.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleString([], { month: 'short' });
    });
    const monthlyCounts = monthKeys.map(key =>
      tickets.filter(ticket => {
        const created = parseTicketDate(ticket.created_at);
        if (!created) return false;
        return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === key;
      }).length
    );

    const teamCounts = tickets.reduce((acc, ticket) => {
      const team = getAssignedTeam(ticket.category_name);
      acc[team] = (acc[team] || 0) + 1;
      return acc;
    }, {});
    const teamData = Object.entries(teamCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const teamLabels = teamData.length ? teamData.map(([team]) => team) : ['No tickets'];
    const teamValues = teamData.length ? teamData.map(([, count]) => count) : [0];

    const priorityOrder = ['Low', 'Medium', 'High', 'Critical', 'Urgent'];
    const priorityValues = priorityOrder.map(priority => tickets.filter(t => t.priority === priority).length);

    const chartBlue = '#0F1B4C';
    const chartRed = '#E31837';
    const chartAmber = '#F59E0B';
    const chartGreen = '#10B981';
    const chartMuted = '#CBD5E1';
    const priorityColors = [chartMuted, chartBlue, chartAmber, chartRed, '#B91C1C'];

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 27, 76, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          borderColor: 'rgba(255, 255, 255, 0.25)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { size: 10, weight: '700' } },
          border: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.18)', drawBorder: false },
          ticks: { color: '#64748B', precision: 0, font: { size: 10, weight: '700' } },
          border: { display: false }
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
          backgroundColor: 'rgba(15, 27, 76, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          cornerRadius: 12,
          displayColors: false
        }
      }
    };

    const polarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 27, 76, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          cornerRadius: 12,
          displayColors: false
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: { display: false, precision: 0 },
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          angleLines: { color: 'rgba(148, 163, 184, 0.18)' },
          pointLabels: { color: '#64748B', font: { size: 10, weight: '700' } }
        }
      }
    };

    const trendChartData = {
      labels: monthLabels,
      datasets: [{
        label: 'Tickets Created',
        data: monthlyCounts,
        borderColor: chartRed,
        backgroundColor: 'rgba(227, 24, 55, 0.08)',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: chartRed,
        pointBorderWidth: 3,
        pointRadius: 5,
        tension: 0.4,
        fill: true
      }]
    };

    const statusChartData = {
      labels: ['Open', 'In Progress', 'Waiting', 'Resolved'],
      datasets: [{
        data: [openCount, progressCount, waitingCount, resolvedCount],
        backgroundColor: [chartRed, chartAmber, chartBlue, chartGreen],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 6
      }]
    };

    const teamChartData = {
      labels: teamLabels,
      datasets: [{
        label: 'Tickets',
        data: teamValues,
        backgroundColor: 'rgba(15, 27, 76, 0.82)',
        borderColor: chartBlue,
        hoverBackgroundColor: chartRed,
        borderRadius: 14,
        borderSkipped: false,
        maxBarThickness: 48
      }]
    };

    const priorityChartData = {
      labels: priorityOrder,
      datasets: [{
        label: 'Tickets',
        data: priorityValues,
        backgroundColor: priorityColors.map(color => `${color}CC`),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };

    const analyticsCards = [
      { label: 'Total Tickets', value: totalCount, sub: 'All admin-visible tickets', color: 'text-brandNavy' },
      { label: 'Completion Rate', value: `${completionRate}%`, sub: `${resolvedCount} resolved or closed`, color: 'text-green-600' },
      { label: 'Priority Queue', value: urgentCount, sub: 'High, critical, or urgent', color: 'text-brandRed' },
      { label: 'Unassigned', value: unassignedCount, sub: 'Needs ownership', color: 'text-amber-600' }
    ];

    return (
      <div className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brandDarkNavy font-sora">Operational Insights</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Live admin analytics calculated from the current ticket queue.</p>
          </div>
          <span className="text-[10px] font-bold text-brandNavy bg-brandNavy/10 border border-brandNavy/20 px-3 py-1 rounded-full font-sora self-start sm:self-auto">
            {totalCount} Tickets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {analyticsCards.map(card => (
            <div key={card.label} className="premium-glass premium-hover rounded-[22px] p-5">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sora">{card.label}</p>
              <h3 className={`text-2xl md:text-3xl font-extrabold mt-2 font-sora leading-none ${card.color}`}>{card.value}</h3>
              <p className="text-[10px] font-bold text-brandNavy/70 mt-3 font-dmSans">{card.sub}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="premium-glass rounded-[24px] p-10 text-center text-xs font-bold text-slate-400">
            Loading analytics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="premium-glass premium-hover rounded-[22px] p-6">
                <h2 className="text-sm font-extrabold text-slate-800 font-sora">Monthly Ticket Trends</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">6-month ticket submission rates</p>
                <div className="h-72 mt-6">
                  {totalCount ? (
                    <Line data={trendChartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                      No monthly trend data available
                    </div>
                  )}
                </div>
              </div>

              <div className="premium-glass premium-hover rounded-[22px] p-6">
                <h2 className="text-sm font-extrabold text-slate-800 font-sora">Tickets by Team</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">Distribution across operational teams</p>
                <div className="h-72 mt-6">
                  {totalCount ? (
                    <Bar data={teamChartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                      No team data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="premium-glass premium-hover rounded-[22px] p-6">
                <h2 className="text-sm font-extrabold text-slate-800 font-sora">Status Split</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">Current queue state</p>
                <div className="h-64 mt-5 relative">
                  {totalCount ? (
                    <>
                      <Doughnut data={statusChartData} options={doughnutOptions} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-extrabold text-brandNavy font-sora leading-none">{totalCount}</span>
                        <span className="text-[8px] text-slate-400 mt-1 font-extrabold uppercase">Tickets</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                      No status data
                    </div>
                  )}
                </div>
              </div>

              <div className="premium-glass premium-hover rounded-[22px] p-6 xl:col-span-2">
                <h2 className="text-sm font-extrabold text-slate-800 font-sora">Priority Mix</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-dmSans font-medium">Polar view of workload urgency</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center mt-5">
                  <div className="h-64">
                    {totalCount ? (
                      <PolarArea data={priorityChartData} options={polarOptions} />
                    ) : (
                      <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                        No priority data available
                      </div>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {priorityOrder.map((priority, index) => (
                      <div key={priority} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: priorityColors[index] }} />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-sora">{priority}</span>
                        </div>
                        <span className="text-sm font-extrabold text-brandNavy font-sora">{priorityValues[index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-glass rounded-[22px] p-6">
              <h2 className="text-sm font-extrabold text-slate-800 font-sora mb-4">Queue Health</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  ['Open', openCount, 'bg-brandRed/10 text-brandRed border-brandRed/20'],
                  ['In Progress / Review', progressCount, 'bg-amber-50 text-amber-700 border-amber-200'],
                  ['Waiting for User', waitingCount, 'bg-brandNavy/10 text-brandNavy border-brandNavy/20'],
                  ['Resolved / Closed', resolvedCount, 'bg-green-50 text-green-700 border-green-200']
                ].map(([label, value, style]) => (
                  <div key={label} className={`rounded-2xl border px-4 py-3 ${style}`}>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider font-sora">{label}</p>
                    <p className="text-2xl font-extrabold mt-2 font-sora">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderDepartments() {
    const accentStyles = {
      brandNavy: {
        soft: 'bg-brandNavy/10 text-brandNavy border-brandNavy/20',
        card: 'from-brandNavy/10 to-white border-brandNavy/20',
        button: 'bg-brandNavy text-white',
        bar: 'bg-brandNavy',
        dot: 'bg-brandNavy'
      },
      cyan: {
        soft: 'bg-cyan-50 text-cyan-700 border-cyan-100',
        card: 'from-cyan-50 to-white border-cyan-100',
        button: 'bg-cyan-600 text-white',
        bar: 'bg-cyan-600',
        dot: 'bg-cyan-600'
      },
      green: {
        soft: 'bg-green-50 text-green-700 border-green-100',
        card: 'from-green-50 to-white border-green-100',
        button: 'bg-green-600 text-white',
        bar: 'bg-green-600',
        dot: 'bg-green-600'
      },
      purple: {
        soft: 'bg-purple-50 text-purple-700 border-purple-100',
        card: 'from-purple-50 to-white border-purple-100',
        button: 'bg-purple-600 text-white',
        bar: 'bg-purple-600',
        dot: 'bg-purple-600'
      },
      orange: {
        soft: 'bg-orange-50 text-orange-700 border-orange-100',
        card: 'from-orange-50 to-white border-orange-100',
        button: 'bg-orange-600 text-white',
        bar: 'bg-orange-600',
        dot: 'bg-orange-600'
      },
      blue: {
        soft: 'bg-blue-50 text-blue-700 border-blue-100',
        card: 'from-blue-50 to-white border-blue-100',
        button: 'bg-blue-600 text-white',
        bar: 'bg-blue-600',
        dot: 'bg-blue-600'
      },
      teal: {
        soft: 'bg-teal-50 text-teal-700 border-teal-100',
        card: 'from-teal-50 to-white border-teal-100',
        button: 'bg-teal-600 text-white',
        bar: 'bg-teal-600',
        dot: 'bg-teal-600'
      },
      indigo: {
        soft: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        card: 'from-indigo-50 to-white border-indigo-100',
        button: 'bg-indigo-600 text-white',
        bar: 'bg-indigo-600',
        dot: 'bg-indigo-600'
      },
      rose: {
        soft: 'bg-rose-50 text-rose-700 border-rose-100',
        card: 'from-rose-50 to-white border-rose-100',
        button: 'bg-rose-600 text-white',
        bar: 'bg-rose-600',
        dot: 'bg-rose-600'
      }
    };

    const getResolutionHours = (ticket) => {
      const isComplete = ticket.status === 'Resolved' || ticket.status === 'Closed';
      const startValue = ticket.created_at || ticket.createdAt || ticket.created_on;
      const endValue = ticket.updated_at || ticket.resolved_at || ticket.closed_at;
      if (!isComplete || !startValue || !endValue) return null;
      const start = new Date(startValue);
      const end = new Date(endValue);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
      return (end - start) / 3600000;
    };

    const departmentStats = DEPARTMENT_DIRECTORY.map((department) => {
      const deptTickets = tickets.filter((ticket) => getAssignedTeam(ticket.category_name) === department.name);
      const open = deptTickets.filter((ticket) => ticket.status === 'Open').length;
      const inProgress = deptTickets.filter((ticket) => ticket.status === 'In Progress').length;
      const resolved = deptTickets.filter((ticket) => ticket.status === 'Resolved' || ticket.status === 'Closed').length;
      const resolutionTimes = deptTickets.map(getResolutionHours).filter((hours) => hours !== null);
      const avgResolution = resolutionTimes.length
        ? resolutionTimes.reduce((sum, hours) => sum + hours, 0) / resolutionTimes.length
        : 0;
      const resolutionRate = deptTickets.length ? Math.round((resolved / deptTickets.length) * 100) : 0;

      return {
        ...department,
        total: deptTickets.length,
        open,
        inProgress,
        resolved,
        avgResolution,
        resolutionRate
      };
    });

    const totalMembers = departmentStats.reduce((sum, department) => sum + department.members, 0);
    const totalTickets = departmentStats.reduce((sum, department) => sum + department.total, 0);
    const allResolutionTimes = tickets.map(getResolutionHours).filter((hours) => hours !== null);
    const avgResolution = allResolutionTimes.length
      ? allResolutionTimes.reduce((sum, hours) => sum + hours, 0) / allResolutionTimes.length
      : 0;

    return (
      <div className="space-y-6 text-left">
        <div>
          <h2 className="font-sora text-3xl font-extrabold text-brandNavy">Departments</h2>
          <p className="text-sm text-gray-500 mt-1">Overview of all departments and their ticket performance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Departments',
              value: DEPARTMENT_DIRECTORY.length,
              iconClass: 'bg-brandNavy/10 text-brandNavy'
            },
            {
              label: 'Total Members',
              value: totalMembers,
              iconClass: 'bg-purple-50 text-purple-700'
            },
            {
              label: 'Total Tickets',
              value: totalTickets,
              iconClass: 'bg-green-50 text-green-700'
            },
            {
              label: 'Avg Resolution',
              value: avgResolution ? `${avgResolution.toFixed(1)}h` : '0h',
              iconClass: 'bg-orange-50 text-orange-700'
            }
          ].map((card) => (
            <div key={card.label} className="premium-glass rounded-[18px] p-6 border border-white/60 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${card.iconClass}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 6.75h1.5m-1.5 3h1.5m4.5-3h1.5m-1.5 3h1.5M8.25 21v-3.375c0-.621.504-1.125 1.125-1.125h3.25c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold font-sora text-brandNavy">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {departmentStats.map((department) => {
            const styles = accentStyles[department.accent] || accentStyles.brandNavy;
            return (
              <div key={department.name} className={`premium-glass rounded-[20px] border overflow-hidden bg-gradient-to-br ${styles.card}`}>
                <div className="p-6 border-b border-white/70">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-sora text-lg font-extrabold text-brandNavy">{department.name}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1">Head: {department.head}</p>
                    </div>
                    <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${styles.button}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 6.75h1.5m-1.5 3h1.5m4.5-3h1.5m-1.5 3h1.5M8.25 21v-3.375c0-.621.504-1.125 1.125-1.125h3.25c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 mt-4 rounded-full border px-3 py-1 text-xs font-extrabold ${styles.soft}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
                    </svg>
                    {department.members} Members
                  </div>
                </div>

                <div className="bg-white/70 p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Total Tickets</p>
                      <p className="mt-1 text-2xl font-extrabold font-sora text-brandNavy">{department.total}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Avg Resolution</p>
                      <p className="mt-1 text-2xl font-extrabold font-sora text-brandNavy">
                        {department.avgResolution ? `${department.avgResolution.toFixed(1)}h` : '0h'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm font-semibold">
                    <div className="flex justify-between"><span className="text-slate-600">Open</span><span className="text-blue-600">{department.open}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">In Progress</span><span className="text-orange-600">{department.inProgress}</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Resolved</span><span className="text-green-600">{department.resolved}</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>Resolution Rate</span>
                      <span className={styles.soft.split(' ')[1]}>{department.resolutionRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${department.resolutionRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="premium-glass rounded-[20px] border border-white/60 p-6 overflow-hidden">
          <h3 className="font-sora text-lg font-extrabold text-brandNavy mb-5">Department Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Department', 'Members', 'Total', 'Open', 'In Progress', 'Resolved', 'Avg Time', 'Rate'].map((heading) => (
                    <th key={heading} className="px-2 py-3 text-xs font-extrabold text-brandNavy/80">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((department) => {
                  const styles = accentStyles[department.accent] || accentStyles.brandNavy;
                  return (
                    <tr key={department.name} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-2 py-4 text-sm font-extrabold text-brandNavy">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${styles.dot}`} />
                        {department.name}
                      </td>
                      <td className="px-2 py-4 text-sm font-semibold text-slate-600">{department.members}</td>
                      <td className="px-2 py-4 text-sm font-extrabold text-brandNavy">{department.total}</td>
                      <td className="px-2 py-4 text-sm font-semibold text-blue-600">{department.open}</td>
                      <td className="px-2 py-4 text-sm font-semibold text-orange-600">{department.inProgress}</td>
                      <td className="px-2 py-4 text-sm font-semibold text-green-600">{department.resolved}</td>
                      <td className="px-2 py-4 text-sm font-extrabold text-brandNavy">
                        {department.avgResolution ? `${department.avgResolution.toFixed(1)}h` : '0h'}
                      </td>
                      <td className="px-2 py-4 text-sm font-extrabold text-brandNavy">{department.resolutionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderAdminManagement() {
    const searchTerm = adminSearchQuery.trim().toLowerCase();
    const filteredAdmins = adminDirectory.filter((admin) => {
      if (!searchTerm) return true;
      return [admin.name, admin.email, admin.role, admin.department, admin.status]
        .some((value) => value.toLowerCase().includes(searchTerm));
    });
    const activeAdmins = adminDirectory.filter((admin) => admin.status === 'Active').length;
    const superAdmins = adminDirectory.filter((admin) => admin.role === 'Super Admin').length;
    const supportAdmins = adminDirectory.filter((admin) => admin.role !== 'Super Admin').length;

    const getAdminInitials = (name) => (
      name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    );

    const getRoleBadgeClass = (role) => {
      if (role === 'Super Admin') return 'bg-brandRed/10 text-brandRed border-brandRed/15';
      if (role === 'IT Support') return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      if (role === 'Operations Admin') return 'bg-purple-50 text-purple-700 border-purple-100';
      return 'bg-brandNavy/10 text-brandNavy border-brandNavy/15';
    };

    return (
      <div className="space-y-6 text-left">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="font-sora text-3xl font-extrabold text-brandNavy">Admin Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage admins, roles, departments, and permissions.</p>
          </div>
          <button
            type="button"
            onClick={openAddAdminForm}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-brandNavy px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brandNavy/20 hover:bg-brandNavy/90 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.4" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Admin
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total Admins', value: adminDirectory.length, border: 'border-slate-200', text: 'text-brandNavy' },
            { label: 'Active', value: activeAdmins, border: 'border-green-200', text: 'text-green-700' },
            { label: 'Super Admins', value: superAdmins, border: 'border-brandRed/25', text: 'text-brandRed' },
            { label: 'Support Admins', value: supportAdmins, border: 'border-blue-200', text: 'text-blue-700' }
          ].map((card) => (
            <div key={card.label} className={`premium-glass rounded-[18px] p-6 border ${card.border}`}>
              <p className={`text-xs font-bold ${card.text}`}>{card.label}</p>
              <p className={`mt-3 text-3xl font-extrabold font-sora ${card.text}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="premium-glass rounded-[18px] p-5 border border-white/60">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(event) => setAdminSearchQuery(event.target.value)}
              placeholder="Search admins by name, email, role, or department..."
              className="w-full rounded-[14px] border border-slate-200 bg-white/80 py-3 pl-12 pr-4 text-sm font-semibold text-brandNavy outline-none transition focus:border-brandNavy/40 focus:ring-4 focus:ring-brandNavy/10"
            />
          </div>
        </div>

        <div className="premium-glass rounded-[20px] border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead className="bg-white/50 border-b border-slate-100">
                <tr>
                  {['ADMIN', 'EMAIL', 'ROLE', 'DEPARTMENT', 'STATUS', 'ACTIONS'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-[11px] font-extrabold text-brandNavy/80">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-slate-100 last:border-b-0 hover:bg-white/45 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brandNavy to-brandRed text-white flex items-center justify-center text-sm font-extrabold">
                          {getAdminInitials(admin.name)}
                        </div>
                        <span className="text-sm font-extrabold text-brandNavy">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold ${getRoleBadgeClass(admin.role)}`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{admin.department}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAdminStatus(admin.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold transition ${
                          admin.status === 'Active'
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {admin.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditAdminForm(admin)}
                          className="text-brandNavy hover:text-brandRed transition"
                          aria-label={`Edit ${admin.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-brandRed hover:text-brandRed/70 transition"
                          aria-label={`Delete ${admin.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAdminFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-brandNavy/35 backdrop-blur-sm"
              onClick={closeAdminForm}
              aria-label="Close admin form"
            />
            <form
              onSubmit={handleAdminFormSubmit}
              className="relative w-full max-w-xl premium-glass rounded-[24px] border border-white/70 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-sora text-xl font-extrabold text-brandNavy">
                    {editingAdmin ? 'Edit Admin' : 'Add Admin'}
                  </h3>
                  <p className="text-xs font-semibold text-gray-400 mt-1">Update admin access details for this dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={closeAdminForm}
                  className="w-9 h-9 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-brandRed transition flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-xs font-extrabold text-brandNavy">
                  Name
                  <input
                    type="text"
                    required
                    value={adminForm.name}
                    onChange={(event) => setAdminForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-2 w-full rounded-[14px] border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy/40 focus:ring-4 focus:ring-brandNavy/10"
                  />
                </label>
                <label className="text-xs font-extrabold text-brandNavy">
                  Email
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="mt-2 w-full rounded-[14px] border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy/40 focus:ring-4 focus:ring-brandNavy/10"
                  />
                </label>
                <label className="text-xs font-extrabold text-brandNavy">
                  Role
                  <select
                    value={adminForm.role}
                    onChange={(event) => setAdminForm((prev) => ({ ...prev, role: event.target.value }))}
                    className="mt-2 w-full rounded-[14px] border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy/40 focus:ring-4 focus:ring-brandNavy/10"
                  >
                    <option>Super Admin</option>
                    <option>Support Admin</option>
                    <option>IT Support</option>
                    <option>Operations Admin</option>
                    <option>Compliance Admin</option>
                  </select>
                </label>
                <label className="text-xs font-extrabold text-brandNavy">
                  Department
                  <select
                    value={adminForm.department}
                    onChange={(event) => setAdminForm((prev) => ({ ...prev, department: event.target.value }))}
                    className="mt-2 w-full rounded-[14px] border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy/40 focus:ring-4 focus:ring-brandNavy/10"
                  >
                    {DEPARTMENT_DIRECTORY.map((department) => (
                      <option key={department.name}>{department.name}</option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2 text-xs font-extrabold text-brandNavy">
                  Status
                  <select
                    value={adminForm.status}
                    onChange={(event) => setAdminForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="mt-2 w-full rounded-[14px] border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brandNavy/40 focus:ring-4 focus:ring-brandNavy/10"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAdminForm}
                  className="rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-500 hover:text-brandNavy transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[14px] bg-brandNavy px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-brandNavy/20 hover:bg-brandNavy/90 transition"
                >
                  {editingAdmin ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  function renderProfile() {
    return (
      <div className="premium-glass rounded-[24px] p-8 text-left">
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
        <div className="premium-glass rounded-[24px] p-8 text-center">
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
            <div key={idx} className="premium-glass-soft premium-hover rounded-[20px] p-4 flex items-center justify-between">
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
          <div className="lg:col-span-3 premium-glass rounded-[24px] p-4 flex flex-col min-h-[580px]">
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
                className="w-full pl-9 pr-4 py-2 border border-white/70 rounded-2xl outline-none focus:border-brandNavy/50 text-xs font-bold text-gray-700 bg-white/70 shadow-sm backdrop-blur-md"
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
                        ? 'bg-white/85 border-brandNavy/20 shadow-sm'
                        : 'bg-white/55 border-white/60 hover:bg-white/80 hover:shadow-sm'
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
          <div className="lg:col-span-6 premium-glass rounded-[24px] p-4 flex flex-col justify-between min-h-[580px]">
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
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brandNavy shadow-[0_8px_20px_rgba(15,27,76,0.2)] shrink-0">
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
                              ? 'bg-white/75 border border-brandNavy/10 text-gray-800 rounded-tr-none shadow-sm backdrop-blur-md'
                              : 'bg-brandNavy/10 border border-brandNavy/20 text-gray-800 rounded-tl-none shadow-sm backdrop-blur-md'
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
                  <div className="border border-white/70 rounded-2xl p-2 bg-white/65 shadow-sm backdrop-blur-md flex flex-col justify-between min-h-[90px] relative focus-within:border-brandNavy/30 transition-all">
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
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white/80 border border-white/70 text-gray-500 hover:bg-white text-[10px] font-bold shadow-sm transition-all"
                        >
                          <span>Attach File</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setQuickRepliesOpen(!quickRepliesOpen)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white/80 border border-white/70 text-gray-500 hover:bg-white text-[10px] font-bold shadow-sm transition-all"
                          >
                            <span>Quick Replies</span>
                          </button>

                          {quickRepliesOpen && (
                            <div className="absolute left-0 bottom-full mb-2 w-56 premium-glass rounded-2xl py-1 z-30 font-medium overflow-hidden">
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
                        className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-white text-[10px] font-bold bg-brandNavy hover:bg-brandDarkNavy transition-all shrink-0 premium-button"
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
              <div className="premium-glass rounded-[24px] p-5 text-left">
                <h4 className="text-sm font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider mb-4">Ticket Details</h4>
                <div className="space-y-3 text-xs font-bold">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-gray-400 shrink-0">User Email</span>
                    <span className="text-brandDarkNavy text-right break-all leading-snug">{activeMessageTicket.raised_by}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-gray-400 shrink-0">Category</span>
                    <span className="text-brandDarkNavy text-right leading-snug">Category #{activeMessageTicket.category_id}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-gray-400 shrink-0">Priority</span>
                    <span className="text-brandDarkNavy text-right leading-snug">{activeMessageTicket.priority}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-400 shrink-0">Assigned Agent</span>
                    <span className="text-brandDarkNavy text-right leading-snug">{activeMessageTicket.assigned_to || 'None'}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderDetailsDrawer() {
    return (
      <AdminTicketDetails
        drawerTicket={drawerTicket}
        drawerMessages={drawerMessages}
        drawerMessageText={drawerMessageText}
        setDrawerMessageText={setDrawerMessageText}
        drawerIsMessageSubmitting={drawerIsMessageSubmitting}
        handleCloseDrawer={handleCloseDrawer}
        handleDrawerAgentChange={handleDrawerAgentChange}
        handleDrawerStatusChange={handleDrawerStatusChange}
        handleSendDrawerMessage={handleSendDrawerMessage}
        downloadAttachment={downloadAttachment}
        getRelativeTime={getRelativeTime}
        getAssignedTeam={getAssignedTeam}
        agents={AGENTS}
        quickReplies={QUICK_REPLIES}
      />
    );
  }
}

export default AdminDashboard;




