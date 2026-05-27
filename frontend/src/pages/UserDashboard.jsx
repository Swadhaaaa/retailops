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

  return (
    <div className="min-h-screen bg-brandBg font-dmSans flex flex-col relative">
      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={relianceLogo} alt="Reliance Retail Logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] text-brandMuted uppercase ml-2 hidden sm:inline-block border-l pl-2 border-gray-200">QMS Portal</span>
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${isVendor ? 'bg-brandRed/5 border-brandRed/10 text-brandRed' : 'bg-brandNavy/5 border-brandNavy/10 text-brandNavy'}`}>
            {roleLabel}
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-300 relative ${
                    isActive ? activeSidebarBg : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {/* Active highlight vertical strip */}
                  {isActive && (
                    <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-md ${activeSidebarLine}`} />
                  )}
                  <span className={`${isActive ? '' : 'text-gray-400 hover:text-gray-600'}`}>{item.icon}</span>
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-slide-up-fade">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">
                  Good morning, {userName.split(' ')[0]} 👋
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Here is the status of your queries today.
                </p>
              </div>
            </div>

            {/* Category Selection Grid (Replaces Stat Cards) */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-brandDarkNavy font-sora">
                    Raise a Query by Category
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Select a category below to quickly submit your issue.</p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-28 animate-pulse" />
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-28 animate-pulse" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {categories.map((cat) => {
                    const isSelected = parseInt(formCategory, 10) === cat.category_id;
                    const hoverBorderColor = isVendor ? 'hover:border-brandRed/40 hover:shadow-brandRed/5' : 'hover:border-brandNavy/40 hover:shadow-brandNavy/5';
                    const activeBorderColor = isVendor ? 'border-brandRed bg-brandRed/[0.01]' : 'border-brandNavy bg-brandNavy/[0.01]';
                    
                    return (
                      <div
                        key={cat.category_id}
                        onClick={() => handleCategoryClick(cat.category_id)}
                        className={`group bg-white p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md ${hoverBorderColor} ${
                          isSelected ? activeBorderColor : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Category Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                            isVendor ? 'bg-brandRed/10 text-brandRed group-hover:bg-brandRed group-hover:text-white' : 'bg-brandNavy/10 text-brandNavy group-hover:bg-brandNavy group-hover:text-white'
                          }`}>
                            {getCategoryIcon(cat.category_id)}
                          </div>
                          
                          {/* Name & Desc */}
                          <div className="text-left">
                            <h3 className="font-bold text-[15px] text-brandDarkNavy font-sora transition-colors">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {cat.description}
                            </p>
                          </div>
                        </div>

                        {/* Action Plus Button */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                          isVendor 
                            ? 'border-gray-200 text-gray-400 group-hover:border-brandRed group-hover:bg-brandRed/5 group-hover:text-brandRed group-hover:translate-x-0.5' 
                            : 'border-gray-200 text-gray-400 group-hover:border-brandNavy group-hover:bg-brandNavy/5 group-hover:text-brandNavy group-hover:translate-x-0.5'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Queries Card & Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table Header Section */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-brandDarkNavy font-sora">
                    Recent Queries
                  </h2>
                  <p className="text-xs text-gray-400">Manage, trace, and view status of raised issues.</p>
                </div>

                {/* New Query Button */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-300 flex items-center space-x-1.5 ${buttonColor}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>New Query</span>
                </button>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brandNavy mb-3"></div>
                    <p className="text-sm font-medium">Loading queries from database...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-16 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-gray-300 mx-auto mb-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408 9-9m-9 0 9 9" />
                    </svg>
                    <p className="text-gray-500 font-bold font-sora text-[15px]">No queries raised yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "New Query" above to submit your first issue.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] text-gray-400 font-bold font-sora tracking-widest border-b border-gray-100 uppercase">
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Subject</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Priority</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Date Raised</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {tickets.map((query) => (
                        <tr key={query.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-4.5 px-6 font-bold text-brandDarkNavy font-sora">
                            {query.id}
                          </td>
                          <td className="py-4.5 px-6 text-gray-700 font-medium">
                            <div>
                              <p className="font-semibold">{query.subject}</p>
                              {query.description && (
                                <p className="text-xs text-gray-400 font-normal line-clamp-1 mt-0.5">{query.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4.5 px-6">
                            <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-200/50">
                              {query.category}
                            </span>
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                              query.priority === 'Urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : query.priority === 'High'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                  : query.priority === 'Low'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : 'bg-gray-50 text-gray-700 border border-gray-100'
                            }`}>
                              {query.priority}
                            </span>
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyles(query.status)}`}>
                              {query.status}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 text-xs text-gray-400 font-medium">
                            {query.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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