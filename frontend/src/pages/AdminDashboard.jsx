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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-slide-up-fade">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-bold font-sora">Total Tickets</span>
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-bold font-sora">Open Tickets</span>
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-bold font-sora">In Progress</span>
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-bold font-sora">Resolved Tickets</span>
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${query.status === 'Open'
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;