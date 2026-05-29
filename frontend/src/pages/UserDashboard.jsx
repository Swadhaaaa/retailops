import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { RoleContext } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';


const getCategoryIcon = (catId) => {
  switch (catId) {
    case 1: // Payment Issues
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      );
    case 2: // Inventory Issues
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      );
    case 3: // Technical Support
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      );
    case 4: // Delivery Issues
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125v-3.097c0-.626-.25-1.226-.694-1.671l-2.73-2.73a1.125 1.125 0 0 0-.796-.329H13.5m4.5 9v-5.25m0 5.25h-6.75M13.5 9h2.25M13.5 6h2.25M13.5 3h2.25M2.25 10.5h11.25m-11.25 0V3.75c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v6.75m-12 0h12" />
        </svg>
      );
    case 5: // Documentation
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25h-2.25a1.5 1.5 0 0 0-1.5 1.5v2.25m0-10.5v10.5m-9-7.5h3m-3 3h6m-6 3h6" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
      );
  }
};

const UserDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { selectedSubRole } = useContext(RoleContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Live Time state
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // CSV Export utility
  const exportTicketsCSV = () => {
    if (tickets.length === 0) {
      alert("No tickets to export.");
      return;
    }
    const headers = ["Ticket ID", "Title", "Description", "Category ID", "Priority", "Status", "Created At"];
    const rows = tickets.map(t => [
      t.ticket_id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category_id,
      t.priority,
      t.status,
      t.created_at || 'Today'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QMS_Tickets_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine current role info
  const subRole = selectedSubRole || 'business'; // default to business
  const isVendor = subRole === 'vendor';
  const roleLabel = isVendor ? 'Vendor User' : 'Business User';

  // Role-based styling accents
  const primaryBrandColor = isVendor ? 'text-brandRed bg-brandRed/10' : 'text-brandNavy bg-brandNavy/10';
  const buttonColor = isVendor ? 'bg-brandRed hover:bg-[#C2112C] shadow-brandRed/20' : 'bg-brandNavy hover:bg-brandDarkNavy shadow-brandNavy/20';
  const activeSidebarBg = isVendor ? 'bg-brandRed/5 text-brandRed font-semibold' : 'bg-brandNavy/5 text-brandNavy font-semibold';
  const activeSidebarLine = isVendor ? 'bg-brandRed' : 'bg-brandNavy';

  // Greeting name
  const userName = user?.name || (isVendor ? 'Vendor Partner' : 'Retail Executive');
  const userEmail = user?.email || 'user@relianceretail.com';

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Fetch Tickets and Categories on mount
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const ticketsRes = await api.get('/tickets/');
      setTickets(ticketsRes.data);

      const categoriesRes = await api.get('/categories/');
      setCategories(categoriesRes.data);
      if (categoriesRes.data.length > 0) {
        setFormCategory(categoriesRes.data[0].category_id);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Submit new ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formSubject || !formDescription || !formCategory) return;

    setIsSubmitting(true);
    try {
      await api.post('/tickets/', {
        title: formSubject,
        description: formDescription,
        category_id: parseInt(formCategory, 10),
        priority: formPriority
      });

      // Clear Form & Close Modal
      setFormSubject('');
      setFormDescription('');
      setFormPriority('Medium');
      if (categories.length > 0) {
        setFormCategory(categories[0].category_id);
      }
      setIsModalOpen(false);

      // Refresh data
      await fetchDashboardData();
    } catch (err) {
      console.error('Error raising ticket:', err);
      alert('Failed to submit the query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setFormCategory(categoryId);
    setIsModalOpen(true);
  };

  // Sidebar Items
  const sidebarItems = [
    { name: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )},
    { name: 'My Queries', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    )},
    { name: 'Messages', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    )},
    { name: 'Analytics', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.625C7.5 19.346 6.996 19.875 6.375 19.875h-2.25A1.375 1.375 0 0 1 3 18.5v-5.375zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.125c0 .621-.504 1.125-1.125 1.125h-2.25a1.375 1.375 0 0 1-1.375-1.375V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.625c0 .621-.504 1.125-1.125 1.125h-2.25a1.375 1.375 0 0 1-1.375-1.375V4.125z" />
      </svg>
    )},
    { name: 'Profile', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    )}
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

  // Filter stats
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const progressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  // Custom Tab Rendering
  const renderDashboard = () => {
    // We will calculate statistics dynamically here to make sure they are accurate!
    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

    // Calculate dynamic SLA or Resolution rate (default 98.4%)
    const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 98;

    // Calculate dynamic ticket bar height percentages for the analytics chart
    // Days: Sun, Mon, Tue, Wed, Thu, Fri, Sat
    // Group tickets by day of creation, or if empty use beautiful fallback distribution
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    tickets.forEach(t => {
      // parse date or use random spread to distribute nicely if no created_at
      const date = t.created_at ? new Date(t.created_at) : null;
      if (date && !isNaN(date.getTime())) {
        dayCounts[date.getDay()] += 1;
      } else {
        // dynamic visual distribution based on ticket ID to ensure a nice chart
        dayCounts[t.ticket_id % 7] += 1;
      }
    });

    // Determine max day count to scale bars properly
    const maxDayCount = Math.max(...dayCounts, 1);
    const dayHeights = dayCounts.map(c => Math.max(10, Math.round((c / maxDayCount) * 80))); // min 10% for visual beauty

    // If all dayCounts are 0, use pre-defined harmonious percentages for demo beauty
    const fallbackHeights = [35, 62, 48, 85, 52, 40, 65];
    const actualHeights = totalCount > 0 ? dayHeights : fallbackHeights;

    return (
      <div className="space-y-8 animate-slide-up-fade text-left">
        {/* Header Greeting & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 pb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 font-semibold">
              Good morning, {userName.split(' ')[0]} 👋 Raise, track, and resolve your support queries with ease.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            {/* CSV Export Button (enterprise utility) */}
            <button
              type="button"
              onClick={exportTicketsCSV}
              className="px-4.5 py-3 rounded-2xl text-xs font-bold text-gray-600 bg-white border border-gray-150/70 hover:bg-gray-50 transition-all flex items-center space-x-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export Ticket Data</span>
            </button>

            {/* Raise Query Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center space-x-2 ${buttonColor}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Raise Query</span>
            </button>
          </div>
        </div>

        {/* ----------------- 4-METRICS ROW ----------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Tickets (Dynamic Solid/Gradient Visual based on active brand role) */}
          <div className={`p-6 rounded-3xl text-white relative overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 ${
            isVendor 
              ? 'bg-gradient-to-br from-brandRed to-[#B51025] shadow-brandRed/15' 
              : 'bg-gradient-to-br from-brandNavy to-[#0A1338] shadow-brandNavy/15'
          }`}>
            <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/5 blur-sm" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/70 uppercase tracking-widest font-extrabold font-sora">Total Queries</span>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-white font-sora leading-none mt-5">{totalCount}</p>
            <p className="text-[9px] text-white/80 font-bold uppercase tracking-wider mt-4">Synced in Real-time</p>
          </div>

          {/* Card 2: Open Tickets */}
          <div className="p-6 rounded-3xl bg-white border border-gray-150/60 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] transition-all duration-300 hover:shadow-[0_16px_32px_-6px_rgba(15,27,76,0.06)] hover:-translate-y-1 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold font-sora">Open Queries</span>
              <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className={`text-4xl font-extrabold font-sora leading-none mt-5 ${isVendor ? 'text-brandRed' : 'text-brandNavy'}`}>{openCount}</p>
            <p className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Requires Attention</span>
            </p>
          </div>

          {/* Card 3: In Progress Tickets */}
          <div className="p-6 rounded-3xl bg-white border border-gray-150/60 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] transition-all duration-300 hover:shadow-[0_16px_32px_-6px_rgba(15,27,76,0.06)] hover:-translate-y-1 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold font-sora">In Progress</span>
              <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-amber-500 font-sora leading-none mt-5">{progressCount}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-4">Under Operations Review</p>
          </div>

          {/* Card 4: Resolved Tickets */}
          <div className="p-6 rounded-3xl bg-white border border-gray-150/60 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] transition-all duration-300 hover:shadow-[0_16px_32px_-6px_rgba(15,27,76,0.06)] hover:-translate-y-1 flex flex-col justify-between min-h-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold font-sora">Resolved Queries</span>
              <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-extrabold text-emerald-600 font-sora leading-none mt-5">{resolvedCount}</p>
            <p className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wider mt-4">{resolutionRate}% Resolved Rate</p>
          </div>
        </div>

        {/* ----------------- CORE WIDGET GRID LAYOUT ----------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= COLUMN 1 (LEFT GRID SPAN 8) ================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Widget 1: Query Analytics Bar Chart (Reference inspired) */}
            <div className="p-6 bg-white border border-gray-150/60 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Query Analytics</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Ticket submission distribution trends across weekdays</p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span className={`w-2.5 h-2.5 rounded-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
                  <span>Queries raised</span>
                </div>
              </div>

              {/* Responsive custom-built CSS bar chart */}
              <div className="h-44 flex items-end justify-between px-2 pt-6 relative border-b border-gray-100">
                {/* Horizontal grid guide lines */}
                <div className="absolute left-0 right-0 top-6 border-t border-gray-100/50 pointer-events-none" />
                <div className="absolute left-0 right-0 top-20 border-t border-gray-100/50 pointer-events-none" />
                <div className="absolute left-0 right-0 top-32 border-t border-gray-100/50 pointer-events-none" />

                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                  const barHeight = actualHeights[idx];
                  const ticketNum = dayCounts[idx];
                  
                  return (
                    <div key={day} className="flex flex-col items-center flex-1 group relative z-10">
                      {/* Bar tooltip details on hover */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none">
                        <div className="bg-brandDarkNavy text-white px-2.5 py-1.5 rounded-xl text-[9px] font-bold shadow-md whitespace-nowrap text-center">
                          <span className="block font-sora">{ticketNum} Tickets</span>
                          <span className="text-white/60 font-semibold mt-0.5 text-[8px]">{barHeight}% relative density</span>
                        </div>
                        {/* Little tooltip pointer */}
                        <div className="w-1.5 h-1.5 bg-brandDarkNavy rotate-45 mx-auto -mt-1" />
                      </div>

                      {/* Animated pill bar with hover trigger */}
                      <div className="w-6.5 sm:w-8 md:w-10 bg-gray-50 border border-gray-100/50 rounded-t-full h-32 flex items-end overflow-hidden">
                        <div 
                          style={{ height: `${barHeight}%` }}
                          className={`w-full rounded-t-full transition-all duration-1000 ${
                            isVendor 
                              ? 'bg-gradient-to-t from-[#B51025] to-brandRed group-hover:opacity-90' 
                              : 'bg-gradient-to-t from-[#0A1338] to-brandNavy group-hover:opacity-90'
                          }`}
                        />
                      </div>
                      
                      {/* Day Label */}
                      <span className="text-[10px] text-gray-400 font-extrabold uppercase mt-3 tracking-wider font-sora group-hover:text-brandDarkNavy transition-colors">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 2: Recent Collaboration & Activity (Reference inspired) */}
            <div className="p-6 bg-white border border-gray-150/60 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Recent Active Collaboration</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Tickets receiving operational updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('My Queries')}
                  className={`text-[10px] font-extrabold uppercase tracking-wider hover:underline flex items-center gap-1 ${isVendor ? 'text-brandRed' : 'text-brandNavy'}`}
                >
                  <span>View All Tickets</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-2.5 h-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-400 text-xs font-bold font-sora">No recent queries raised</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tickets.slice(0, 3).map((t, index) => {
                    const catObj = categories.find(c => c.category_id === t.category_id);
                    const categoryName = catObj ? catObj.name : `Category #${t.category_id}`;

                    // Circular support executive initials mock for collaboration feel
                    const mockExecInitials = ["AS", "RJ", "MK", "SL"][t.ticket_id % 4];
                    const mockExecNames = ["Aishwarya Sharma", "Rahul Joshi", "Meera Kulkarni", "Sanjay Lal"][t.ticket_id % 4];

                    return (
                      <div 
                        key={t.ticket_id} 
                        onClick={() => {
                          setSearchQuery(t.ticket_id.toString());
                          setActiveTab('My Queries');
                        }}
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer group hover:bg-gray-50/20 transition-all rounded-xl px-1"
                      >
                        <div className="flex items-center space-x-3.5">
                          {/* Executive Initials circle */}
                          <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                            index === 0 ? 'bg-indigo-500' : index === 1 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}>
                            {mockExecInitials}
                          </div>
                          
                          <div>
                            <p className="text-xs font-extrabold text-brandDarkNavy font-sora leading-snug group-hover:text-brandNavy transition-colors line-clamp-1">
                              {t.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-semibold font-dmSans">
                              <span className="text-brandDarkNavy/70">#{t.ticket_id}</span>
                              <span>&bull;</span>
                              <span>Assigned to {mockExecNames}</span>
                              <span>&bull;</span>
                              <span className="text-[9px] bg-gray-100 border border-gray-150 px-1.5 py-0.5 rounded-md font-extrabold">{categoryName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          <span className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded-xl border whitespace-nowrap block text-center ${
                            t.status === 'Open'
                              ? 'bg-blue-50/60 text-blue-700 border-blue-100'
                              : t.status === 'In Progress'
                                ? 'bg-amber-50/60 text-amber-700 border-amber-100'
                                : t.status === 'Resolved'
                                  ? 'bg-emerald-50/60 text-emerald-700 border-emerald-100'
                                  : 'bg-gray-50/60 text-gray-700 border-gray-100'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ================= COLUMN 2 & 3 (RIGHT GRID SPAN 4) ================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 3: Compact Operations Alert Card (Reference Reminders) */}
            <div className="p-6 bg-white border border-gray-150/60 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)]">
              <span className={`text-[9px] font-extrabold uppercase tracking-widest block ${isVendor ? 'text-brandRed' : 'text-brandNavy'}`}>Operations Reminder</span>
              <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora mt-1.5 leading-snug">End-of-Month clearance SLA target</h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-2 leading-relaxed">
                Logistics escalations raised between May 28 and June 3 enjoy a priority 2-hour SLA.
              </p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (categories.length > 0) {
                      handleCategoryClick(categories[0].category_id);
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-extrabold text-white transition-all text-center shadow-md ${buttonColor}`}
                >
                  Raise Urgent Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('My Queries')}
                  className="px-3 py-2.5 rounded-xl text-[10px] font-extrabold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View SLA Tickets
                </button>
              </div>
            </div>

            {/* Widget 4: SLA Compliance Circular Progress Gauge */}
            <div className="p-6 bg-white border border-gray-150/60 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] text-center">
              <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora text-left">SLA Performance Progress</h3>
              <p className="text-[10px] text-gray-400 font-semibold text-left mt-0.5">Ratio of query completions inside targeted times</p>
              
              <div className="relative flex items-center justify-center my-6">
                {/* SVG circular progress ring */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    className="stroke-gray-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    className={`transition-all duration-1000 ${isVendor ? 'stroke-brandRed' : 'stroke-brandNavy'}`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - resolutionRate / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text overlay */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-brandDarkNavy font-sora">{resolutionRate}%</span>
                  <span className="text-[8px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider font-sora">SLA Compliant</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                4.2 Hours average resolution speed this month. Outstanding compliance to SLA thresholds.
              </p>
            </div>

            {/* Widget 5: Quick-Raise Categories List Sidebar */}
            <div className="p-6 bg-white border border-gray-150/60 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)]">
              <div className="flex items-center justify-between mb-4.5">
                <div>
                  <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Quick-Raise Query</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Select category to raise ticket instantly</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className={`p-1.5 rounded-lg bg-gray-50 border border-gray-150 text-gray-400 hover:text-brandNavy transition-all`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {categories.map((cat) => {
                    const isSelected = parseInt(formCategory, 10) === cat.category_id;
                    const activeBg = isVendor ? 'bg-brandRed/5 text-brandRed border-brandRed/20' : 'bg-brandNavy/5 text-brandNavy border-brandNavy/20';
                    
                    return (
                      <div
                        key={cat.category_id}
                        onClick={() => handleCategoryClick(cat.category_id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer group shadow-sm text-left ${
                          isSelected ? activeBg : 'bg-white border-gray-100 hover:border-gray-200 hover:-translate-x-1.5'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Mini Category Icon */}
                          <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected 
                              ? isVendor ? 'bg-brandRed/10 text-brandRed' : 'bg-brandNavy/10 text-brandNavy'
                              : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'
                          }`}>
                            {React.cloneElement(getCategoryIcon(cat.category_id), { className: 'w-4.5 h-4.5' })}
                          </div>
                          
                          <div>
                            <h4 className="text-[11px] font-extrabold text-brandDarkNavy font-sora leading-tight">{cat.name}</h4>
                            <p className="text-[8px] text-gray-400 mt-0.5 line-clamp-1 pr-4">{cat.description}</p>
                          </div>
                        </div>
                        
                        {/* Mini raise arrow */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-300 opacity-40 group-hover:opacity-100 ${
                          isVendor ? 'text-brandRed group-hover:translate-x-0.5' : 'text-brandNavy group-hover:translate-x-0.5'
                        }`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget 6: Live Operations status countdown (Time Tracker reference) */}
            <div className={`p-6 rounded-3xl text-white relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-brandDarkNavy/20 ${
              isVendor 
                ? 'bg-gradient-to-br from-brandRed to-brandDarkNavy border border-brandRed/10 shadow-brandRed/10' 
                : 'bg-gradient-to-br from-brandNavy to-[#060D29] border border-brandNavy/10 shadow-brandNavy/10'
            }`}>
              <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-5 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,0 C30,40 70,60 100,100 L100,0 Z" />
                </svg>
              </div>
              <div className="relative z-10 text-left">
                <span className="text-[8px] text-white/70 uppercase tracking-widest font-extrabold font-sora">Operations Clock</span>
                <h3 className="font-extrabold text-sm text-white font-sora mt-1">Live SLA Desk Tracking</h3>
                
                {/* Live clock readout */}
                <div className="my-5 flex items-center justify-between">
                  <div className="text-3xl font-extrabold font-sora tracking-wider text-white select-none leading-none">
                    {liveTime}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-white/70 font-extrabold uppercase tracking-wider font-sora">Active</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger dynamic alert modal setup
                      setFormPriority('Urgent');
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-2 rounded-xl text-[9px] font-extrabold text-brandDarkNavy bg-white hover:bg-gray-50 transition-colors text-center shadow-md shadow-brandDarkNavy/10"
                  >
                    Urgent Escalation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('Messages')}
                    className="flex-1 py-2 rounded-xl text-[9px] font-extrabold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors text-center"
                  >
                    Open Live Chat
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  };

  const renderMyQueries = () => {
    // Ticket filtering logic
    const filteredTickets = tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ticket.ticket_id.toString().includes(searchQuery) ||
                            (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
      <div className="space-y-8 animate-slide-up-fade text-left">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">
              My Queries
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage, trace, and filter the status of all your raised support queries.
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`px-4.5 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-300 flex items-center space-x-1.5 self-start sm:self-center ${buttonColor}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Create New Ticket</span>
          </button>
        </div>

        {/* Ticket Statistics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Total */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408 9-9m-9 0 9 9" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase font-sora">Total Tickets</span>
              <p className="text-xl md:text-2xl font-extrabold text-brandDarkNavy font-sora leading-tight mt-0.5">{totalCount}</p>
            </div>
          </div>

          {/* Card 2: Open */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase font-sora">Open Status</span>
              <p className="text-xl md:text-2xl font-extrabold text-sky-600 font-sora leading-tight mt-0.5">{openCount}</p>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase font-sora">In Progress</span>
              <p className="text-xl md:text-2xl font-extrabold text-amber-600 font-sora leading-tight mt-0.5">{progressCount}</p>
            </div>
          </div>

          {/* Card 4: Resolved */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.02)] flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase font-sora">Resolved</span>
              <p className="text-xl md:text-2xl font-extrabold text-emerald-600 font-sora leading-tight mt-0.5">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by subject, description, or Ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-brandNavy outline-none text-xs font-semibold text-gray-700 transition-all bg-gray-50/30"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-gray-50/30 text-gray-700 outline-none cursor-pointer hover:border-gray-300 transition-colors font-dmSans"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-gray-50/30 text-gray-700 outline-none cursor-pointer hover:border-gray-300 transition-colors font-dmSans"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-64 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-2 bg-gray-100 rounded"></div>
                  <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-300 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408 9-9m-9 0 9 9" />
            </svg>
            <p className="text-gray-500 font-bold font-sora text-[15px]">No matching queries found</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Try adjusting your filters or search term above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((query) => {
              const catObj = categories.find(c => c.category_id === query.category_id);
              const categoryName = catObj ? catObj.name : `Category #${query.category_id}`;

              return (
                <div
                  key={query.ticket_id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(15,27,76,0.03)] hover:shadow-[0_12px_24px_-6px_rgba(15,27,76,0.06)] hover:border-gray-200 transition-all duration-300 overflow-hidden cursor-pointer p-5 flex flex-col h-full hover:translate-y-[-2px]"
                >
                  {/* Header with ID and Date */}
                  <div className="flex items-start justify-between mb-4 pb-3.5 border-b border-gray-100">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-extrabold tracking-wider">Ticket ID</span>
                      <p className="text-xs font-bold text-brandDarkNavy font-sora mt-0.5">
                        #{query.ticket_id}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap ml-2">
                      {query.created_at || 'Today'}
                    </span>
                  </div>

                  {/* Title/Subject */}
                  <div className="mb-3">
                    <p className="text-sm font-extrabold text-brandDarkNavy line-clamp-2 group-hover:text-brandNavy transition-colors font-sora leading-snug">
                      {query.title}
                    </p>
                  </div>

                  {/* Description */}
                  {query.description && (
                    <div className="mb-4 flex-grow">
                      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed font-medium">
                        {query.description}
                      </p>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="mb-4.5">
                    <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                      {categoryName}
                    </span>
                  </div>

                  {/* Priority & Status Badges Row */}
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    {/* Priority Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                      query.priority === 'Urgent'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : query.priority === 'High'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : query.priority === 'Low'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {query.priority}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                      query.status === 'Open'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : query.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : query.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {query.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMessages = () => {
    return (
      <div className="space-y-8 animate-slide-up-fade">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">
            Messages Inbox
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Secure, real-time message stream with Reliance Retail support coordinators.
          </p>
        </div>

        {/* High-fidelity inbox card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          
          <h3 className="text-lg font-extrabold text-brandDarkNavy font-sora mb-2">
            No Active Message Streams
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed mb-6 font-semibold">
            Official operational announcements and direct chat requests related to your active tickets will be displayed here. To open a new support stream, select an issue on the dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('Dashboard')}
              className={`px-5 py-3 rounded-xl text-xs font-bold text-white transition-all w-full sm:w-auto shadow-md ${buttonColor}`}
            >
              Raise a Query
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('My Queries')}
              className="px-5 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 transition-colors w-full sm:w-auto"
            >
              Browse Ticket Logs
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    return (
      <div className="space-y-8 animate-slide-up-fade text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">
            Operational Insights
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time metric graphs detailing service performance and ticket resolution time SLAs.
          </p>
        </div>

        {/* Value metrics widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Widget 1 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-widest">SLA Compliance</span>
            <p className="text-2xl font-extrabold text-emerald-600 font-sora mt-1">98.4%</p>
            <p className="text-xs text-gray-400 mt-2 font-semibold font-dmSans">Target: 95.0% SLA Threshold</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.4%' }} />
            </div>
          </div>

          {/* Widget 2 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-widest">Resolution Speed</span>
            <p className="text-2xl font-extrabold text-brandNavy font-sora mt-1">4.2 Hours</p>
            <p className="text-xs text-gray-400 mt-2 font-semibold font-dmSans">Average ticket close speed this month</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className={`h-full rounded-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} style={{ width: '85%' }} />
            </div>
          </div>

          {/* Widget 3 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-widest">Customer Satisfaction</span>
            <p className="text-2xl font-extrabold text-amber-500 font-sora mt-1">4.8 / 5.0</p>
            <p className="text-xs text-gray-400 mt-2 font-semibold font-dmSans">Feedback score from operations desk</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '96%' }} />
            </div>
          </div>
        </div>

        {/* Visual resolution charts */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">
              Query Resolutions by Category
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Monthly breakdown of successfully resolved tickets by category department.</p>
          </div>

          <div className="space-y-5">
            {/* Category 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Payment Issues & Disputes</span>
                <span className="font-extrabold">94% Resolved</span>
              </div>
              <div className="w-full bg-gray-50 border border-gray-100/50 h-3 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} style={{ width: '94%' }} />
              </div>
            </div>

            {/* Category 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Inventory & Store Audits</span>
                <span className="font-extrabold">98% Resolved</span>
              </div>
              <div className="w-full bg-gray-50 border border-gray-100/50 h-3 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} style={{ width: '98%' }} />
              </div>
            </div>

            {/* Category 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Technical Support & APIs</span>
                <span className="font-extrabold">100% Resolved</span>
              </div>
              <div className="w-full bg-gray-50 border border-gray-100/50 h-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 bg-emerald-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="space-y-8 animate-slide-up-fade text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">
            Profile Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your account credentials, partner details, and alert preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5">
          {/* Profile Card Summary */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-between text-center lg:col-span-1 min-h-[300px]">
            <div className="space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md mx-auto ${
                isVendor ? 'bg-brandRed' : 'bg-brandNavy'
              }`}>
                {getInitials(userName)}
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-brandDarkNavy font-sora">{userName}</h3>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{roleLabel}</span>
              </div>
              
              <div className="bg-gray-50 border border-gray-100/80 rounded-xl px-4 py-2 inline-block">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Vendor Account ID</span>
                <span className="text-xs font-bold text-brandDarkNavy font-sora">VND-2026-8947</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:text-brandRed hover:bg-brandRed/5 hover:border-brandRed/10 transition-all duration-300 w-full"
            >
              Sign Out Account
            </button>
          </div>

          {/* Form and Toggles */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6">
            <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">
              Corporate Association Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 font-sora tracking-widest uppercase mb-2">Registered Name</label>
                <input
                  type="text"
                  disabled
                  value={userName}
                  className="w-full border border-gray-150 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 font-sora tracking-widest uppercase mb-2">Registered Email</label>
                <input
                  type="text"
                  disabled
                  value={userEmail}
                  className="w-full border border-gray-150 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 font-sora tracking-widest uppercase mb-2">Department Division</label>
                <input
                  type="text"
                  disabled
                  value="Supply Chain Operations"
                  className="w-full border border-gray-150 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 font-sora tracking-widest uppercase mb-2">Support Tier Level</label>
                <input
                  type="text"
                  disabled
                  value="Tier-1 Enterprise SLA"
                  className="w-full border border-gray-150 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 outline-none"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-4 text-left">
              <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Notification Alert Rules</h3>
              
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-bold text-gray-700">Email ticket progression digests</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-semibold font-dmSans">Receive immediate notification when ticket state updates to In Progress or Resolved.</p>
                </div>
                <div className={`w-10 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center justify-end ${
                  isVendor ? 'bg-brandRed' : 'bg-brandNavy'
                }`}>
                  <div className="w-4.5 h-4.5 bg-white rounded-full transition-transform duration-300" />
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-bold text-gray-700">SMS critical urgency escalations</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-semibold font-dmSans font-medium">Send a real-time text alert when a coordinator marks a query as Urgent.</p>
                </div>
                <div className={`w-10 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center justify-end ${
                  isVendor ? 'bg-brandRed' : 'bg-brandNavy'
                }`}>
                  <div className="w-4.5 h-4.5 bg-white rounded-full transition-transform duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return renderDashboard();
      case 'My Queries':
        return renderMyQueries();
      case 'Messages':
        return renderMessages();
      case 'Analytics':
        return renderAnalytics();
      case 'Profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-brandBg font-dmSans flex flex-col relative">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-4">
          <img src={relianceLogo} alt="Reliance Retail Logo" className="h-10 w-auto object-contain" />
          <span className="text-[10px] text-brandMuted uppercase ml-2 hidden lg:inline-block border-l pl-3 border-gray-200 tracking-widest font-extrabold font-sora">QMS Portal</span>
        </div>

        {/* Global Ticket Search (Reference Inspired) */}
        <div className="hidden md:flex items-center relative flex-1 max-w-md mx-8">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search queries, ticket IDs or topics..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'My Queries' && activeTab !== 'Dashboard') {
                setActiveTab('My Queries');
              }
            }}
            className="w-full pl-11 pr-16 py-3 bg-gray-50/50 border border-gray-200/80 rounded-2xl outline-none focus:border-brandNavy/60 focus:bg-white text-xs font-bold text-gray-700 transition-all font-dmSans placeholder-gray-400/80"
          />
          <div className="absolute right-0 inset-y-0 pr-4 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-extrabold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-sm font-sora">⌘ F</kbd>
          </div>
        </div>

        {/* Navigation Actions & User Profile */}
        <div className="flex items-center space-x-5">
          {/* Messages Direct Link (Mail Icon) */}
          <button 
            type="button"
            onClick={() => setActiveTab('Messages')}
            className={`p-2.5 rounded-xl border border-gray-150/60 hover:bg-gray-50 text-gray-500 transition-all relative ${activeTab === 'Messages' ? 'bg-gray-50 text-brandNavy border-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white ${isVendor ? 'bg-brandRed' : 'bg-brandNavy animate-pulse'}`} />
          </button>

          {/* Quick Notice Bell */}
          <button 
            type="button"
            onClick={() => setActiveTab('Dashboard')}
            className="p-2.5 rounded-xl border border-gray-150/60 hover:bg-gray-50 text-gray-500 transition-all relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {tickets.filter(t => t.priority === 'Urgent' || t.status === 'Open').length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold text-white ring-2 ring-white ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`}>
                {tickets.filter(t => t.priority === 'Urgent' || t.status === 'Open').length}
              </span>
            )}
          </button>

          {/* User Profile Card */}
          <div className="flex items-center space-x-3.5 pl-3 border-l border-gray-100">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-brandDarkNavy font-sora">{userName}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{userEmail}</p>
            </div>
            {/* Custom Premium Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white border shadow-sm font-sora ${isVendor ? 'bg-gradient-to-br from-brandRed to-[#A50E23] border-brandRed/20' : 'bg-gradient-to-br from-brandNavy to-[#080E29] border-brandNavy/20'}`}>
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>

      {/* ----------------- CORE WORKSPACE ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[240px] bg-white border-r border-gray-100 shrink-0 hidden md:flex flex-col justify-between p-5 z-20">
          {/* Navigation Menu */}
          <div className="space-y-1.5">
            <div className="px-3 mb-4">
              <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase block">Menu</span>
            </div>
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 relative ${
                    isActive ? activeSidebarBg : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/60'
                  }`}
                >
                  {/* Active highlight vertical strip */}
                  {isActive && (
                    <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-md ${activeSidebarLine}`} />
                  )}
                  <span className={`${isActive ? '' : 'text-gray-400 hover:text-gray-600'}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar promo widget (Reference inspired Mobile App card) & Signout */}
          <div className="space-y-5">
            {/* Premium mobile promo card */}
            <div className={`p-4 rounded-3xl border text-left overflow-hidden relative group transition-all duration-300 ${isVendor ? 'bg-gradient-to-br from-brandRed/10 to-transparent border-brandRed/10' : 'bg-gradient-to-br from-brandNavy/10 to-transparent border-brandNavy/10'}`}>
              {/* Background abstract shape */}
              <div className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full opacity-10 blur-sm group-hover:scale-110 transition-transform ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
              <span className={`text-[9px] font-extrabold uppercase tracking-widest block ${isVendor ? 'text-brandRed' : 'text-brandNavy'}`}>New Release</span>
              <h4 className="text-[11px] font-extrabold text-brandDarkNavy font-sora mt-1 leading-snug">Download mobile App</h4>
              <p className="text-[9px] text-gray-400 font-semibold mt-1 leading-normal">Track operational escalations on your phone.</p>
              <button 
                type="button" 
                onClick={() => alert("QMS Mobile App download initialized. Available on iOS & Android soon!")}
                className={`mt-3.5 w-full py-2 rounded-xl text-[9px] font-extrabold text-white transition-all shadow-sm flex items-center justify-center space-x-1 ${isVendor ? 'bg-brandRed hover:bg-[#C2112C]' : 'bg-brandNavy hover:bg-brandDarkNavy'}`}
              >
                <span>Download App</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:text-brandRed hover:bg-brandRed/5 transition-all duration-300 border border-transparent hover:border-brandRed/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4.5 h-4.5 text-gray-400 hover:text-inherit">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span>Sign Out Account</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-slide-up-fade">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* ----------------- RAISE NEW QUERY MODAL ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-brandNavy/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-scale-in">
            {/* Upper Red/Navy Accent bar */}
            <div className={`h-2.5 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-brandDarkNavy font-sora">
                    Raise New Query
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Fill in details to submit a new ticket directly to operations.
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitTicket} className="space-y-5">
                {/* Subject/Title */}
                <div>
                  <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                    Subject / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discrepancy in Invoice payment #193"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-brandNavy transition-all text-sm bg-gray-50/50"
                  />
                </div>

                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-3 rounded-xl outline-none focus:border-brandNavy transition-all text-sm bg-gray-50/50 cursor-pointer font-medium text-gray-700"
                    >
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                      Priority Level
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-3 rounded-xl outline-none focus:border-brandNavy transition-all text-sm bg-gray-50/50 cursor-pointer font-medium text-gray-700"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Provide exact details, ticket references, or item details here so our support agents can resolve it quickly..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl outline-none focus:border-brandNavy transition-all text-sm bg-gray-50/50 resize-none font-medium text-gray-700"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formSubject || !formDescription}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-300 flex items-center space-x-1.5 ${buttonColor} ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                        <span>Raise Query</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;