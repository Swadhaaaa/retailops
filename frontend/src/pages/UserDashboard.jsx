import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { RoleContext } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';
import DefaultCategoryIcon from '../components/DefaultCategoryIcon';

/* ─────────────────────────────────────────────
   GLOBAL STYLES injected once
───────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes pageFadeSlideIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .page-enter {
    animation: pageFadeSlideIn 0.22s cubic-bezier(.4,0,.2,1) both;
  }

  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .animate-slide-up-fade { animation: slideUpFade .35s ease both; }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(.95); }
    to   { opacity: 1; transform: scale(1);   }
  }
  .animate-scale-in { animation: scaleIn .2s cubic-bezier(.4,0,.2,1) both; }

  @keyframes notifPulse {
    0%, 100% { transform: scale(1);   opacity: 1; }
    50%       { transform: scale(1.4); opacity: .6; }
  }
  .notif-pulse { animation: notifPulse 2s ease-in-out infinite; }

  @keyframes liveDot {
    0%, 100% { opacity: 1; }
    50%       { opacity: .3; }
  }
  .live-dot { animation: liveDot 1.4s ease-in-out infinite; }

  @keyframes barFill {
    from { width: 0; }
  }
  .bar-animate { animation: barFill .9s cubic-bezier(.4,0,.2,1) both; }

  @keyframes trendUp {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-3px); }
  }
  .trend-up { animation: trendUp 1.6s ease-in-out infinite; }

  .cat-card {
    transition: transform .25s cubic-bezier(.4,0,.2,1),
                box-shadow .25s cubic-bezier(.4,0,.2,1),
                border-color .25s ease;
  }
  .cat-card:hover { transform: translateY(-5px); }

  .action-card {
    transition: transform .22s cubic-bezier(.4,0,.2,1),
                box-shadow .22s ease,
                border-color .22s ease;
  }
  .action-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 28px rgba(0,0,0,.07);
  }

  .stat-card {
    transition: transform .22s cubic-bezier(.4,0,.2,1),
                box-shadow .22s ease;
  }
  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,.06);
  }

  .sidebar-item {
    transition: background .18s ease, color .18s ease,
                transform .15s ease, box-shadow .18s ease;
  }
  .sidebar-item:hover { transform: translateX(2px); }

  .action-card:hover .icon-scale,
  .cat-card:hover .icon-scale,
  .stat-card:hover .icon-scale { transform: scale(1.12); }
  .icon-scale { transition: transform .22s cubic-bezier(.4,0,.2,1); }

  .ticket-card {
    transition: transform .22s cubic-bezier(.4,0,.2,1),
                box-shadow .22s ease,
                border-color .22s ease;
  }
  .ticket-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 36px rgba(0,0,0,.08);
    border-color: #c7d2fe;
  }

  .cat-arrow { 
    opacity: 0; 
    transform: translateX(-6px);
    transition: opacity .2s ease, transform .2s ease;
  }
  .cat-card:hover .cat-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  .glass-navbar {
    background: rgba(255,255,255,.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  @keyframes badgePop {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.3); }
    60%  { transform: scale(.9); }
    100% { transform: scale(1); }
  }
  .badge-pop { animation: badgePop .5s ease forwards; }

  .icon-glow-emerald { box-shadow: 0 0 18px rgba(16,185,129,.18); }
  .icon-glow-blue    { box-shadow: 0 0 18px rgba(59,130,246,.18); }
  .icon-glow-indigo  { box-shadow: 0 0 18px rgba(99,102,241,.18); }
  .icon-glow-purple  { box-shadow: 0 0 18px rgba(168,85,247,.18); }
  .icon-glow-teal    { box-shadow: 0 0 18px rgba(20,184,166,.18); }
  .icon-glow-amber   { box-shadow: 0 0 18px rgba(245,158,11,.18); }
  .icon-glow-rose    { box-shadow: 0 0 18px rgba(244,63,94,.18); }
  .icon-glow-red     { box-shadow: 0 0 18px rgba(239,68,68,.18); }
  .icon-glow-cyan    { box-shadow: 0 0 18px rgba(6,182,212,.18); }
  .icon-glow-violet  { box-shadow: 0 0 18px rgba(139,92,246,.18); }
  .icon-glow-orange  { box-shadow: 0 0 18px rgba(249,115,22,.18); }
  .icon-glow-lime    { box-shadow: 0 0 18px rgba(132,204,22,.18); }
  .icon-glow-fuchsia { box-shadow: 0 0 18px rgba(217,70,239,.18); }
  .icon-glow-gray    { box-shadow: 0 0 18px rgba(107,114,128,.12); }
  .icon-glow-yellow  { box-shadow: 0 0 18px rgba(234,179,8,.18);   }
`;

const injectGlobalStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('ud-global-styles')) {
    const el = document.createElement('style');
    el.id = 'ud-global-styles';
    el.textContent = GLOBAL_STYLES;
    document.head.appendChild(el);
  }
};

/* ─────────────────────────────────────────────
   DYNAMIC CATEGORY STYLE HELPER
   Alternates red and blue design language based on ID
───────────────────────────────────────────── */
const getCategoryStyles = (categoryId) => {
  const index = parseInt(categoryId, 10) || 0;
  if (index % 2 === 0) {
    return {
      bg: 'bg-brandRed/8 hover:bg-brandRed/12 text-brandRed border-brandRed/20 hover:border-brandRed/40',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(227,24,55,.12)]',
      glowClass: 'icon-glow-rose',
      textColor: 'text-brandRed'
    };
  } else {
    return {
      bg: 'bg-brandNavy/8 hover:bg-brandNavy/12 text-brandNavy border-brandNavy/20 hover:border-brandNavy/40',
      hoverShadow: 'hover:shadow-[0_8px_24px_rgba(15,27,76,.12)]',
      glowClass: 'icon-glow-blue',
      textColor: 'text-brandNavy'
    };
  }
};

/* ─────────────────────────────────────────────
   STATIC CATEGORIES
───────────────────────────────────────────── */
const staticCategories = [
  { category_id: 1, name: 'Payment Issues', description: 'Invoice and payment related issues' },
  { category_id: 2, name: 'Inventory Issues', description: 'Stock and inventory problems' },
  { category_id: 3, name: 'Technical Support', description: 'System and technical support' },
  { category_id: 4, name: 'Delivery Issues', description: 'Shipment and delivery concerns' },
  { category_id: 5, name: 'Documentation', description: 'Document and compliance issues' },
  { category_id: 6, name: 'Order Discrepancies', description: 'Mismatched order quantities or items' },
  { category_id: 7, name: 'User Onboarding', description: 'Registration and profile setup queries' },
  { category_id: 8, name: 'Quality Control', description: 'Product quality and damage complaints' },
  { category_id: 9, name: 'Pricing & Billing', description: 'Pricing disputes and billing inquiries' },
  { category_id: 10, name: 'SLA Violations', description: 'SLA delays and performance escalations' },
  { category_id: 11, name: 'Logistics Support', description: 'Transport, routing, and carrier issues' },
  { category_id: 12, name: 'Database & Sync', description: 'Data mismatch and sync issues' },
  { category_id: 13, name: 'Account & Security', description: 'Security settings and account recovery' },
  { category_id: 14, name: 'Refunds & Returns', description: 'Product return requests and refunds' },
  { category_id: 15, name: 'Compliance & Audits', description: 'Regulatory, policy, and audit support' },
  { category_id: 16, name: 'Vendor Management', description: 'Vendor onboarding, agreements, and disputes' },
  { category_id: 17, name: 'Store Operations', description: 'In-store operational queries and escalations' },
  { category_id: 18, name: 'HR & Workforce', description: 'Staff queries, attendance, and HR support' },
  { category_id: 19, name: 'IT Infrastructure', description: 'Network, hardware, and system outages' },
  { category_id: 20, name: 'Finance & Reporting', description: 'Financial reports, budgets, and reconciliation' }
];

const getCategoryIcon = (catId) => {
  const styles = getCategoryStyles(catId);
  return <DefaultCategoryIcon className={`w-6 h-6 ${styles.textColor}`} />;
};

const formatTicketDate = (dateStr) => {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${formattedDate}, ${formattedTime}`;
  } catch (e) {
    return dateStr;
  }
};

const getCategoryPlaceholders = (catId) => {
  const id = parseInt(catId, 10);
  switch (id) {
    case 1:
      return {
        subject: 'e.g. Invoice payment delay for #193',
        description: 'e.g. Please explain why payment for invoice #193 has not been processed. It was approved on May 15.'
      };
    case 2:
      return {
        subject: 'e.g. Mismatch in stock count for item SKU-99',
        description: 'e.g. The physical stock count for item SKU-99 shows 15 units, but the system shows 30 units.'
      };
    case 3:
      return {
        subject: 'e.g. Unable to login to the portal',
        description: 'e.g. I am getting a timeout error every time I try to log in to the retail portal.'
      };
    case 4:
      return {
        subject: 'e.g. Shipment delayed for order #4829',
        description: 'e.g. Order #4829 was scheduled to arrive yesterday but the carrier tracking is not updating.'
      };
    case 5:
      return {
        subject: 'e.g. Request for updated tax certificates',
        description: 'e.g. We need the latest GST certificate from our vendor profiles to verify tax benefits.'
      };
    case 6:
      return {
        subject: 'e.g. Missing items in delivery challan',
        description: 'e.g. The delivery challan mentions 5 boxes of item B, but only 3 boxes were received.'
      };
    case 7:
      return {
        subject: 'e.g. New user credentials request',
        description: 'e.g. Please create a new retail store executive user account for Jane Doe.'
      };
    case 8:
      return {
        subject: 'e.g. Damaged products received in batch 12',
        description: 'e.g. 10 bottles of cooking oil in batch 12 were found leaking upon arrival.'
      };
    case 9:
      return {
        subject: 'e.g. Dispute on invoice tax calculation',
        description: 'e.g. The tax rate on invoice #8812 was calculated at 18% instead of the agreed 12%.'
      };
    case 10:
      return {
        subject: 'e.g. Delayed response on ticket #204',
        description: 'e.g. Ticket #204 has been in "Open" status for over 48 hours without any assignment.'
      };
    case 11:
      return {
        subject: 'e.g. Truck routing issue at gate 2',
        description: 'e.g. Delivery truck MH-12-AB-3456 is stuck at gate 2 due to a system authorization error.'
      };
    case 12:
      return {
        subject: 'e.g. Product catalog sync failure',
        description: 'e.g. The daily product catalog updates from the central database are not reflecting on the store terminal.'
      };
    case 13:
      return {
        subject: 'e.g. Two-factor authentication reset',
        description: 'e.g. Please reset the 2FA for user email admin@retail.com as they changed their mobile device.'
      };
    case 14:
      return {
        subject: 'e.g. Return request for defective batch',
        description: 'e.g. We need to initiate a return request for 50 defective units of product XYZ.'
      };
    case 15:
      return {
        subject: 'e.g. Policy document verification',
        description: 'e.g. Please verify if our store complies with the new environment policy guidelines.'
      };
    case 16:
      return {
        subject: 'e.g. Vendor agreement renewal query',
        description: 'e.g. The annual contract with vendor ABC is expiring next month. Need renewal terms.'
      };
    case 17:
      return {
        subject: 'e.g. Store register checkout error',
        description: 'e.g. Cash register 3 is throwing a connection error when processing credit card payments.'
      };
    case 18:
      return {
        subject: 'e.g. Attendance register correction',
        description: 'e.g. Correction needed in attendance register for employee ID 582 for May 24.'
      };
    case 19:
      return {
        subject: 'e.g. Wi-Fi outage in store warehouse',
        description: 'e.g. The Wi-Fi connection in section B of the warehouse has been disconnected since this morning.'
      };
    case 20:
      return {
        subject: 'e.g. Monthly reconciliation report dispute',
        description: 'e.g. Discrepancy found in the monthly sales reconciliation report for store region West.'
      };
    default:
      return {
        subject: 'e.g. Enter a brief subject / title',
        description: 'e.g. Provide details, references, or item info...'
      };
  }
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
const UserDashboard = () => {
  injectGlobalStyles();

  const { user, logout } = useContext(AuthContext);
  const { selectedSubRole } = useContext(RoleContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [transitionKey, setTransitionKey] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState(staticCategories);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryLocked, setIsCategoryLocked] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

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
    "Thank you. Please let me know if any additional information is required.",
    "I have uploaded the requested documents.",
    "Could you please expedite this query?",
    "Great, appreciate the quick response.",
    "This issue is resolved. You can close this ticket."
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
      // Sync detailed ticket info with current response
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

  // Set default active message ticket on load
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
      fetchDashboardData();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message.');
    } finally {
      setIsMessageSubmitting(false);
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

  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('1');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [liveTime, setLiveTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const [notifPopped, setNotifPopped] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setNotifPopped(true);
      setTimeout(() => setNotifPopped(false), 600);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const exportTicketsCSV = () => {
    if (tickets.length === 0) { alert('No tickets to export.'); return; }
    const headers = ['Ticket ID', 'Title', 'Description', 'Category ID', 'Priority', 'Status', 'Created At'];
    const rows = tickets.map(t => [
      t.ticket_id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category_id, t.priority, t.status, t.created_at || 'Today'
    ]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `QMS_Tickets_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const subRole = selectedSubRole || 'business';
  const isVendor = subRole === 'vendor';
  const roleLabel = isVendor ? 'User' : 'Business User';

  const primaryBrandColor = isVendor ? 'text-brandRed bg-brandRed/10' : 'text-brandNavy bg-brandNavy/10';
  const buttonColor = isVendor
    ? 'bg-brandRed hover:bg-[#C2112C] shadow-brandRed/20'
    : 'bg-brandNavy hover:bg-brandDarkNavy shadow-brandNavy/20';

  const activeSidebarBg = isVendor
    ? 'bg-brandRed/8 text-brandRed font-semibold shadow-[inset_0_0_0_1px_rgba(220,38,38,.08)]'
    : 'bg-brandNavy/8 text-brandNavy font-semibold shadow-[inset_0_0_0_1px_rgba(15,27,76,.08)]';
  const activeSidebarLine = isVendor ? 'bg-brandRed' : 'bg-brandNavy';
  const activeSidebarGlow = isVendor
    ? 'shadow-[0_2px_10px_rgba(220,38,38,.12)]'
    : 'shadow-[0_2px_10px_rgba(15,27,76,.10)]';

  const userName = user?.name || (isVendor ? 'User Partner' : 'Retail Executive');
  const userEmail = user?.email || 'user@relianceretail.com';

  const getInitials = (name) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const ticketsRes = await api.get('/tickets/');
      setTickets(ticketsRes.data);
      const categoriesRes = await api.get('/categories/');
      if (categoriesRes.data?.length) {
        setCategories(categoriesRes.data);
        setFormCategory(categoriesRes.data[0].category_id.toString());
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setTransitionKey(k => k + 1);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleCategoryClick = (categoryId) => {
    setFormCategory(categoryId.toString());
    setIsCategoryLocked(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCategoryLocked(false);
    setFormSubject('');
    setFormDescription('');
    setFormPriority('Medium');
    setAttachment(null);
    setAttachmentError('');
    setFormCategory(categories[0]?.category_id?.toString() || '1');
    setIsSubmittedSuccessfully(false);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formSubject || !formDescription || !formCategory) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formSubject);
      formData.append('description', formDescription);
      formData.append('category_id', parseInt(formCategory, 10));
      formData.append('priority', formPriority);
      if (attachment) formData.append('attachment', attachment);

      await api.post('/tickets/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsSubmittedSuccessfully(true);
      await fetchDashboardData();

      // Automatically close modal after 3 seconds
      setTimeout(() => {
        handleCloseModal();
      }, 3000);
    } catch (err) {
      console.error('Error raising ticket:', err);
      alert('Failed to submit the query. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setAttachmentError('Maximum file size is 25MB'); setAttachment(null); return; }
    setAttachmentError(''); setAttachment(file);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setAttachmentError('Maximum file size is 25MB'); setAttachment(null); return; }
    setAttachmentError(''); setAttachment(file);
  };

  /* ── Sidebar items ── */
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
      name: 'Track Status', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
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
      name: 'Profile', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    }
  ];

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Open': return 'bg-brandNavy/10 text-brandNavy border-brandNavy/20';
      case 'In Progress': return 'bg-brandGold/12 text-brandGold border-brandGold/30';
      case 'Resolved': return 'bg-brandRed/10 text-brandRed border-brandRed/20';
      case 'Urgent': return 'bg-brandRed/10 text-brandRed border-brandRed/20';
      default: return 'bg-brandMuted/10 text-brandMuted border-brandMuted/20';
    }
  };

  /* ══════════════════════════════════════════
     DASHBOARD TAB
  ══════════════════════════════════════════ */
  const renderDashboard = () => {
    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

    return (
      <div className="space-y-6 text-left">

        {/* ── Welcome Banner ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-brandDarkNavy font-sora">
                Good Morning, {userName}! 
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brandNavy/8 border border-brandNavy/20 text-[9px] font-bold text-brandNavy ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brandNavy live-dot inline-block" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-semibold font-dmSans">
              Raise a query, track existing requests, or check recent updates.
              <span className="ml-2 text-gray-400">· 3 tickets updated today</span>
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-center text-left shadow-sm">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 flex flex-col justify-center text-left shadow-sm">
            <span className="text-sm font-medium text-blue-500">Open</span>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{openCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-orange-200 flex flex-col justify-center text-left shadow-sm">
            <span className="text-sm font-medium text-orange-500">In Progress</span>
            <h3 className="text-2xl font-bold text-orange-600 mt-1">{progressCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-green-200 flex flex-col justify-center text-left shadow-sm">
            <span className="text-sm font-medium text-green-500">Resolved</span>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{resolvedCount}</h3>
          </div>
        </div>

        {/* ── 3 Action Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: 'Raise a Query', desc: 'Select a category and raise a new query',
              bg: 'bg-brandRed', shadow: 'shadow-brandRed/20', glowHover: 'hover:shadow-[0_14px_28px_rgba(227,24,55,.18)]',
              borderHover: 'hover:border-brandRed/30',
              onClick: () => { setIsCategoryLocked(false); setIsModalOpen(true); },
              icon: <span className="text-xl font-bold text-white icon-scale">+</span>
            },
            {
              label: 'View My Queries', desc: 'Track and view all your queries',
              bg: 'bg-brandNavy', shadow: 'shadow-brandNavy/20', glowHover: 'hover:shadow-[0_14px_28px_rgba(15,27,76,.18)]',
              borderHover: 'hover:border-brandNavy/30',
              onClick: () => switchTab('My Queries'),
              icon: (
                <svg className="w-5 h-5 text-white icon-scale" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
                </svg>
              )
            },
            {
              label: 'Messages', desc: 'Check replies and notifications',
              bg: 'bg-brandGold', shadow: 'shadow-brandGold/20', glowHover: 'hover:shadow-[0_14px_28px_rgba(245,166,35,.18)]',
              borderHover: 'hover:border-brandGold/30',
              onClick: () => switchTab('Messages'),
              icon: (
                <svg className="w-5 h-5 text-white icon-scale" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              )
            }
          ].map((card) => (
            <div
              key={card.label}
              onClick={card.onClick}
              className={`action-card bg-white border border-gray-100/80 rounded-3xl p-5 cursor-pointer flex items-center space-x-4 ${card.glowHover} ${card.borderHover}`}
            >
              <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center shadow-md ${card.shadow} shrink-0`}>
                {card.icon}
              </div>
              <div>
                <h3 className="text-[13px] font-extrabold text-brandDarkNavy font-sora leading-none">{card.label}</h3>
                <p className="text-[10px] text-gray-500 mt-1.5 font-semibold leading-normal font-dmSans">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Full-Width Category Grid ── */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,.01)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-brandDarkNavy font-sora">Choose a Category to Raise a Query</h3>
              <p className="text-[10px] text-gray-500 mt-0.5 font-semibold font-dmSans">Select the most relevant category for your issue</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat) => {
              const styles = getCategoryStyles(cat.category_id);
              return (
                <div
                  key={cat.category_id}
                  onClick={() => handleCategoryClick(cat.category_id)}
                  className={`cat-card p-5 cursor-pointer flex flex-col justify-between min-h-[200px] relative rounded-2xl border ${styles.bg} ${styles.hoverShadow}`}
                >

                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm icon-scale ${styles.glowClass}`}>
                    <DefaultCategoryIcon className={`w-8 h-8 ${styles.textColor}`} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-[13px] font-extrabold font-sora text-brandDarkNavy leading-none">{cat.name}</h4>
                      <span className="cat-arrow text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5 font-semibold leading-relaxed line-clamp-2">{cat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  /* ══════════════════════════════════════════
     MY QUERIES TAB
  ══════════════════════════════════════════ */
  const renderMyQueries = () => {
    const filteredTickets = tickets.filter(ticket => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticket_id.toString().includes(searchQuery) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
      <div className="space-y-8 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-brandDarkNavy font-sora">My Queries</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all your raised tickets.</p>
          </div>
          <button
            onClick={() => { setIsCategoryLocked(false); setIsModalOpen(true); }}
            className={`px-5 py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center space-x-2 ${buttonColor}`}
          >
            <span>Create Ticket</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none w-full lg:max-w-sm" />
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none">
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none">
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center">
            <p className="text-gray-500 font-bold">No matching tickets found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((query) => {
                const catObj = categories.find(c => c.category_id === query.category_id);
                const categoryName = catObj ? catObj.name : `Category #${query.category_id}`;
                return (
                  <div
                    key={query.ticket_id}
                    onClick={() => setSelectedTicket(query)}
                    className="ticket-card group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Ticket ID</p>
                        <h3 className="text-lg font-extrabold text-brandDarkNavy mt-1">#{query.ticket_id}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border ${getStatusBadgeStyles(query.status)}`}>
                        {query.status}
                      </span>
                    </div>
                    <h2 className="text-[16px] font-extrabold text-brandDarkNavy leading-snug line-clamp-2">{query.title}</h2>
                    <p className="text-sm text-gray-500 mt-3 line-clamp-3 leading-relaxed min-h-[70px]">{query.description || 'No description'}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Category</p>
                        <p className="text-sm font-bold text-brandDarkNavy mt-1">{categoryName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-gray-400 font-bold">Priority</p>
                        <p className="text-sm font-bold text-brandDarkNavy mt-1">{query.priority}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const formatMessageTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return '';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};
  
  /* ══════════════════════════════════════════
     MESSAGES TAB
  ══════════════════════════════════════════ */
  // MESSAGES TAB 
  const renderMessages = () => {
    if (tickets.length === 0) {
      return (
        <div className="space-y-8">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Messages</h1>
            <p className="text-sm text-gray-500 mt-1">Secure, real-time message stream with Reliance Retail support coordinators.</p>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center max-w-xl mx-auto mt-6">
            <div className="w-16 h-16 rounded-2xl bg-brandNavy/8 text-brandNavy flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-brandDarkNavy font-sora mb-2">No Active Message Streams</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed mb-6 font-semibold">
              Official operational announcements and direct chat requests related to your active tickets will appear here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => switchTab('Dashboard')} className={`px-5 py-3 rounded-xl text-xs font-bold text-white transition-all w-full sm:w-auto shadow-md ${buttonColor}`}>
                Raise a Query
              </button>
              <button onClick={() => switchTab('My Queries')} className="px-5 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 transition-colors w-full sm:w-auto">
                Browse Ticket Logs
              </button>
            </div>
          </div>
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

    return (
      <div className="space-y-6 text-left font-dmSans">
        {/* Messages Header */}
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Messages</h1>
          <p className="text-xs text-gray-500 mt-1 font-semibold">
            Stay updated with your ticket conversations and important announcements.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open Tickets', count: messagesStats.open, icon: (
              <svg className="w-5 h-5 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l4.03 3.359a1.125 1.125 0 0 1-1.42 1.742l-4.03-3.359a1.125 1.125 0 0 0-1.5 0L6.205 9.004a1.125 1.125 0 0 1-1.42-1.742l4.03-3.359a1.125 1.125 0 0 0 .405-.864V3.03c0-.621.504-1.125 1.125-1.125h1.125c.621 0 1.125.504 1.125 1.125Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" />
              </svg>
            ), bg: 'bg-[#F0F4FF]', text: 'text-brandNavy' },
            { label: 'Pending Tickets', count: messagesStats.pending, icon: (
              <svg className="w-5 h-5 text-brandGold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            ), bg: 'bg-brandGold/8', text: 'text-brandGold' },
            { label: 'Resolved Tickets', count: messagesStats.resolved, icon: (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            ), bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Announcements', count: messagesStats.announcements, icon: (
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            ), bg: 'bg-purple-50', text: 'text-purple-600' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.text}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-wider">{stat.label}</p>
                  <h4 className="text-lg font-extrabold text-brandDarkNavy font-sora mt-0.5 leading-none">{stat.count}</h4>
                </div>
              </div>
              <button onClick={() => switchTab('My Queries')} className="text-[10px] font-bold text-brandNavy hover:underline">View all &gt;</button>
            </div>
          ))}
        </div>

        {/* 3-Column Message Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Recent Ticket Updates */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 p-4 shadow-sm flex flex-col min-h-[580px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider">Recent Ticket Updates</h3>
              <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
              </button>
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
                // Compute last message and sender
                const isUnread = t.status === 'Needs Clarification';
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
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${isSelected ? 'bg-brandNavy text-white' : 'bg-gray-50 text-gray-400 border border-gray-150/60'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-brandDarkNavy">#{t.ticket_id}</span>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brandRed shrink-0" />
                        )}
                      </div>
                      <h4 className="text-[11px] font-extrabold text-gray-800 truncate mt-0.5">{t.title}</h4>
                      <p className="text-[9px] text-brandRed mt-1 font-bold">
                        {t.status === 'Needs Clarification' ? 'Support feedback' : (t.status === 'Resolved' ? 'Resolved' : 'No new updates')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredMessageTickets.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">No tickets found</div>
              )}
            </div>

            <button onClick={() => switchTab('My Queries')} className="mt-4 text-center text-xs font-extrabold text-brandNavy hover:underline py-2 border-t border-gray-100 flex items-center justify-center space-x-1.5 w-full">
              <span>View All Conversations</span>
              <span>&gt;</span>
            </button>
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
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        activeMessageTicket.status === 'Open'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : activeMessageTicket.status === 'In Progress'
                          ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                          : activeMessageTicket.status === 'Under Review'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {activeMessageTicket.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-600 truncate mt-1">{activeMessageTicket.title}</h3>
                    <p className="text-[9px] text-gray-400 mt-0.5">Created on {formatDate(activeMessageTicket.created_at)}</p>
                  </div>
                  
                  {/* Action Menu */}
                  <button className="p-1 rounded hover:bg-gray-50 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" />
                    </svg>
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3.5 max-h-[300px] pr-1">
                  <div className="text-center">
                    <span className="text-[10px] bg-gray-50 border border-gray-150/40 text-gray-400 px-3 py-1 rounded-full font-bold">
                      Ticket Created
                    </span>
                  </div>

                  {messages.map((msg, idx) => {
                    const isSupport = msg.sender_role === 'admin';
                    return (
                      <div key={idx} className={`flex items-start space-x-2.5 max-w-[85%] ${isSupport ? 'mr-auto text-left' : 'ml-auto flex-row-reverse space-x-reverse text-right'}`}>
                        {/* Avatar */}
                        {isSupport ? (
                          <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 bg-white shadow-sm">
                            <img src={relianceLogo} alt="Reliance" className="w-6 h-auto object-contain" />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`}>
                            {getInitials(userName)}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400">
                            <span>{isSupport ? 'Reliance Support' : 'You'}</span>
                            <span className="font-medium text-[9px]">• {formatMessageTime(msg.created_at)}</span>
                          </div>
                          
                          <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                            isSupport
                              ? 'bg-blue-50/70 border border-blue-100 text-gray-800 rounded-tl-none'
                              : (isVendor 
                                  ? 'bg-brandRed/5 border border-brandRed/10 text-gray-800 rounded-tr-none'
                                  : 'bg-brandNavy/5 border border-brandNavy/10 text-gray-800 rounded-tr-none')
                          }`}>
                            <p className="whitespace-pre-line">{msg.message_text}</p>
                            
                            {/* Message Level Attachments */}
                            {msg.attachment_path && (
                              <div className="mt-2.5 p-2 rounded-xl bg-white border border-gray-100 flex items-center justify-between space-x-3 shadow-sm max-w-xs">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
                                  </svg>
                                  <span className="text-[10px] text-gray-600 font-bold truncate">
                                    {msg.attachment_path.split('_').slice(1).join('_') || 'Attached File'}
                                  </span>
                                </div>
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
                  
                  {/* Read Checkmarks for last user reply */}
                  {messages.length > 0 && messages[messages.length - 1].sender_role === 'user' && (
                    <div className="text-right text-[9px] font-bold text-gray-400 flex items-center justify-end space-x-1 pr-10">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      <span>Read</span>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-100 pt-3 space-y-2 relative">


                  {/* Textarea */}
                  <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50/30 flex flex-col justify-between min-h-[90px] relative focus-within:border-brandNavy/30 transition-all">
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent resize-none h-14"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
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

                    {/* Footer Row in Textarea box */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100/50 mt-1">
                      <div className="flex items-center space-x-1.5 relative">
                        {/* Attach button */}
                        <input
                          type="file"
                          id="message-file-upload"
                          className="hidden"
                          onChange={handleMessageFileChange}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('message-file-upload').click()}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-[10px] font-bold"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                          </svg>
                          <span>Attach File</span>
                        </button>

                        {/* Quick Replies */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setQuickRepliesOpen(!quickRepliesOpen)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-[10px] font-bold"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                            <span>Quick Replies</span>
                          </button>

                          {quickRepliesOpen && (
                            <div className="absolute left-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 animate-fade-in font-medium">
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

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={isMessageSubmitting}
                        className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-white text-[10px] font-bold shadow-md transition-all shrink-0 ${buttonColor}`}
                      >
                        <svg className="w-3 h-3 rotate-45 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-20 text-gray-400 text-xs font-bold">Select a ticket to begin chatting</div>
            )}
          </div>

          {/* Column 3: Contextual Details Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {activeMessageTicket ? (
              <>
                {/* Ticket Details Panel */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-left">
                  <h4 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider mb-3">Ticket Details</h4>
                  
                  <div className="space-y-2.5 text-[11px] font-bold text-gray-600 font-dmSans">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ticket ID</span>
                      <span className="text-brandDarkNavy">#{activeMessageTicket.ticket_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category</span>
                      <span className="text-brandDarkNavy">
                        {categories.find(c => c.category_id === activeMessageTicket.category_id)?.name || `Category #${activeMessageTicket.category_id}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Priority</span>
                      <span className="flex items-center space-x-1 text-brandDarkNavy">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          activeMessageTicket.priority === 'Urgent' || activeMessageTicket.priority === 'High'
                            ? 'bg-brandRed'
                            : 'bg-yellow-400'
                        }`} />
                        <span>{activeMessageTicket.priority}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-brandNavy/5 border border-brandNavy/10 text-brandNavy uppercase">{activeMessageTicket.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created On</span>
                      <span className="text-brandDarkNavy font-medium">{formatDate(activeMessageTicket.created_at).split(',')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Assigned To</span>
                      <span className="text-brandDarkNavy truncate max-w-[100px]">{activeMessageTicket.assigned_to || 'Retail Operations'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Resolution</span>
                      <span className="text-brandDarkNavy font-medium">Within 24 hours</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Progress Stepper */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm text-left">
                  <h4 className="text-xs font-extrabold text-brandDarkNavy font-sora uppercase tracking-wider mb-4">Ticket Progress</h4>
                  
                  <div className="relative pl-5 space-y-5">
                    {/* Stepper connector lines */}
                    <div className="absolute left-1.5 top-2.5 bottom-2.5 w-0.5 bg-gray-150" />
                    
                    {[
                      { label: 'Created', done: true, date: formatDate(activeMessageTicket.created_at) },
                      { label: 'Assigned', done: !!activeMessageTicket.assigned_to, date: activeMessageTicket.assigned_to ? '06 Jun 2026, 10:20 AM' : 'Pending' },
                      { label: 'Under Review', done: activeMessageTicket.status === 'Under Review' || activeMessageTicket.status === 'In Progress' || activeMessageTicket.status === 'Resolved', date: (activeMessageTicket.status === 'Under Review' || activeMessageTicket.status === 'In Progress') ? '06 Jun 2026, 10:30 AM' : 'Pending' },
                      { label: 'Resolved', done: activeMessageTicket.status === 'Resolved', date: activeMessageTicket.status === 'Resolved' ? 'Closed' : 'Pending' }
                    ].map((step, idx) => (
                      <div key={idx} className="relative flex flex-col justify-start">
                        {/* Step Marker Indicator */}
                        <div className={`absolute -left-5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center bg-white ${
                          step.done 
                            ? 'border-emerald-500 bg-emerald-500 text-white' 
                            : 'border-gray-300 bg-white'
                        }`} style={{ zIndex: 5 }}>
                          {step.done && (
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        
                        <span className="text-[11px] font-bold text-brandDarkNavy leading-none">{step.label}</span>
                        <span className="text-[9px] text-gray-400 mt-1 font-medium">{step.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════
     ANALYTICS TAB
  ══════════════════════════════════════════ */
  const renderAnalytics = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Operational Insights</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time metric graphs detailing service performance and ticket resolution SLAs.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'SLA Compliance', val: '98.4%', color: 'text-emerald-600', bar: 'bg-emerald-500', barW: '98.4%', sub: 'Target: 95.0% SLA Threshold' },
          { label: 'Resolution Speed', val: '4.2 Hours', color: isVendor ? 'text-brandRed' : 'text-brandNavy', bar: isVendor ? 'bg-brandRed' : 'bg-brandNavy', barW: '85%', sub: 'Average ticket close speed this month' },
          { label: 'Customer Satisfaction', val: '4.8 / 5.0', color: 'text-amber-500', bar: 'bg-amber-400', barW: '96%', sub: 'Feedback score from operations desk' }
        ].map(s => (
          <div key={s.label} className="stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-widest">{s.label}</span>
            <p className={`text-2xl font-extrabold font-sora mt-1 ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-2 font-semibold font-dmSans">{s.sub}</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className={`${s.bar} h-full rounded-full bar-animate`} style={{ width: s.barW }} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Query Resolutions by Category</h3>
          <p className="text-xs text-gray-500 mt-1 font-semibold">Monthly breakdown of successfully resolved tickets by category department.</p>
        </div>
        {[
          { label: 'Payment Issues & Disputes', pct: 94 },
          { label: 'Inventory & Store Audits', pct: 98 },
          { label: 'Technical Support & APIs', pct: 100, emerald: true }
        ].map(s => (
          <div key={s.label} className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>{s.label}</span><span className="font-extrabold">{s.pct}% Resolved</span>
            </div>
            <div className="w-full bg-gray-50 border border-gray-100/50 h-3 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bar-animate ${s.emerald ? 'bg-emerald-500' : (isVendor ? 'bg-brandRed' : 'bg-brandNavy')}`} style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     PROFILE TAB
  ══════════════════════════════════════════ */
  const renderProfile = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account credentials, partner details, and alert preferences.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-between text-center lg:col-span-1 min-h-[300px]">
          <div className="space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md mx-auto ${isVendor ? 'bg-gradient-to-br from-brandRed to-[#A50E23]' : 'bg-gradient-to-br from-brandNavy to-[#080E29]'}`}>
              {getInitials(userName)}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-brandDarkNavy font-sora">{userName}</h3>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{roleLabel}</span>
            </div>
            <div className="bg-gray-50 border border-gray-100/80 rounded-xl px-4 py-2 inline-block">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">User Account ID</span>
              <span className="text-xs font-bold text-brandDarkNavy font-sora">VND-2026-8947</span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:text-brandRed hover:bg-brandRed/5 hover:border-brandRed/10 transition-all duration-300 w-full">
            Sign Out Account
          </button>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Corporate Association Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
            {[
              { label: 'Registered Name', val: userName },
              { label: 'Registered Email', val: userEmail },
              { label: 'Department Division', val: 'Supply Chain Operations' },
              { label: 'Support Tier Level', val: 'Tier-1 Enterprise SLA' }
            ].map(({ label, val }) => (
              <div key={label}>
                <label className="block text-[10px] font-extrabold text-gray-400 font-sora tracking-widest uppercase mb-2">{label}</label>
                <input type="text" disabled value={val} className="w-full border border-gray-150 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 outline-none" />
              </div>
            ))}
          </div>
          <hr className="border-gray-100" />
          <div className="space-y-4 text-left">
            <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Notification Alert Rules</h3>
            {[
              { label: 'Email ticket progression digests', sub: 'Receive notification when ticket state updates.' },
              { label: 'SMS critical urgency escalations', sub: 'Text alert when a query is marked Urgent.' }
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-bold text-gray-700">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-semibold font-dmSans">{sub}</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 cursor-pointer flex items-center justify-end ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`}>
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard': return renderDashboard();
      case 'My Queries':
      case 'Track Status': return renderMyQueries();
      case 'Messages': return renderMessages();
      case 'Analytics': return renderAnalytics();
      case 'Profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  /* ══════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F6F7FB] font-dmSans flex flex-col relative">

      {/* ── TOP NAVBAR ── */}
      <header className="h-20 glass-navbar border-b border-gray-100/80 flex items-center justify-between px-8 shrink-0 z-30 sticky top-0 shadow-[0_1px_12px_rgba(0,0,0,.04)]">
        <div className="flex items-center space-x-4">
          <img src={relianceLogo} alt="Reliance Retail Logo" className="h-10 w-auto object-contain" />
          <span className="text-[10px] text-brandMuted uppercase ml-2 hidden lg:inline-block border-l pl-3 border-gray-200 tracking-widest font-extrabold font-sora">QMS Portal</span>
        </div>

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
              if (activeTab !== 'My Queries' && activeTab !== 'Track Status' && activeTab !== 'Dashboard') switchTab('My Queries');
            }}
            className="w-full pl-11 pr-16 py-3 bg-white/60 backdrop-blur border border-gray-200/70 rounded-2xl outline-none focus:border-brandNavy/50 focus:bg-white/90 text-xs font-bold text-gray-700 transition-all font-dmSans placeholder-gray-400/80 shadow-[inset_0_1px_3px_rgba(0,0,0,.03)]"
          />
          <div className="absolute right-0 inset-y-0 pr-4 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-extrabold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-sm font-sora">⌘ F</kbd>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => switchTab('Messages')}
            className={`p-2.5 rounded-xl border border-gray-150/60 hover:bg-gray-50 text-gray-500 transition-all relative ${activeTab === 'Messages' ? 'bg-gray-50 text-brandNavy border-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white notif-pulse ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
          </button>

          <button
            onClick={() => switchTab('Dashboard')}
            className="p-2.5 rounded-xl border border-gray-150/60 hover:bg-gray-50 text-gray-500 transition-all relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {tickets.filter(t => t.priority === 'Urgent' || t.status === 'Open').length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold text-white ring-2 ring-white ${notifPopped ? 'badge-pop' : ''} ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`}>
                {tickets.filter(t => t.priority === 'Urgent' || t.status === 'Open').length}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-3 pl-3 border-l border-gray-100">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-extrabold text-brandDarkNavy font-sora">{userName}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{userEmail}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white border shadow-sm font-sora ${isVendor ? 'bg-gradient-to-br from-brandRed to-[#A50E23] border-brandRed/20' : 'bg-gradient-to-br from-brandNavy to-[#080E29] border-brandNavy/20'}`}>
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>

      {/* ── CORE WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-[240px] bg-white border-r border-gray-100/80 shrink-0 hidden md:flex flex-col justify-between p-5 z-20 font-dmSans text-left">
          <div className="space-y-6">
            {/* MENU SECTION */}
            <div className="space-y-1">
              <div className="px-3 mb-2">
                <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase block">Menu</span>
              </div>
              {[
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
                { name: 'Track Status', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                )},
                { name: 'Messages', icon: (
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
                )},
                { name: 'Profile', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                )}
              ].map((item) => {
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => switchTab(item.name)}
                    className={`sidebar-item w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold relative overflow-hidden ${isActive
                        ? `${activeSidebarBg} ${activeSidebarGlow}`
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50/80'
                      }`}
                  >
                    {isActive && (
                      <div className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full ${activeSidebarLine}`} />
                    )}
                    <span className={`flex items-center justify-center w-7 h-7 rounded-xl transition-all duration-200 icon-scale ${isActive
                        ? (isVendor ? 'bg-brandRed/10 text-brandRed' : 'bg-brandNavy/10 text-brandNavy')
                        : 'text-gray-400'
                      }`}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* NEED HELP SECTION */}
            <div className="space-y-1">
              <div className="px-3 mb-2">
                <span className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase block">Need Help?</span>
              </div>
              {[
                { label: 'User Guide', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                )},
                { label: 'Chat Support', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                )},
                { label: 'Contact Support', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.806-5.194-4.176-7-7l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                )}
              ].map((hlp, idx) => (
                <button
                  key={idx}
                  onClick={() => alert(`${hlp.label} will be active in release version.`)}
                  className="w-full flex items-center space-x-3 px-3.5 py-2 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 transition-all text-left"
                >
                  <span className="text-gray-400">{hlp.icon}</span>
                  <span>{hlp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SIGN OUT AT BOTTOM */}
          <button
            onClick={handleLogout}
            className="sidebar-item w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:text-brandRed hover:bg-brandRed/5 border border-transparent hover:border-brandRed/10 transition-all text-left mt-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span>Sign Out Account</span>
          </button>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F6F7FB]">
          <div key={transitionKey} className="max-w-6xl mx-auto page-enter">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* ── RAISE NEW QUERY MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-brandNavy/30 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className={`relative bg-white w-full ${isCategoryLocked ? 'max-w-xl' : 'max-w-md'} rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 animate-scale-in transition-all duration-300`}>
            <div className={`h-2 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
            
            {isSubmittedSuccessfully ? (
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[350px] animate-fade-in font-dmSans">
                <div className="checkmark-wrapper">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-brandDarkNavy font-sora mt-4">
                  Query Submitted Successfully!
                </h3>
                <p className="text-xs text-gray-500 mt-2 font-semibold max-w-xs leading-relaxed">
                  Your ticket has been raised. Support coordinators will update you shortly.
                </p>
                <button
                  onClick={handleCloseModal}
                  className={`mt-6 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${buttonColor}`}
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-brandDarkNavy font-sora">Raise New Query</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Submit a ticket to operations</p>
                  </div>
                  <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Subject / Title</label>
                    <input type="text" required placeholder={getCategoryPlaceholders(formCategory).subject}
                      value={formSubject} onChange={e => setFormSubject(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20 transition-all text-sm bg-gray-50/50" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">
                        Category
                      </label>
                      <select value={formCategory} onChange={e => setFormCategory(e.target.value)} disabled={isCategoryLocked}
                        className={`w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none transition-all text-xs bg-gray-50/50 cursor-pointer font-medium text-gray-700 ${isCategoryLocked ? 'bg-gray-150/70 border-gray-200/50 text-gray-400 cursor-not-allowed' : 'focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20'}`}>
                        {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Priority</label>
                      <select value={formPriority} onChange={e => setFormPriority(e.target.value)}
                        className="w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20 transition-all text-xs bg-gray-50/50 cursor-pointer font-medium text-gray-700">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Description</label>
                    <textarea required rows={isCategoryLocked ? 4 : 2} placeholder={getCategoryPlaceholders(formCategory).description}
                      value={formDescription} onChange={e => setFormDescription(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2.5 rounded-lg outline-none focus:border-brandNavy focus:ring-1 focus:ring-brandNavy/20 transition-all text-sm bg-gray-50/50 resize-none font-medium text-gray-700" />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-brandDarkNavy font-sora tracking-wider uppercase mb-1.5">Attachment</label>
                    <div
                      onDragOver={handleDragOver} onDrop={handleDrop}
                      onClick={() => document.getElementById('dashboard-file-upload').click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50/50 hover:border-brandNavy/30 transition-all flex flex-col items-center justify-center min-h-[90px]"
                    >
                      <input id="dashboard-file-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx" onChange={handleFileChange} />
                      {!attachment ? (
                        <>
                          <div className="w-9 h-9 rounded-lg bg-brandNavy/10 text-brandNavy flex items-center justify-center mb-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-brandDarkNavy font-sora">Click to upload or drag</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">PDF, JPG, PNG, XLSX (25MB max)</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-7 h-7 text-brandRed mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <p className="text-xs font-bold text-brandDarkNavy truncate max-w-[160px] font-sora">{attachment.name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">{(attachment.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <button type="button" onClick={e => { e.stopPropagation(); setAttachment(null); }}
                            className="mt-1.5 text-[9px] font-extrabold text-brandRed hover:underline uppercase tracking-wider">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    {attachmentError && <p className="text-xs text-brandRed font-bold mt-1">{attachmentError}</p>}
                  </div>

                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button type="button" onClick={handleCloseModal}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting || !formSubject || !formDescription}
                      className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition-all duration-300 flex items-center gap-1.5 ${buttonColor} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {isSubmitting ? (
                        <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /><span>Submitting...</span></>
                      ) : (
                        <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg><span>Submit</span></>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TICKET DETAILS MODAL ── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brandNavy/35 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="absolute inset-0 bg-brandNavy/10 backdrop-blur-[1px]" onClick={() => setSelectedTicket(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100/90 overflow-hidden z-10 animate-scale-in flex flex-col font-dmSans">
            <div className={`h-2 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
            
            <button onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <div>
                <span className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora block mb-0.5">
                  Ticket Details
                </span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg md:text-xl font-black text-brandDarkNavy font-sora tracking-tight leading-tight pr-6">
                    {selectedTicket.title}
                  </h2>
                  <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-200/60 px-1.5 py-0.5 rounded font-sora select-none">
                    #{selectedTicket.ticket_id}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-4 bg-gray-50/30">
              {/* Category */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-3 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-brandNavy/5 text-brandNavy flex items-center justify-center flex-shrink-0 border border-brandNavy/10">
                  {getCategoryIcon(selectedTicket.category_id)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora">Category</p>
                  <p className="text-xs font-bold text-brandDarkNavy mt-0.5 break-words" title={categories.find(c => c.category_id === selectedTicket.category_id)?.name}>
                    {categories.find(c => c.category_id === selectedTicket.category_id)?.name || `Category #${selectedTicket.category_id}`}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-3 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 border ${
                  selectedTicket.status === 'Resolved' ? 'text-emerald-600 bg-emerald-50/50 border-emerald-100' :
                  selectedTicket.status === 'In Progress' ? 'text-amber-500 bg-amber-50/50 border-amber-100' :
                  selectedTicket.status === 'Open' ? 'text-brandNavy bg-blue-50/50 border-blue-100' : 'text-brandRed bg-rose-50/50 border-rose-100'
                }`}>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora">Status</p>
                  <span className={`inline-block text-[10px] font-extrabold mt-0.5 px-2 py-0.5 rounded border ${
                    selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                    selectedTicket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                    selectedTicket.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                    'bg-rose-50 text-rose-700 border-rose-200/50'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-3 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 border ${
                  selectedTicket.priority === 'Urgent' ? 'text-brandRed bg-rose-50/50 border-rose-100 animate-pulse' :
                  selectedTicket.priority === 'High' ? 'text-orange-500 bg-orange-50/50 border-orange-100' :
                  selectedTicket.priority === 'Medium' ? 'text-amber-500 bg-amber-50/50 border-amber-100' :
                  'text-gray-500 bg-gray-50/50 border-gray-150'
                }`}>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a1.5 1.5 0 0 0 1.154-1.464V6.105a1.5 1.5 0 0 0-1.654-1.49l-2.908.685a9 9 0 0 1-6.2 0l-.108-.054a9 9 0 0 0-6.2 0L3 5.75m0 9.25V5.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora">Priority</p>
                  <span className={`inline-block text-[10px] font-extrabold mt-0.5 px-2 py-0.5 rounded border ${
                    selectedTicket.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200/50' :
                    selectedTicket.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200/50' :
                    selectedTicket.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                    'bg-gray-50 text-gray-700 border-gray-200/50'
                  }`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              {/* Submitted Date */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-3 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0 border border-gray-100">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora">Submitted</p>
                  <p className="text-xs font-bold text-brandDarkNavy mt-0.5 break-words" title={selectedTicket.created_at}>
                    {formatTicketDate(selectedTicket.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-4" />

            <div className="p-4 flex-1 flex flex-col space-y-4">
              {/* Description Block */}
              <div>
                <h4 className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora mb-2">Description</h4>
                <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-medium break-words">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Attachment File Card */}
              {selectedTicket.attachment_path && (
                <div className="pt-1">
                  <h4 className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora mb-2">Attachments</h4>
                  <div className="border border-gray-200/85 hover:border-gray-300 rounded-xl p-3 flex items-center justify-between bg-white gap-3 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brandNavy/5 text-brandNavy flex items-center justify-center flex-shrink-0 border border-brandNavy/10">
                        <svg className="w-4.5 h-4.5 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase text-gray-400 font-extrabold tracking-wider font-sora">Attachment File</p>
                        <p className="text-xs font-bold text-brandDarkNavy truncate max-w-[180px] sm:max-w-[240px] mt-0.5" title={selectedTicket.attachment_path.split('_').slice(1).join('_') || selectedTicket.attachment_path}>
                          {selectedTicket.attachment_path.split('_').slice(1).join('_') || selectedTicket.attachment_path}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => downloadAttachment(selectedTicket.attachment_path)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brandNavy bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 shrink-0 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close Actions */}
            <div className="p-4 flex justify-end gap-3 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
