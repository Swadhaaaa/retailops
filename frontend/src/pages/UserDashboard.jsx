import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { RoleContext } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';
import api from '../utils/api';
import relianceLogo from '../assets/reliance_logo.png';
import DefaultCategoryIcon from '../components/DefaultCategoryIcon';
import RaiseTicketModal from '../components/RaiseTicketModal';

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
  { category_id: 1, name: 'Payment Issue', description: 'Invoice and payment related issues' },
  { category_id: 2, name: 'Inventory Issues', description: 'Stock and inventory problems' },
  { category_id: 3, name: 'Portal Access', description: 'System and technical support' },
  { category_id: 4, name: 'Delivery Issues', description: 'Shipment and delivery concerns' },
  { category_id: 5, name: 'Contract Query', description: 'Document and compliance issues' },
  { category_id: 6, name: 'Order Discrepancies', description: 'Mismatched order quantities or items' },
  { category_id: 7, name: 'User Onboarding', description: 'Registration and profile setup queries' },
  { category_id: 8, name: 'Quality Control', description: 'Product quality and damage complaints' },
  { category_id: 9, name: 'Pricing & Billing', description: 'Pricing disputes and billing inquiries' },
  { category_id: 10, name: 'Service Delays', description: 'Service delays and performance escalations' },
  { category_id: 11, name: 'Logistics Support', description: 'Transport, routing, and carrier issues' },
  { category_id: 12, name: 'Database & Sync', description: 'Data mismatch and sync issues' },
  { category_id: 13, name: 'Account & Security', description: 'Security settings and account recovery' },
  { category_id: 14, name: 'Refunds & Returns', description: 'Product return requests and refunds' },
  { category_id: 15, name: 'GST Compliance', description: 'Regulatory, policy, and audit support' },
  { category_id: 16, name: 'KYC Verification', description: 'User onboarding, agreements, and disputes' },
  { category_id: 17, name: 'Store Operations', description: 'In-store operational queries and escalations' },
  { category_id: 18, name: 'HR & Workforce', description: 'Staff queries, attendance, and HR support' },
  { category_id: 19, name: 'IT Infrastructure', description: 'Network, hardware, and system outages' },
  { category_id: 20, name: 'Finance & Reporting', description: 'Financial reports, budgets, and reconciliation' }
];

// Enable the message-thread experience for the new backend comment storage.
const MESSAGES_FEATURE_ENABLED = true;

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
        description: 'e.g. We need the latest GST certificate from our user profiles to verify tax benefits.'
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
        subject: 'e.g. User agreement renewal query',
        description: 'e.g. The annual contract with user ABC is expiring next month. Need renewal terms.'
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
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [transitionKey, setTransitionKey] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState(staticCategories);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryLocked, setIsCategoryLocked] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketView, setSelectedTicketView] = useState('simple');
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editTicketForm, setEditTicketForm] = useState({ title: '', description: '', category_id: '1' });
  const [editTicketAttachment, setEditTicketAttachment] = useState(null);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationAttachment, setClarificationAttachment] = useState(null);
  const [ticketActionLoading, setTicketActionLoading] = useState('');
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isChatSupportOpen, setIsChatSupportOpen] = useState(false);

  useEffect(() => {
    if (!selectedTicket || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedTicket]);

  // TEMPORARILY DISABLED - MESSAGES FEATURE
  // Messages-specific state is preserved for easy restoration, but all UI/API entry points are guarded by MESSAGES_FEATURE_ENABLED.
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

  const openTicketDetails = (ticket, view = 'simple') => {
    setSelectedTicketView(view);
    setSelectedTicket(ticket);
    setIsEditingTicket(false);
    setEditTicketForm({
      title: ticket.title || '',
      description: ticket.description || '',
      category_id: String(ticket.category_id || categories[0]?.category_id || '1')
    });
    setEditTicketAttachment(null);
    setClarificationText('');
    setClarificationAttachment(null);
    api.get(`/tickets/${ticket.ticket_id}`)
      .then((response) => setSelectedTicket(normalizeTicketDetail(response.data)))
      .catch((err) => console.error('Unable to load full ticket details:', err));
  };

  const closeTicketDetails = () => {
    setSelectedTicket(null);
    setSelectedTicketView('simple');
    setIsEditingTicket(false);
    setEditTicketAttachment(null);
    setClarificationText('');
    setClarificationAttachment(null);
    setTicketActionLoading('');
  };

  const getLatestClarificationRequest = (ticket) => {
    const request = [...(ticket?.activity || [])]
      .reverse()
      .find((item) => item.action_type === 'clarification_requested');
    return request?.action_text?.replace(/^Clarification requested:\s*/i, '') || '';
  };

  const fetchAnnouncementsAndStats = async () => {
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    if (!MESSAGES_FEATURE_ENABLED) return;
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
    if (!MESSAGES_FEATURE_ENABLED) return;
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      const normalized = normalizeTicketDetail(res.data);
      setMessages(normalized.messages || []);
      setActiveMessageTicket(normalized);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Poll for messages and announcements
  useEffect(() => {
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    if (!MESSAGES_FEATURE_ENABLED) return;
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
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    if (!MESSAGES_FEATURE_ENABLED) return;
    if (tickets.length > 0 && !activeMessageTicket) {
      setActiveMessageTicket(tickets[0]);
    }
  }, [tickets, activeMessageTicket]);

  const handleSendMessage = async (e) => {
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    if (!MESSAGES_FEATURE_ENABLED) return;
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

      const refreshEvent = String(Date.now());
      localStorage.setItem('tickets:lastChanged', refreshEvent);
      window.dispatchEvent(new CustomEvent('tickets:changed', { detail: refreshEvent }));

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
  const [formDescription, setFormDescription] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attachment, setAttachment] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const [liveTime, setLiveTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const exportTicketsCSV = () => {
    if (tickets.length === 0) { alert('No tickets to export.'); return; }
    const headers = ['Ticket ID', 'Title', 'Description', 'Category ID', 'Status', 'Created At'];
    const rows = tickets.map(t => [
      t.ticket_id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category_id, t.status, t.created_at || 'Today'
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

  const fetchDashboardData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const ticketsRes = await api.get('/tickets/');
      setTickets(ticketsRes.data);
      const categoriesRes = await api.get('/categories/');
      if (categoriesRes.data?.length) {
        const normalizedCategories = categoriesRes.data.map(category => ({
          ...category,
          category_id: Number(category.category_id)
        }));
        setCategories(normalizedCategories);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const refreshTickets = () => fetchDashboardData({ silent: true });
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

  const switchTab = (tab) => {
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    if (!MESSAGES_FEATURE_ENABLED && tab === 'Messages') return;
    setActiveTab(tab);
    setTransitionKey(k => k + 1);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleCategoryClick = (categoryId) => {
    setFormCategory(categoryId.toString());
    setIsCategoryLocked(true);
    setAiSuggestion('');
    setAiLoading(false);
    setIsModalOpen(true);
  };

  const openChatSupport = () => {
    setIsChatSupportOpen(true);
  };

  const openMessagesFromSupport = () => {
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    if (!MESSAGES_FEATURE_ENABLED) return;
    setIsChatSupportOpen(false);
    switchTab('Messages');
    if (!activeMessageTicket && tickets.length > 0) {
      setActiveMessageTicket(tickets[0]);
      fetchActiveTicketMessages(tickets[0].ticket_id);
    }
  };

  const viewTicketsFromSupport = () => {
    setIsChatSupportOpen(false);
    switchTab('My Queries');
  };

  const raiseTicketFromSupport = () => {
    setIsChatSupportOpen(false);
    openContactSupport();
  };

  const openContactSupport = () => {
    setIsCategoryLocked(false);
    setFormCategory(categories[0]?.category_id?.toString() || '1');
    setFormSubject('Contact support request');
    setFormDescription('');
    setAttachment(null);
    setAttachmentError('');
    setAiSuggestion('');
    setAiLoading(false);
    setIsSubmittedSuccessfully(false);
    setSubmittedTicket(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCategoryLocked(false);
    setFormSubject('');
    setFormDescription('');
    setAiSuggestion('');
    setAiLoading(false);
    setAttachment(null);
    setAttachmentError('');
    setFormCategory(categories[0]?.category_id?.toString() || '1');
    setIsSubmittedSuccessfully(false);
    setSubmittedTicket(null);
  };

  const getMatchedAISuggestionCategoryId = () => {
    if (isCategoryLocked || !aiSuggestion) return null;

    const matchedCategory = categories.find(
      category => category.name.toLowerCase() === aiSuggestion.toLowerCase()
    );

    return matchedCategory ? matchedCategory.category_id.toString() : null;
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!formSubject || !formDescription || !formCategory) return;
    setIsSubmitting(true);
    try {
      const finalCategoryId = getMatchedAISuggestionCategoryId() || formCategory;

      const formData = new FormData();
      formData.append('title', formSubject);
      formData.append('description', formDescription);
      formData.append('category_id', finalCategoryId);
      if (attachment) formData.append('attachment', attachment);

      const response = await api.post('/tickets/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmittedTicket(response.data);

      const refreshEvent = String(Date.now());
      localStorage.setItem('tickets:lastChanged', refreshEvent);
      window.dispatchEvent(new CustomEvent('tickets:changed', { detail: refreshEvent }));

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

  const refreshSelectedTicket = async (ticketId = selectedTicket?.ticket_id) => {
    if (!ticketId) return;
    const response = await api.get(`/tickets/${ticketId}`);
    setSelectedTicket(response.data);
  };

  const handleEditTicketSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !editTicketForm.title.trim() || !editTicketForm.description.trim()) return;

    setTicketActionLoading('edit');
    try {
      const formData = new FormData();
      formData.append('title', editTicketForm.title.trim());
      formData.append('description', editTicketForm.description.trim());
      formData.append('category_id', editTicketForm.category_id);
      if (editTicketAttachment) formData.append('attachment', editTicketAttachment);

      await api.put(`/tickets/${selectedTicket.ticket_id}/user-edit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchDashboardData({ silent: true });
      await refreshSelectedTicket(selectedTicket.ticket_id);
      setIsEditingTicket(false);
      setEditTicketAttachment(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to update ticket.');
    } finally {
      setTicketActionLoading('');
    }
  };

  const handleWithdrawTicket = async () => {
    if (!selectedTicket) return;
    const confirmed = window.confirm('Withdraw this ticket? This is allowed only before work starts.');
    if (!confirmed) return;

    setTicketActionLoading('withdraw');
    try {
      await api.post(`/tickets/${selectedTicket.ticket_id}/withdraw`, {});
      await fetchDashboardData({ silent: true });
      await refreshSelectedTicket(selectedTicket.ticket_id);
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to withdraw ticket.');
    } finally {
      setTicketActionLoading('');
    }
  };

  const handleClarificationSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !clarificationText.trim()) return;

    setTicketActionLoading('clarification');
    try {
      const formData = new FormData();
      formData.append('clarification', clarificationText.trim());
      if (clarificationAttachment) formData.append('attachment', clarificationAttachment);

      await api.post(`/tickets/${selectedTicket.ticket_id}/clarification`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchDashboardData({ silent: true });
      await refreshSelectedTicket(selectedTicket.ticket_id);
      setClarificationText('');
      setClarificationAttachment(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to submit clarification.');
    } finally {
      setTicketActionLoading('');
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

  const getAISuggestion = async (description) => {
    if (description.length < 15) {
      setAiSuggestion('');
      setAiLoading(false);
      return;
    }

    try {
      setAiLoading(true);

      const res = await api.post('/tickets/nlp/suggest', {
        description
      });

      const suggestedCategory = res.data.category || res.data.suggestion?.category_name || '';
      setAiSuggestion(suggestedCategory);
    } catch (err) {
      console.error('AI category suggestion failed:', err);
      setAiSuggestion('');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAISuggestion = () => {
    const matchedCategoryId = getMatchedAISuggestionCategoryId();

    if (matchedCategoryId) {
      setFormCategory(matchedCategoryId);
    }
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
    // TEMPORARILY DISABLED - MESSAGES FEATURE
    ...(MESSAGES_FEATURE_ENABLED ? [{
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
    }] : []),
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
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-brandRed/10 text-brandRed border-brandRed/20';
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
    const clarificationCount = tickets.filter(t => t.status === 'Needs Clarification').length;

    return (
      <div className="space-y-6 text-left">

        {/* ── Welcome Banner ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-brandDarkNavy font-sora">
                Good Morning, {userName}!
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-semibold font-dmSans">
              Raise a query, track existing requests, or check recent updates.
              <span className="ml-2 text-gray-400">· 3 tickets updated today</span>
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        {clarificationCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('Needs Clarification');
              switchTab('My Queries');
            }}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-brandRed/25 bg-red-50/70 px-4 py-2.5 text-left shadow-sm transition hover:border-brandRed/40 hover:bg-red-50"
          >
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-brandRed">Clarification Needed</p>
              <p className="mt-0.5 text-xs font-bold text-brandDarkNavy">
                {clarificationCount} {clarificationCount === 1 ? 'query needs' : 'queries need'} your clarification.
              </p>
            </div>
            <span className="rounded-lg bg-brandRed px-3 py-1.5 text-[10px] font-extrabold text-white">View</span>
          </button>
        )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              label: 'Raise a Query', desc: 'Select a category and raise a new query',
              bg: 'bg-brandRed', shadow: 'shadow-brandRed/20', glowHover: 'hover:shadow-[0_14px_28px_rgba(227,24,55,.18)]',
              border: 'border-brandRed/30',
              borderHover: 'hover:border-brandRed/50',
              onClick: () => { setIsCategoryLocked(false); setIsModalOpen(true); },
              icon: <span className="text-xl font-bold text-white icon-scale">+</span>
            },
            {
              label: 'View My Queries', desc: 'Track and view all your queries',
              bg: 'bg-brandNavy', shadow: 'shadow-brandNavy/20', glowHover: 'hover:shadow-[0_14px_28px_rgba(15,27,76,.18)]',
              border: 'border-brandNavy/30',
              borderHover: 'hover:border-brandNavy/50',
              onClick: () => switchTab('My Queries'),
              icon: (
                <svg className="w-5 h-5 text-white icon-scale" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
                </svg>
              )
            },
            // TEMPORARILY DISABLED - MESSAGES FEATURE
            ...(MESSAGES_FEATURE_ENABLED ? [{
              label: 'Messages', desc: 'Check replies and notifications',
              bg: 'bg-brandGold', shadow: 'shadow-brandGold/20', glowHover: 'hover:shadow-[0_14px_28px_rgba(245,166,35,.18)]',
              border: 'border-brandGold/30',
              borderHover: 'hover:border-brandGold/50',
              onClick: () => switchTab('Messages'),
              icon: (
                <svg className="w-5 h-5 text-white icon-scale" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              )
            }] : [])
          ].map((card) => (
            <div
              key={card.label}
              onClick={card.onClick}
              className={`action-card bg-white border ${card.border} rounded-3xl p-5 cursor-pointer flex items-center space-x-4 ${card.glowHover} ${card.borderHover}`}
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
                      <h4 className="text-[20px] font-extrabold font-sora text-brandDarkNavy tracking-tight leading-snug">{cat.name}</h4>
                      <span className="cat-arrow text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 font-semibold leading-relaxed line-clamp-2">{cat.description}</p>
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
      return matchesSearch && matchesStatus;
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none">
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Needs Clarification">Needs Clarification</option>
            <option value="Resolved">Resolved</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center">
            <p className="text-gray-500 font-bold">No matching tickets found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((query, index) => {
              const catObj = categories.find(c => c.category_id === query.category_id);
              const categoryName = catObj ? catObj.name : `Category #${query.category_id}`;
              const createdDate = formatTicketDate(query.created_at || query.updated_at).split(',')[0];
              const outlineStyle = index % 2 === 0
                ? 'border-brandNavy/25 hover:border-brandNavy/45'
                : 'border-brandRed/25 hover:border-brandRed/45';

              return (
                <button
                  key={query.ticket_id}
                  type="button"
                  onClick={() => openTicketDetails(query, 'simple')}
                  className={`group grid w-full grid-cols-1 gap-4 rounded-2xl border bg-white px-6 py-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-50/35 hover:shadow-md lg:grid-cols-[190px_minmax(0,1fr)_170px_110px] lg:items-center ${outlineStyle}`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Ticket ID</p>
                    <p className="mt-1 truncate text-base font-extrabold text-brandDarkNavy">#{query.ticket_id}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-brandDarkNavy">
                      {query.title}
                      <span className="font-semibold text-gray-500"> - {query.description || 'No description'}</span>
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-gray-400">{categoryName}</p>
                  </div>

                  <div className="flex items-center lg:justify-center">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border ${getStatusBadgeStyles(query.status)}`}>
                      {query.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold lg:hidden">Created</p>
                    <p className="whitespace-nowrap text-xs font-bold text-brandDarkNavy">{createdDate}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getTicketProgress = (ticket) => {
    let currentStep = 1;
    let progressPercent = 12;

    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      currentStep = 5;
      progressPercent = 100;
    } else if (ticket.status === 'Under Review') {
      currentStep = 4;
      progressPercent = 78;
    } else if (ticket.status === 'Needs Clarification') {
      currentStep = 3;
      progressPercent = 62;
    } else if (ticket.status === 'In Progress') {
      currentStep = 3;
      progressPercent = 55;
    } else if (ticket.assigned_to) {
      currentStep = 2;
      progressPercent = 35;
    } else {
      currentStep = 1;
      progressPercent = 12;
    }

    return { currentStep, progressPercent };
  };

  const getFallbackJourneyTime = (dateStr, minutesToAdd) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    date.setMinutes(date.getMinutes() + minutesToAdd);
    return date.toISOString();
  };

  const formatJourneyTimestamp = (dateStr) => {
    if (!dateStr) return 'Pending';
    return formatTicketDate(dateStr);
  };

  const getTicketJourneyStep = (ticket) => {
    if (!ticket) return 0;
    const status = ticket.status || 'Open';
    if (status === 'Resolved' || status === 'Closed') return 4;
    if (status === 'Under Review' || status === 'Needs Clarification') return 3;
    if (status === 'In Progress') return 2;
    if (ticket.assigned_to && ticket.assigned_to !== 'Unassigned') return 1;
    return 0;
  };

  const getTicketJourneyStages = (ticket) => {
    if (!ticket) return [];
    const categoryName = categories.find(c => c.category_id === ticket.category_id)?.name || `Category #${ticket.category_id}`;
    const assignedTeam = ticket.assigned_department || ticket.business_unit || getDepartmentForCategory(categoryName);
    const journeyStep = getTicketJourneyStep(ticket);

    return [
      {
        title: 'Ticket Created',
        timestamp: ticket.created_at,
        owner: userName || ticket.raised_by || 'User',
        action: 'Your query was submitted to Reliance Retail QMS.'
      },
      {
        title: 'Assigned to Team',
        timestamp: journeyStep >= 1 ? ticket.assigned_at || getFallbackJourneyTime(ticket.created_at, 20) : null,
        owner: assignedTeam,
        action: `${assignedTeam} is responsible for this query.`
      },
      {
        title: 'Investigation Started',
        timestamp: journeyStep >= 2 ? ticket.investigation_started_at || getFallbackJourneyTime(ticket.created_at, 120) : null,
        owner: assignedTeam,
        action: 'Support is checking the details and validating next steps.'
      },
      {
        title: 'Under Review',
        timestamp: journeyStep >= 3 ? ticket.review_started_at || getFallbackJourneyTime(ticket.created_at, 360) : null,
        owner: 'Reliance Review Desk',
        action: 'The response is being reviewed before closure.'
      },
      {
        title: 'Resolved',
        timestamp: journeyStep >= 4 ? ticket.resolved_at || getFallbackJourneyTime(ticket.created_at, 1440) : null,
        owner: assignedTeam,
        action: 'Resolution is completed and available for your confirmation.'
      }
    ];
  };

  const renderAdvancedTicketJourneyMap = (ticket) => {
    const journeyStep = getTicketJourneyStep(ticket);
    const journeyStages = getTicketJourneyStages(ticket);

    return (
      <div className="rounded-2xl border border-brandNavy/10 bg-white p-3.5 shadow-[0_12px_32px_rgba(15,27,76,0.07)]">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brandNavy/10 text-brandNavy text-[10px] font-extrabold">J</span>
          <h4 className="text-[13px] font-extrabold text-brandDarkNavy font-sora leading-none">Advanced Ticket Journey Map</h4>
          <span className="rounded-full bg-brandRed/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-brandRed leading-none">Status tracking</span>
        </div>

        <div className="relative">
          <div className="absolute left-[14px] top-6 bottom-6 w-px bg-gradient-to-b from-brandNavy/35 via-brandRed/25 to-gray-200" />
          <div className="space-y-1.5">
            {journeyStages.map((stage, index) => {
              const isCurrent = index === journeyStep;
              const isCompleted = index < journeyStep;
              const isFuture = index > journeyStep;
              const iconClass = isCurrent
                ? 'bg-brandRed text-white ring-brandRed/15 shadow-lg shadow-brandRed/20'
                : isCompleted
                  ? 'bg-brandNavy text-white ring-brandNavy/10 shadow-md shadow-brandNavy/15'
                  : 'bg-gray-100 text-gray-400 ring-gray-100';
              const cardClass = isCurrent
                ? 'border-brandRed/25 bg-gradient-to-br from-brandRed/[0.08] via-white to-brandNavy/[0.04] shadow-md shadow-brandRed/8'
                : isCompleted
                  ? 'border-brandNavy/12 bg-white shadow-sm'
                  : 'border-gray-100 bg-gray-50/80 opacity-70';

              return (
                <div key={stage.title} className="relative flex gap-3">
                  <div className={`z-10 mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ring-[3px] ${iconClass}`}>
                    {isCompleted ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : isCurrent ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
                      </svg>
                    )}
                  </div>

                  <div className={`flex-1 rounded-xl border px-3.5 py-2 transition-all ${cardClass}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className={`text-[13px] font-extrabold font-sora leading-tight ${isFuture ? 'text-gray-400' : 'text-brandDarkNavy'}`}>{stage.title}</h5>
                          {isCurrent && <span className="rounded-full bg-brandRed px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white leading-none">Current</span>}
                          {isCompleted && <span className="rounded-full bg-brandNavy/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-brandNavy leading-none">Completed</span>}
                        </div>
                        <p className={`mt-1 text-[11px] font-semibold leading-snug ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>{stage.action}</p>
                      </div>
                      <p className={`shrink-0 text-right text-[10px] font-extrabold leading-tight ${isFuture ? 'text-gray-400' : 'text-brandNavy'}`}>{formatJourneyTimestamp(stage.timestamp)}</p>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[10px] font-bold leading-tight">
                      <div className="min-w-0 flex items-center">
                        <span className="mr-1.5 uppercase tracking-wider text-gray-400">Responsible</span>
                        <span className={isFuture ? 'text-gray-400' : 'text-gray-700'}>{stage.owner}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1.5 uppercase tracking-wider text-gray-400">Stage Status</span>
                        <span className={isCurrent ? 'text-brandRed' : isCompleted ? 'text-brandNavy' : 'text-gray-400'}>
                          {isCurrent ? 'In focus' : isCompleted ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getProgressBarStyles = (status) => {
    if (status === 'Resolved' || status === 'Closed') {
      return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
    }

    if (status === 'In Progress' || status === 'Under Review') {
      return 'bg-gradient-to-r from-amber-400 to-amber-600';
    }

    return 'bg-gradient-to-r from-brandRed to-red-600';
  };

  const getDepartmentForCategory = (categoryName) => {
    if (!categoryName) return 'Operations';
    const name = categoryName.toLowerCase();
    if (name.includes('payment') || name.includes('billing') || name.includes('finance')) return 'Finance';
    if (name.includes('inventory') || name.includes('quality')) return 'Inventory';
    if (name.includes('technical') || name.includes('sync') || name.includes('infrastructure')) return 'IT Operations';
    if (name.includes('delivery') || name.includes('logistics')) return 'Logistics';
    if (name.includes('compliance') || name.includes('audit') || name.includes('documentation')) return 'Compliance';
    if (name.includes('vendor')) return 'User Management';
    if (name.includes('order')) return 'Order Management';
    return 'Retail Operations';
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Updated 2 hours ago';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Updated 2 hours ago';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Updated just now';
    if (diffMins < 60) return `Updated ${diffMins}m ago`;
    if (diffHours < 24) return `Updated ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `Updated ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  const getTrackStatusBadgeStyles = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Withdrawn':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-brandRed/10 text-brandRed border-brandRed/20';
    }
  };

  const renderTrackStatus = () => {
    const filteredTickets = tickets.filter(ticket => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticket_id.toString().includes(searchQuery) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-8 text-left">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up-fade">
          <div>
            <h1 className="text-3xl font-extrabold text-brandDarkNavy font-sora animate-scale-in">Track Status</h1>
            <p className="text-sm text-gray-500 mt-1">Live tracking and progress timeline for all your query tickets.</p>
          </div>
        </div>

        {/* Ticket Progress Flow Panel */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm animate-slide-up-fade">
          <h3 className="text-sm font-extrabold text-brandDarkNavy font-sora mb-6">Ticket Progress Flow</h3>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative px-2">
            {/* Horizontal Line background for larger screens */}
            <div className="hidden md:block absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-10" />

            {[
              { num: 1, label: 'Open', color: 'bg-brandRed ring-brandRed/10 text-brandRed', line: 'bg-gradient-to-r from-brandRed to-brandRed' },
              { num: 2, label: 'Assigned', color: 'bg-brandRed ring-brandRed/10 text-brandRed', line: 'bg-gradient-to-r from-brandRed to-amber-500' },
              { num: 3, label: 'In Progress', color: 'bg-amber-500 ring-amber-100 text-amber-600', line: 'bg-gradient-to-r from-amber-500 to-amber-500' },
              { num: 4, label: 'Under Review', color: 'bg-amber-500 ring-amber-100 text-amber-600', line: 'bg-gradient-to-r from-amber-500 to-emerald-500' },
              { num: 5, label: 'Resolved', color: 'bg-emerald-600 ring-emerald-100 text-emerald-600' }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                {/* Step Item */}
                <div className="flex items-center space-x-3 z-10 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ring-4 ${step.color.split(' ')[0]} ${step.color.split(' ')[1]}`}>
                    {step.num}
                  </div>
                  <span className="text-xs font-extrabold text-gray-700 font-sora">{step.label}</span>
                </div>

                {/* Line connector for larger screens */}
                {idx < 4 && (
                  <div className={`hidden md:block flex-1 h-1 rounded-full shadow-sm ${step.line}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between animate-slide-up-fade">
          <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none w-full lg:max-w-sm focus:border-brandNavy/30" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-brandNavy/30 bg-white">
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Needs Clarification">Needs Clarification</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>

        {/* Tickets Tracking Grid */}
        {loading ? (
          <div className="text-sm text-gray-400">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center animate-slide-up-fade">
            <p className="text-gray-500 font-bold">No matching tickets found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTickets.map((ticket) => {
              const catObj = categories.find(c => c.category_id === ticket.category_id);
              const categoryName = catObj ? catObj.name : `Category #${ticket.category_id}`;
              const { currentStep, progressPercent } = getTicketProgress(ticket);
              const deptName = ticket.assigned_department || ticket.business_unit || getDepartmentForCategory(categoryName);
              const relativeTime = getRelativeTime(ticket.created_at || ticket.updated_at);
              const statusStyles = getTrackStatusBadgeStyles(ticket.status);

              return (
                <div
                  key={ticket.ticket_id}
                  onClick={() => openTicketDetails(ticket, 'track')}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden group animate-slide-up-fade"
                >
                  {/* Subtle red/blue accent indicator on hover */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <h2 className="text-lg font-extrabold text-brandDarkNavy font-sora leading-snug">{ticket.title}</h2>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusStyles}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle / User Name */}
                  <p className="text-xs text-gray-400 font-semibold mb-6 font-dmSans">
                    {userName || 'ABC Suppliers Ltd'}
                  </p>

                  {/* Grid Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider font-sora">Ticket ID</p>
                      <p className="text-xs font-bold text-brandDarkNavy mt-1">{ticket.ticket_id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider font-sora">Category</p>
                      <p className="text-xs font-bold text-brandDarkNavy mt-1 truncate">{categoryName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider font-sora">Assigned to Department</p>
                      <p className="text-xs font-bold text-brandDarkNavy mt-1 truncate">{deptName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider font-sora">Department Owner</p>
                      <p className="text-xs font-bold text-brandDarkNavy mt-1 truncate">{ticket.assigned_to || 'Retail Operations'}</p>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider font-sora">Progress</span>
                      <div className="flex items-center space-x-2 text-[11px] font-extrabold text-brandDarkNavy">
                        <span>{progressPercent}%</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1 font-dmSans">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          </svg>
                          {relativeTime}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressBarStyles(ticket.status)} rounded-full transition-all duration-500`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

    const getConversationUpdateState = (status) => {
      if (status === 'Resolved' || status === 'Closed') {
        return { label: 'Resolved', style: 'text-green-600' };
      }
      if (status === 'In Progress') {
        return { label: 'In Progress', style: 'text-amber-600' };
      }
      if (status === 'Under Review') {
        return { label: 'Under Review', style: 'text-amber-600' };
      }
      if (status === 'Needs Clarification') {
        return { label: 'Support feedback', style: 'text-amber-600' };
      }
      return { label: 'No new updates', style: 'text-brandRed' };
    };

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
            {
              label: 'Open Tickets', count: messagesStats.open, icon: (
                <svg className="w-5 h-5 text-brandNavy animate-scale-in" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h5.379c.397 0 .779.158 1.06.439l1.122 1.122c.281.281.663.439 1.061.439h7.878M4.5 7.5v10.125c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V9.5" />
                </svg>
              ), bg: 'bg-[#F0F4FF]', text: 'text-brandNavy'
            },
            {
              label: 'Pending Tickets', count: messagesStats.pending, icon: (
                <svg className="w-5 h-5 text-brandGold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              ), bg: 'bg-brandGold/8', text: 'text-brandGold'
            },
            {
              label: 'Resolved Tickets', count: messagesStats.resolved, icon: (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              ), bg: 'bg-emerald-50', text: 'text-emerald-600'
            },
            {
              label: 'Announcements', count: messagesStats.announcements, icon: (
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              ), bg: 'bg-purple-50', text: 'text-purple-600'
            }
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
                const updateState = getConversationUpdateState(t.status);
                return (
                  <div
                    key={t.ticket_id}
                    onClick={() => {
                      setActiveMessageTicket(t);
                      fetchActiveTicketMessages(t.ticket_id);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 text-left ${isSelected
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
                      <p className={`text-[9px] mt-1 font-bold ${updateState.style}`}>
                        {updateState.label}
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
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${activeMessageTicket.status === 'Open'
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

                          <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${isSupport
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
                        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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
                        <svg className="w-3 h-3 -rotate-45 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
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
                        <div className={`absolute -left-[23px] top-[1px] w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${step.done
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-100'
                            : 'border-gray-200 bg-white text-gray-300'
                          }`} style={{ zIndex: 5 }}>
                          {step.done ? (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="4.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
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
  const renderAnalytics = () => {
    const parseTicketDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const isResolvedStatus = (status) => status === 'Resolved' || status === 'Closed';
    const primaryColor = isVendor ? '#E31837' : '#0F1B4C';
    const secondaryColor = isVendor ? '#0F1B4C' : '#E31837';

    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'Open').length;
    const progressCount = tickets.filter(t => t.status === 'In Progress' || t.status === 'Under Review').length;
    const clarificationCount = tickets.filter(t => t.status === 'Needs Clarification').length;
    const resolvedCount = tickets.filter(t => isResolvedStatus(t.status)).length;
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
    const monthlyCreated = monthKeys.map(key =>
      tickets.filter(ticket => {
        const created = parseTicketDate(ticket.created_at);
        if (!created) return false;
        return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === key;
      }).length
    );

    const categoryCounts = tickets.reduce((acc, ticket) => {
      const category = categories.find(cat => cat.category_id === ticket.category_id);
      const label = category?.name || `Category #${ticket.category_id}`;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const categoryData = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const categoryLabels = categoryData.length ? categoryData.map(([label]) => label) : ['No tickets'];
    const categoryValues = categoryData.length ? categoryData.map(([, count]) => count) : [0];

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
          displayColors: false
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
          grid: { color: 'rgba(148, 163, 184, 0.18)' },
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
        data: monthlyCreated,
        borderColor: primaryColor,
        backgroundColor: `${primaryColor}14`,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: primaryColor,
        pointBorderWidth: 3,
        pointRadius: 4,
        tension: 0.4,
        fill: true
      }]
    };

    const statusChartData = {
      labels: ['Open', 'In Progress', 'Resolved', 'Needs Clarification'],
      datasets: [{
        data: [openCount, progressCount, resolvedCount, clarificationCount],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981', secondaryColor],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 6
      }]
    };

    const categoryChartData = {
      labels: categoryLabels,
      datasets: [{
        label: 'Tickets',
        data: categoryValues,
        backgroundColor: `${primaryColor}D9`,
        borderColor: primaryColor,
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 42
      }]
    };

    const statCards = [
      { label: 'Total Queries', value: totalCount, sub: 'Tickets raised by your account', color: isVendor ? 'text-brandRed' : 'text-brandNavy' },
      { label: 'Completion Rate', value: `${completionRate}%`, sub: `${resolvedCount} resolved or closed`, color: 'text-emerald-600' },
      { label: 'Active Work', value: progressCount, sub: 'In progress or under review', color: 'text-amber-600' },
      { label: 'Needs Clarification', value: clarificationCount, sub: 'Tickets waiting for more information', color: 'text-brandRed' }
    ];

    return (
      <div className="space-y-8 text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Operational Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Live charts from your ticket history, status movement, and category activity.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map(card => (
            <div key={card.label} className="stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase font-sora tracking-widest">{card.label}</span>
              <p className={`text-2xl font-extrabold font-sora mt-2 ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-2 font-semibold font-dmSans">{card.sub}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-xs font-bold text-gray-400 shadow-sm">
            Loading analytics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Monthly Ticket Trend</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Tickets created across the last 6 months.</p>
                <div className="h-72 mt-6">
                  {totalCount ? (
                    <Line data={trendChartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs font-bold text-gray-400">
                      No trend data available
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Tickets by Category</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Top categories from your current query history.</p>
                <div className="h-72 mt-6">
                  {totalCount ? (
                    <Bar data={categoryChartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs font-bold text-gray-400">
                      No category data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm xl:col-span-1">
                <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Status Split</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Current distribution of your tickets.</p>
                <div className="h-64 mt-6 relative">
                  {totalCount ? (
                    <>
                      <Doughnut data={statusChartData} options={doughnutOptions} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-extrabold text-brandDarkNavy font-sora">{totalCount}</span>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase">Tickets</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs font-bold text-gray-400">
                      No status data
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm xl:col-span-2">
                <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Status Overview</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Current workload grouped by ticket status.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  {[
                    ['Open', openCount, 'bg-red-50 text-red-600 border-red-100'],
                    ['In Progress / Review', progressCount, 'bg-amber-50 text-amber-600 border-amber-100'],
                    ['Needs Clarification', clarificationCount, 'bg-blue-50 text-blue-600 border-blue-100'],
                    ['Resolved / Closed', resolvedCount, 'bg-emerald-50 text-emerald-600 border-emerald-100']
                  ].map(([label, value, style]) => (
                    <div key={label} className={`rounded-2xl border px-4 py-5 ${style}`}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider font-sora">{label}</p>
                      <p className="text-2xl font-extrabold mt-2 font-sora">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════
     PROFILE TAB
  ══════════════════════════════════════════ */
  const renderProfile = () => {
    const activeTickets = tickets.filter(ticket => !['Resolved', 'Closed'].includes(ticket.status)).length;
    const resolvedTickets = tickets.filter(ticket => ['Resolved', 'Closed'].includes(ticket.status)).length;
    const clarificationTickets = tickets.filter(ticket => ticket.status === 'Needs Clarification').length;

    return (
      <div className="space-y-8 text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brandDarkNavy font-sora">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your user account, notification preferences, and support activity.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-2 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
            <div className="p-6 text-center">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center font-extrabold text-2xl text-white shadow-lg mx-auto ${isVendor ? 'bg-gradient-to-br from-brandRed to-[#A50E23]' : 'bg-gradient-to-br from-brandNavy to-[#080E29]'}`}>
                {getInitials(userName)}
              </div>
              <h3 className="font-extrabold text-xl text-brandDarkNavy font-sora mt-5">{userName}</h3>
              <p className="text-xs font-bold text-gray-400 mt-1">{userEmail}</p>
              <span className={`inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${isVendor ? 'bg-brandRed/5 text-brandRed border-brandRed/20' : 'bg-brandNavy/5 text-brandNavy border-brandNavy/20'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {roleLabel}
              </span>

              <div className="grid grid-cols-3 gap-2 mt-6">
                {[
                  ['Active', activeTickets],
                  ['Resolved', resolvedTickets],
                  ['Clarify', clarificationTickets]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-3">
                    <p className="text-lg font-extrabold text-brandDarkNavy font-sora">{value}</p>
                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>

              <button onClick={handleLogout}
                className="mt-6 w-full rounded-2xl border border-brandRed/15 bg-brandRed/5 px-5 py-3 text-center text-xs font-extrabold text-brandRed transition-all duration-300 hover:border-brandRed/25 hover:bg-brandRed/10">
                Sign Out
              </button>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white p-6 md:p-7 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-brandDarkNavy font-sora">Account Information</h3>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">Read-only details linked with your QMS login.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                {[
                  { label: 'Full Name', val: userName },
                  { label: 'Email Address', val: userEmail },
                  { label: 'Account Type', val: 'QMS Portal User' },
                  { label: 'User ID', val: userEmail?.split('@')[0] || 'user-account' },
                  { label: 'Primary Department', val: 'Supply Chain Operations' },
                  { label: 'Support Access', val: MESSAGES_FEATURE_ENABLED ? 'Ticket, Messages, Tracking' : 'Ticket, Tracking, Help Center' }
                ].map(({ label, val }) => (
                  <div key={label}>
                    <label className="block text-[10px] font-extrabold text-gray-400 font-sora tracking-widest uppercase mb-2">{label}</label>
                    <div className="w-full border border-gray-150 px-4 py-3 rounded-2xl text-xs font-bold bg-gray-50/70 text-gray-600">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Notification Preferences</h3>
                <p className="text-xs text-gray-400 mt-1 mb-5 font-semibold">Choose how ticket updates reach you.</p>
                {[
                  {
                    label: 'Email ticket updates',
                    sub: 'Receive status changes and admin replies by email.',
                    enabled: emailAlerts,
                    toggle: () => setEmailAlerts(!emailAlerts)
                  },
                  {
                    label: 'SMS ticket updates',
                    sub: 'Get text alerts for important query updates.',
                    enabled: smsAlerts,
                    toggle: () => setSmsAlerts(!smsAlerts)
                  }
                ].map(({ label, sub, enabled, toggle }) => (
                  <div key={label} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                    <div className="pr-4">
                      <p className="text-xs font-extrabold text-gray-700">{label}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-relaxed">{sub}</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggle}
                      className={`w-11 h-6 rounded-full p-1 cursor-pointer flex items-center transition-all duration-300 shrink-0 ${enabled
                          ? (isVendor ? 'bg-brandRed justify-end' : 'bg-brandNavy justify-end')
                          : 'bg-gray-200 justify-start'
                        }`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-extrabold text-sm text-brandDarkNavy font-sora">Security & Access</h3>
                <p className="text-xs text-gray-400 mt-1 mb-5 font-semibold">Current session and account protection details.</p>
                <div className="space-y-3">
                  {[
                    ['Password', 'Protected by encrypted login credentials'],
                    ['Session', 'Active on this browser'],
                    ['Last Login', 'Available after next authentication'],
                    ['Account Status', 'Verified and enabled']
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">{label}</p>
                      <p className="text-xs font-bold text-brandDarkNavy mt-1">{value}</p>
                    </div>
                  ))}
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
      case 'Dashboard': return renderDashboard();
      case 'My Queries': return renderMyQueries();
      case 'Track Status': return renderTrackStatus();
      // TEMPORARILY DISABLED - MESSAGES FEATURE
      case 'Messages': return MESSAGES_FEATURE_ENABLED ? renderMessages() : renderDashboard();
      case 'Analytics': return renderAnalytics();
      case 'Profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  /* ══════════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════════ */
  const supportStats = {
    active: tickets.filter(ticket => ['Open', 'In Progress', 'Needs Clarification'].includes(ticket.status)).length,
    underReview: tickets.filter(ticket => ticket.status === 'Under Review').length,
    resolved: tickets.filter(ticket => ['Resolved', 'Closed'].includes(ticket.status)).length
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] font-dmSans flex flex-col relative">

      {/* ── TOP NAVBAR ── */}
      <header className="h-20 glass-navbar border-b border-gray-100/80 flex items-center justify-between px-8 shrink-0 z-30 sticky top-0 shadow-[0_1px_12px_rgba(0,0,0,.04)]">
        <div className="flex items-center space-x-4">
          <img src={relianceLogo} alt="Reliance Retail Logo" className="h-10 w-auto object-contain" />
          <span className="text-[10px] text-brandMuted uppercase ml-2 hidden lg:inline-block border-l pl-3 border-gray-200 tracking-widest font-extrabold font-sora">QMS Portal</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* TEMPORARILY DISABLED - MESSAGES FEATURE */}
          {MESSAGES_FEATURE_ENABLED && (
            <button
              onClick={() => switchTab('Messages')}
              className={`p-2.5 rounded-xl border border-gray-150/60 hover:bg-gray-50 text-gray-500 transition-all relative ${activeTab === 'Messages' ? 'bg-gray-50 text-brandNavy border-gray-200' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white notif-pulse ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
            </button>
          )}

          <div className={`flex items-center space-x-3 ${MESSAGES_FEATURE_ENABLED ? 'pl-3 border-l border-gray-100' : ''}`}>
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
                // TEMPORARILY DISABLED - MESSAGES FEATURE
                ...(MESSAGES_FEATURE_ENABLED ? [{
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
                }] : []),
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
                {
                  label: 'User Guide', onClick: () => setIsUserGuideOpen(true), icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  )
                },
                {
                  label: 'Help Center', onClick: openChatSupport, icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                  )
                },
                {
                  label: 'Contact Support', onClick: undefined, icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.806-5.194-4.176-7-7l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  )
                }
              ].map((hlp, idx) => (
                <button
                  key={idx}
                  onClick={hlp.onClick}
                  disabled={!hlp.onClick}
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
            className="mt-6 w-full rounded-2xl border border-brandRed/15 bg-brandRed/5 px-3.5 py-3 text-center text-xs font-extrabold text-brandRed transition-all hover:border-brandRed/25 hover:bg-brandRed/10"
          >
            Sign Out
          </button>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F6F7FB]">
          <div key={transitionKey} className="max-w-6xl mx-auto page-enter">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* -- RAISE NEW QUERY MODAL -- */}
      <RaiseTicketModal
        isOpen={isModalOpen}
        isCategoryLocked={isCategoryLocked}
        isVendor={isVendor}
        isSubmittedSuccessfully={isSubmittedSuccessfully}
        submittedTicket={submittedTicket}
        handleCloseModal={handleCloseModal}
        buttonColor={buttonColor}
        handleSubmitTicket={handleSubmitTicket}
        formCategory={formCategory}
        getCategoryPlaceholders={getCategoryPlaceholders}
        formSubject={formSubject}
        setFormSubject={setFormSubject}
        categories={categories}
        setFormCategory={setFormCategory}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        getAISuggestion={getAISuggestion}
        aiLoading={aiLoading}
        aiSuggestion={aiSuggestion}
        handleApplyAISuggestion={handleApplyAISuggestion}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        handleFileChange={handleFileChange}
        attachment={attachment}
        setAttachment={setAttachment}
        attachmentError={attachmentError}
        isSubmitting={isSubmitting}
      />

      {isUserGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brandNavy/30 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsUserGuideOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in font-dmSans">
            <div className={`h-2 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-brandDarkNavy font-sora">User Guide</h3>
                  <p className="text-xs text-gray-500 mt-1 font-semibold">Quick steps for using the QMS dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUserGuideOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ['Raise a Query', 'Open Dashboard, choose a category, fill details, and submit your ticket.'],
                  ['Track Status', 'Use Track Status or My Queries to follow progress and resolution.'],
                  // TEMPORARILY DISABLED - MESSAGES FEATURE
                  ...(MESSAGES_FEATURE_ENABLED ? [['Messages', 'Open Messages to read admin replies and send follow-up messages.']] : []),
                  ['Contact Support', 'Use Contact Support to create a support request with the ticket form.']
                ].map(([title, desc], index) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-brandDarkNavy font-sora">{title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-semibold leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsUserGuideOpen(false)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${buttonColor}`}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── TICKET DETAILS MODAL ── */}
      {isChatSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brandNavy/35 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setIsChatSupportOpen(false)} />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_30px_90px_rgba(9,19,57,0.28)] animate-scale-in font-dmSans backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(227,24,55,0.08)_0%,rgba(255,255,255,0.72)_34%,rgba(15,27,76,0.08)_100%)] pointer-events-none" />
            <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-brandRed/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-brandNavy/12 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="bg-gradient-to-r from-brandNavy via-[#17245D] to-brandRed px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold tracking-widest uppercase text-white/65">Support Center</p>
                      <h3 className="mt-1 text-2xl font-extrabold font-sora tracking-tight">How can we route your request?</h3>
                      <p className="mt-2 max-w-xl text-xs font-semibold leading-relaxed text-white/72">
                        Use your existing ticket workflow to review issues, continue conversations, or raise a new support request.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatSupportOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white"
                    aria-label="Close support center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="relative p-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Active', value: supportStats.active, tone: 'text-brandRed', bg: 'from-brandRed/12 to-white' },
                    { label: 'Under Review', value: supportStats.underReview, tone: 'text-brandNavy', bg: 'from-brandNavy/12 to-white' },
                    { label: 'Resolved', value: supportStats.resolved, tone: 'text-emerald-600', bg: 'from-emerald-500/12 to-white' }
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-2xl border border-white/70 bg-gradient-to-br ${stat.bg} p-4 shadow-[0_10px_28px_rgba(15,27,76,0.08)] backdrop-blur`}>
                      <p className={`text-2xl font-black font-sora ${stat.tone}`}>{stat.value}</p>
                      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    {
                      label: 'View My Tickets',
                      desc: 'Review all raised tickets and open the right query.',
                      onClick: viewTicketsFromSupport,
                      accent: 'from-brandNavy to-[#1D2D70]',
                      chip: 'Ticket Hub',
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-7 w-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h10.5A2.25 2.25 0 0 1 19.5 6v12A2.25 2.25 0 0 1 17.25 20.25H6.75A2.25 2.25 0 0 1 4.5 18V6A2.25 2.25 0 0 1 6.75 3.75Zm2.25 4.5h6m-6 3.75h6m-6 3.75h3" />
                        </svg>
                      )
                    },
                    // TEMPORARILY DISABLED - MESSAGES FEATURE
                    ...(MESSAGES_FEATURE_ENABLED ? [{
                      label: 'Open Messages Center',
                      desc: 'Continue an active conversation with support.',
                      onClick: openMessagesFromSupport,
                      accent: 'from-brandRed to-[#A80F26]',
                      chip: 'Live Thread',
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-7 w-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                      )
                    }] : []),
                    {
                      label: 'Raise New Ticket',
                      desc: 'Create a fresh support request with details and attachments.',
                      onClick: raiseTicketFromSupport,
                      accent: 'from-[#23347A] to-brandRed',
                      chip: 'New Request',
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-7 w-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15M6.75 3.75h10.5" />
                        </svg>
                      )
                    }
                  ].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className="group relative min-h-[210px] overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-4 text-left shadow-[0_14px_38px_rgba(15,27,76,0.10)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,27,76,0.18)]"
                    >
                      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${action.accent}`} />
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-105`}>
                        {action.icon}
                      </div>
                      <div className="mt-5">
                        <span className="inline-flex rounded-full bg-brandNavy/5 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-brandNavy/70">
                          {action.chip}
                        </span>
                        <h4 className="mt-3 text-sm font-extrabold text-brandDarkNavy font-sora leading-snug">{action.label}</h4>
                        <p className="mt-2 text-[11px] font-semibold leading-relaxed text-gray-500">{action.desc}</p>
                      </div>
                      <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition-all group-hover:bg-brandNavy group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-brandNavy/35 backdrop-blur-sm overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-brandNavy/10 backdrop-blur-[1px]" onClick={closeTicketDetails} />
          <div className={`relative bg-white w-full ${selectedTicketView === 'track' ? 'max-w-6xl max-h-[calc(100vh-5.5rem)]' : 'max-w-5xl max-h-[calc(100vh-4rem)]'} rounded-2xl shadow-2xl border border-gray-100/90 overflow-hidden z-10 animate-scale-in flex flex-col font-dmSans`}>
            <div className={`h-1.5 w-full ${isVendor ? 'bg-brandRed' : 'bg-brandNavy'}`} />

            <button onClick={closeTicketDetails}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
              <div className="min-w-0 pr-10">
                <span className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora block mb-0.5">
                  Ticket Details
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base md:text-xl font-black text-brandDarkNavy font-sora tracking-tight leading-tight">
                    {selectedTicket.title}
                  </h2>
                  <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-200/60 px-2 py-1 rounded-lg font-sora select-none leading-none">
                    #{selectedTicket.ticket_id}
                  </span>
                </div>
              </div>
            </div>

            <div className={`grid ${selectedTicketView === 'track' ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-2.5 px-4 py-3 bg-gray-50/30`}>
              {/* Category */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className="w-7 h-7 rounded-lg bg-brandNavy/5 text-brandNavy flex items-center justify-center flex-shrink-0 border border-brandNavy/10">
                  {getCategoryIcon(selectedTicket.category_id)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora leading-none">Category</p>
                  <p className="text-xs font-bold text-brandDarkNavy mt-1 leading-snug break-words" title={categories.find(c => c.category_id === selectedTicket.category_id)?.name}>
                    {categories.find(c => c.category_id === selectedTicket.category_id)?.name || `Category #${selectedTicket.category_id}`}
                  </p>
                </div>
              </div>

              {/* Assigned Department */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className="w-7 h-7 rounded-lg bg-brandNavy/5 text-brandNavy flex items-center justify-center flex-shrink-0 border border-brandNavy/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 7.5h1.5m-1.5 3h1.5m4.5-3h1.5m-1.5 3h1.5M9 21v-4.5h6V21" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora leading-none">Assigned to Department</p>
                  <p className="text-xs font-bold text-brandDarkNavy mt-1 leading-snug break-words">
                    {selectedTicket.assigned_department || selectedTicket.business_unit || getDepartmentForCategory(categories.find(c => c.category_id === selectedTicket.category_id)?.name)}
                  </p>
                </div>
              </div>

              {selectedTicketView === 'track' && (
                <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 border ${selectedTicket.status === 'Resolved' ? 'text-emerald-600 bg-emerald-50/50 border-emerald-100' :
                      selectedTicket.status === 'In Progress' ? 'text-amber-500 bg-amber-50/50 border-amber-100' :
                        selectedTicket.status === 'Open' ? 'text-brandNavy bg-blue-50/50 border-blue-100' : 'text-brandRed bg-rose-50/50 border-rose-100'
                    }`}>
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora leading-none">Status</p>
                    <span className={`inline-block text-[10px] font-extrabold mt-1 px-2 py-0.5 rounded border leading-none ${selectedTicket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                        selectedTicket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                          selectedTicket.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                            'bg-rose-50 text-rose-700 border-rose-200/50'
                      }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Submitted Date */}
              <div className="bg-white border border-gray-150/70 rounded-xl p-3 flex items-center space-x-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200">
                <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center flex-shrink-0 border border-gray-100">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider font-sora leading-none">Submitted</p>
                  <p className="text-xs font-bold text-brandDarkNavy mt-1 leading-snug break-words" title={selectedTicket.created_at}>
                    {formatTicketDate(selectedTicket.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-4" />

            {selectedTicket.status === 'Open' && (
              <div className="mx-4 mt-3 rounded-xl border border-brandNavy/10 bg-blue-50/40 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-brandNavy font-sora">Ticket is still open</p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">You can edit or withdraw this ticket before work starts.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingTicket((value) => !value);
                        setEditTicketForm({
                          title: selectedTicket.title || '',
                          description: selectedTicket.description || '',
                          category_id: String(selectedTicket.category_id || categories[0]?.category_id || '1')
                        });
                      }}
                      className="rounded-lg bg-brandNavy px-4 py-2 text-xs font-extrabold text-white"
                    >
                      {isEditingTicket ? 'Cancel Edit' : 'Edit Ticket'}
                    </button>
                    <button
                      type="button"
                      disabled={ticketActionLoading === 'withdraw'}
                      onClick={handleWithdrawTicket}
                      className="rounded-lg border border-brandRed/20 px-4 py-2 text-xs font-extrabold text-brandRed disabled:opacity-50"
                    >
                      {ticketActionLoading === 'withdraw' ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  </div>
                </div>

                {isEditingTicket && (
                  <form onSubmit={handleEditTicketSubmit} className="mt-3 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[9px] font-extrabold uppercase text-gray-400">Title</span>
                        <input
                          required
                          value={editTicketForm.title}
                          onChange={(event) => setEditTicketForm((prev) => ({ ...prev, title: event.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold outline-none focus:border-brandNavy"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[9px] font-extrabold uppercase text-gray-400">Category</span>
                        <select
                          value={editTicketForm.category_id}
                          onChange={(event) => setEditTicketForm((prev) => ({ ...prev, category_id: event.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold outline-none focus:border-brandNavy"
                        >
                          {categories.map((category) => (
                            <option key={category.category_id} value={category.category_id}>{category.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[9px] font-extrabold uppercase text-gray-400">Description</span>
                      <textarea
                        required
                        value={editTicketForm.description}
                        onChange={(event) => setEditTicketForm((prev) => ({ ...prev, description: event.target.value }))}
                        className="min-h-[80px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold outline-none focus:border-brandNavy"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[9px] font-extrabold uppercase text-gray-400">Replace Attachment Optional</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                        onChange={(event) => setEditTicketAttachment(event.target.files?.[0] || null)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold"
                      />
                    </label>
                    <button
                      disabled={ticketActionLoading === 'edit'}
                      className="justify-self-end rounded-lg bg-brandNavy px-5 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                    >
                      {ticketActionLoading === 'edit' ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {selectedTicket.status === 'Needs Clarification' && (
              <form onSubmit={handleClarificationSubmit} className="mx-4 mt-3 rounded-xl border border-brandRed/20 bg-red-50/50 p-3">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-brandRed font-sora">Clarification requested</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">Add the details requested by the admin or department team.</p>
                {getLatestClarificationRequest(selectedTicket) && (
                  <div className="mt-3 rounded-lg border border-brandRed/15 bg-white px-3 py-2">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">Request note</p>
                    <p className="mt-1 text-xs font-bold text-brandDarkNavy">{getLatestClarificationRequest(selectedTicket)}</p>
                  </div>
                )}
                <textarea
                  required
                  value={clarificationText}
                  onChange={(event) => setClarificationText(event.target.value)}
                  placeholder="Type the additional details here..."
                  className="mt-3 min-h-[90px] w-full resize-none rounded-lg border border-brandRed/20 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-brandRed"
                />
                <label className="mt-2 block">
                  <span className="mb-1 block text-[9px] font-extrabold uppercase text-gray-400">Attachment Optional</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx"
                    onChange={(event) => setClarificationAttachment(event.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-brandRed/20 bg-white px-3 py-2 text-xs font-semibold"
                  />
                </label>
                <button
                  disabled={ticketActionLoading === 'clarification' || !clarificationText.trim()}
                  className="mt-3 rounded-lg bg-brandRed px-5 py-2 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {ticketActionLoading === 'clarification' ? 'Submitting...' : 'Submit Clarification'}
                </button>
              </form>
            )}

            {selectedTicketView === 'track' ? (
              <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-3.5 px-4 py-3 min-h-0">
                <div className="lg:col-span-8 min-h-0">
                  {renderAdvancedTicketJourneyMap(selectedTicket)}
                </div>

                <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
                  {/* Description Block */}
                  <div className="min-h-0">
                    <h4 className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora mb-2 leading-none">Description</h4>
                    <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-3.5 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-medium break-words line-clamp-[10]">
                      {selectedTicket.description}
                    </div>
                  </div>

                  {/* Attachment File Card */}
                  {selectedTicket.attachment_path && (
                    <div>
                      <h4 className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora mb-2 leading-none">Attachments</h4>
                      <div className="border border-gray-200/85 hover:border-gray-300 rounded-xl p-3 flex items-center justify-between bg-white gap-3 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-brandNavy/5 text-brandNavy flex items-center justify-center flex-shrink-0 border border-brandNavy/10">
                            <svg className="w-4 h-4 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] uppercase text-gray-400 font-extrabold tracking-wider font-sora leading-none">Attachment File</p>
                            <p className="text-xs font-bold text-brandDarkNavy truncate max-w-[180px] sm:max-w-[240px] mt-1 leading-snug" title={selectedTicket.attachment_path.split('_').slice(1).join('_') || selectedTicket.attachment_path}>
                              {selectedTicket.attachment_path.split('_').slice(1).join('_') || selectedTicket.attachment_path}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => downloadAttachment(selectedTicket.attachment_path)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-brandNavy bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 shrink-0 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 py-4 space-y-4">
                {/* Description Block */}
                <div>
                  <h4 className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora mb-2 leading-none">Description</h4>
                  <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium break-words">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Attachment File Card */}
                {selectedTicket.attachment_path && (
                  <div>
                    <h4 className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest font-sora mb-2 leading-none">Attachments</h4>
                    <div className="border border-gray-200/85 hover:border-gray-300 rounded-xl p-3 flex items-center justify-between bg-white gap-3 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-brandNavy/5 text-brandNavy flex items-center justify-center flex-shrink-0 border border-brandNavy/10">
                          <svg className="w-4 h-4 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A2.25 2.25 0 0 0 1.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h12a2.25 2.25 0 0 0 2.25-2.25v-3.75Z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] uppercase text-gray-400 font-extrabold tracking-wider font-sora leading-none">Attachment File</p>
                          <p className="text-xs font-bold text-brandDarkNavy truncate max-w-[180px] sm:max-w-[240px] mt-1 leading-snug" title={selectedTicket.attachment_path.split('_').slice(1).join('_') || selectedTicket.attachment_path}>
                            {selectedTicket.attachment_path.split('_').slice(1).join('_') || selectedTicket.attachment_path}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => downloadAttachment(selectedTicket.attachment_path)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-brandNavy bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 shrink-0 shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 text-brandNavy" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
