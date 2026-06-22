
import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { RoleContext } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';
import BlobTransition from '../components/BlobTransition';
import relianceLogo from '../assets/reliance_logo.png';
import DashboardShowcase from '../components/DashboardShowcase';
import api from '../utils/api';

const LoginPage = () => {
  const { login, logout } = useContext(AuthContext);
  const { setSelectedSubRole } = useContext(RoleContext);
  const navigate = useNavigate();

  // Roles Definition
  const roles = [
    {
      id: 'admin',
      title: 'Business Owner',
      desc: 'Manage queries, view analytics, assign agents',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      )
    },
    {
      id: 'vendor',
      title: 'User',
      desc: 'Who can raise tickets, track status',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      )
    },
    {
      id: 'department',
      title: 'Department',
      desc: 'Resolve assigned team tickets',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      )
    }
  ];

  // States
  const [screen, setScreen] = useState('role_selection'); // role_selection, login_form, animating_blob, success_screen
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState({ type: '', message: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0); // For triggering slide-up animations
  const [introStage] = useState('done'); // center, pulse, move, done

  // Highly-optimized cursor parallax using refs (avoids 60 FPS full-component re-renders)
  const parallaxRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const smoothPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mousePosRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const updatePosition = () => {
      const dx = mousePosRef.current.x - smoothPosRef.current.x;
      const dy = mousePosRef.current.y - smoothPosRef.current.y;

      smoothPosRef.current.x += dx * 0.045;
      smoothPosRef.current.y += dy * 0.045;

      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate(${smoothPosRef.current.x * 20}px, ${smoothPosRef.current.y * 20}px)`;
        
        const redBlob = parallaxRef.current.querySelector('.red-blob');
        if (redBlob) {
          redBlob.style.transform = `translate(${smoothPosRef.current.x * 12}px, ${smoothPosRef.current.y * 12}px)`;
        }

        const blueBlob = parallaxRef.current.querySelector('.blue-blob');
        if (blueBlob) {
          blueBlob.style.transform = `translate(${smoothPosRef.current.x * -12}px, ${smoothPosRef.current.y * -12}px)`;
        }
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
    setEmail('');
    setPassword('');
  };

  const handleContinue = () => {
    if (!role) return;
    setFormKey(prev => prev + 1);
    setScreen('login_form');
  };

  const handleBack = () => {
    setScreen('role_selection');
  };

  const handleForgotPassword = () => {
    setResetEmail(email);
    setNewPassword('');
    setConfirmPassword('');
    setResetStatus({ type: '', message: '' });
    setScreen('forgot_password');
  };

  const handleResetBack = () => {
    setNewPassword('');
    setConfirmPassword('');
    setResetStatus({ type: '', message: '' });
    setScreen('login_form');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) return;

    setScreen('animating_blob');
    setLoading(true);

    try {
      // Execute the existing AuthContext login call
      const user = await login(email, password);

      const allowedRoleBySelection = {
        admin: ['super_admin', 'admin'],
        vendor: ['user'],
        department: ['department']
      };

      if (!allowedRoleBySelection[role]?.includes(user.role)) {
        logout();
        setScreen('login_form');
        setLoading(false);
        alert(`This account is not registered for ${getRoleTitle(role)} login.`);
        return;
      }

      // Save user profile for success screen
      setLoggedUser(user);
      setSelectedSubRole(role); // Store selected UI role in lightweight context
    } catch {
      setScreen('login_form');
      setLoading(false);
      alert('Invalid Credentials');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!resetEmail || !newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      setResetStatus({
        type: 'error',
        message: 'Password must be at least 6 characters.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetStatus({
        type: 'error',
        message: 'Passwords do not match.'
      });
      return;
    }

    setResetLoading(true);
    setResetStatus({ type: '', message: '' });

    try {
      await api.post('/auth/forgot-password', {
        email: resetEmail,
        new_password: newPassword
      });

      setEmail(resetEmail);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetStatus({
        type: 'success',
        message: 'Password reset successfully. You can sign in now.'
      });
    } catch (error) {
      setResetStatus({
        type: 'error',
        message: error.response?.data?.error || 'Unable to reset password. Please try again.'
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleBlobComplete = () => {
    // If login has completed successfully, navigate directly to the correct dashboard
    if (loggedUser) {
      if (loggedUser.role === 'super_admin' || loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'department') {
        navigate('/department-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const getRoleTitle = (roleId) => {
    const r = roles.find(x => x.id === roleId);
    return r ? r.title : '';
  };

  return (
    <div className="min-h-screen flex bg-brandBg font-dmSans overflow-hidden relative">
      <style>{`
        @keyframes glowPulseRed {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.8; }
          50% { transform: scale(1.1) translate(-20px, 10px); opacity: 1; }
        }
        @keyframes glowPulseBlue {
          0%, 100% { transform: scale(1.1) translate(0, 0); opacity: 0.9; }
          50% { transform: scale(1) translate(20px, -10px); opacity: 0.7; }
        }
        .animate-glow-pulse-red {
          animation: glowPulseRed 8s ease-in-out infinite;
        }
        .animate-glow-pulse-blue {
          animation: glowPulseBlue 10s ease-in-out infinite;
        }
      `}</style>

      {/* Cinematic Intro Background Layer */}
      {introStage !== 'done' && (
        <div className={`fixed inset-0 z-40 bg-[#091339] overflow-hidden transition-opacity duration-[1000ms] ${
          introStage === 'move' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-brandRed/15 rounded-full blur-[120px] animate-glow-pulse-red" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[120px] animate-glow-pulse-blue" />
          
          {/* Grid lines appearing in background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        </div>
      )}

      {/* Cinematic Intro Moving Logo */}
      {introStage !== 'done' && (
        <div className={`fixed z-50 transition-all duration-[1200ms] cubic-bezier(0.25, 1, 0.5, 1) ${
          introStage === 'center'
            ? 'inset-0 m-auto w-72 h-16 flex items-center justify-center scale-95 opacity-0'
            : introStage === 'pulse'
            ? 'inset-0 m-auto w-72 h-16 flex items-center justify-center scale-105 opacity-100 filter drop-shadow-[0_0_20px_rgba(227,24,55,0.2)]'
            : 'fixed top-[32px] left-[32px] lg:top-[32px] lg:left-[32px] xl:top-[40px] xl:left-[40px] m-0 w-40 h-10 scale-75 origin-top-left lg:opacity-100 opacity-0 brightness-0 invert'
        }`}>
          <img
            src={relianceLogo}
            alt="Reliance Retail Logo"
            className={`w-full h-full object-contain transition-all duration-[1200ms] ${
              introStage === 'move' ? 'brightness-0 invert' : ''
            }`}
          />
        </div>
      )}

      {/* ----------------- LEFT PANEL ----------------- */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0 bg-gradient-to-b from-brandNavy to-brandDarkNavy text-white p-8 xl:p-10 flex-col justify-start relative overflow-hidden z-10 shadow-2xl max-h-screen">
        {/* Technology Grid pattern */}
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none transition-opacity duration-1000 ${
          introStage === 'move' || introStage === 'done' ? 'opacity-30' : 'opacity-0'
        }`} />

        {/* Floating Animated Background Rings */}
        <div className="absolute top-12 -right-16 w-80 h-80 rounded-full border border-white/5 pointer-events-none animate-float-ring-1" />
        <div className="absolute -bottom-24 -left-12 w-[450px] h-[450px] rounded-full border border-white/5 pointer-events-none animate-float-ring-2" />

        {/* Top Branding Section */}
        <div className={`relative z-10 transition-all duration-1000 ${
          introStage === 'move' || introStage === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex flex-col space-y-1 mb-2 xl:mb-3">
            {/* Reliance Retail Logo */}
            <img
              src={relianceLogo}
              alt="Reliance Retail Logo"
              className={`h-9 xl:h-11 w-auto object-contain self-start brightness-0 invert transition-opacity duration-300 ${
                introStage === 'done' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <p className="text-[9px] uppercase font-sora tracking-widest text-brandMuted mt-1">Query Management System</p>
          </div>

          {/* Headline & Subtitle */}
          <div className="mt-4 xl:mt-5 space-y-2">
            <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-extrabold font-sora leading-tight">
              Manage Retail <span className="text-[#E31837]"> Queries </span> Efficiently.
            </h1>
            <p className="text-xs xl:text-sm text-brandMuted leading-relaxed">
              Raise, track, manage, and resolve user queries efficiently through one centralized platform.
            </p>
          </div>
        </div>

        {/* Center Showcase Area */}
        <div className={`relative z-10 flex-1 flex items-center justify-center py-6 xl:py-8 px-8 mt-2 transition-all duration-1000 delay-[300ms] ${
          introStage === 'move' || introStage === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <DashboardShowcase />
        </div>
      </div>

      {/* ----------------- RIGHT PANEL & TRANSITIONS ----------------- */}
      <div className="flex-1 relative z-0 overflow-hidden bg-white">
        {/* PARALLAX MOVING GRADIENT LAYER */}
        <div 
          ref={parallaxRef}
          className="absolute inset-0 pointer-events-none overflow-hidden -z-20 bg-white"
          style={{
            transform: 'translate(0px, 0px)',
            willChange: 'transform'
          }}
        >
          {/* Red blob (matching the left side composition of the provided image) */}
          <div 
            className="red-blob absolute w-[580px] h-[480px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(227,24,55,0.38)_0%,rgba(227,24,55,0.12)_50%,rgba(255,255,255,0)_70%)]"
            style={{
              top: '12%',
              left: '-8%',
              filter: 'blur(75px)',
              transform: 'translate(0px, 0px)',
              willChange: 'transform'
            }}
          />

          {/* Blue blob (matching the right side composition of the provided image) */}
          <div 
            className="blue-blob absolute w-[680px] h-[580px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.34)_0%,rgba(59,130,246,0.10)_50%,rgba(255,255,255,0)_70%)]"
            style={{
              bottom: '8%',
              right: '-12%',
              filter: 'blur(80px)',
              transform: 'translate(0px, 0px)',
              willChange: 'transform'
            }}
          />
        </div>

        {/* SUBTLE RIGHT PANEL GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(227,24,55,0.065)_1px,transparent_1px),linear-gradient(to_bottom,rgba(227,24,55,0.055)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

        <div className="relative w-full h-full overflow-hidden">
          <div className="flex items-center justify-center p-6 lg:p-12 h-full relative">

        {/* 1. SCREEN: ROLE SELECTION */}
        {screen === 'role_selection' && (
          <div className="relative z-10 w-full max-w-[450px]">
            <div className="transition-all duration-150 transform opacity-100 translate-y-0">
              <h2 className="text-4xl font-extrabold text-brandDarkNavy tracking-tight mb-2 font-sora">
                Welcome
              </h2>
              <p className="text-gray-500 text-sm mb-8">
                Select your role to continue
              </p>
            </div>

            {/* Role Card Tiles */}
            <div className="space-y-4 mb-8">
              {roles.map((item) => {
                const isSelected = role === item.id;
                let cardStyles = 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700';
                
                if (isSelected) {
                  if (item.id === 'vendor') {
                    cardStyles = 'bg-brandRed border-brandRed text-white shadow-lg shadow-brandRed/20';
                  } else {
                    cardStyles = 'bg-brandNavy border-brandNavy text-white shadow-lg shadow-brandNavy/20';
                  }
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleRoleSelect(item.id)}
                    className={`relative flex items-center justify-between border rounded-2xl p-5 cursor-pointer transition-all duration-150 transform opacity-100 translate-y-0 ${cardStyles}`}
                  >
                    <div className="flex items-center space-x-4 pl-1">
                      {/* Role Icon Container */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {item.icon}
                      </div>

                      {/* Description */}
                      <div className="text-left">
                        <h3 className={`font-extrabold text-[16px] font-sora ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className={`transition-all duration-300 ${isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 text-current">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!role}
              className={`w-full py-4 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all duration-150 transform opacity-100 translate-y-0 shadow-lg ${!role
                  ? 'bg-[#B2C0D6] text-white cursor-not-allowed shadow-none'
                  : role === 'vendor'
                    ? 'bg-brandRed hover:bg-[#C2112C] text-white hover:shadow-brandRed/30'
                    : 'bg-brandNavy hover:bg-brandDarkNavy text-white hover:shadow-brandNavy/30'
                }`}
            >
              <span>Continue</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>

            {/* Authentication Footer Label */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400 transition-all duration-150 transform opacity-100 translate-y-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span>Intelligent Support Management System</span>
            </div>
          </div>
        )}

        {/* 2. SCREEN: LOGIN FORM */}
        {screen === 'login_form' && (
          <div key={`form-${formKey}`} className="relative z-10 w-full max-w-[450px] animate-slide-up-fade">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-brandNavy transition-colors mb-6 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              <span>Back</span>
            </button>

            {/* Header */}
            <h2 className="text-4xl font-extrabold text-brandDarkNavy tracking-tight mb-2 font-sora leading-tight">
              Sign in as {getRoleTitle(role)}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your credentials to access the portal
            </p>

            {/* Role Badge Pill */}
            <div className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border ${role === 'vendor'
                ? 'bg-brandRed/5 border-brandRed/20 text-brandRed'
                : 'bg-brandNavy/5 border-brandNavy/20 text-brandNavy'
              }`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
              <span>{getRoleTitle(role)}</span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@relianceretail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3.5 rounded-2xl outline-none focus:border-brandNavy transition-all bg-gray-50/50 text-[15px]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3.5 rounded-2xl outline-none focus:border-brandNavy transition-all bg-gray-50/50 text-[15px]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!email || !password}
                className={`w-full py-4 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg ${!email || !password
                    ? 'bg-[#B2C0D6] text-white cursor-not-allowed shadow-none'
                    : role === 'vendor'
                      ? 'bg-brandRed hover:bg-[#C2112C] text-white hover:shadow-brandRed/30'
                      : 'bg-brandNavy hover:bg-brandDarkNavy text-white hover:shadow-brandNavy/30'
                  }`}
              >
                <span>Sign In</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12a3 3 0 0 0-3-3" />
                </svg>
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-brandNavy hover:text-brandDarkNavy transition-colors hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        )}

        {/* 3. SCREEN: FORGOT PASSWORD */}
        {screen === 'forgot_password' && (
          <div className="relative z-10 w-full max-w-[450px] animate-slide-up-fade">
            <button
              onClick={handleResetBack}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-brandNavy transition-colors mb-6 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              <span>Back to sign in</span>
            </button>

            <h2 className="text-4xl font-extrabold text-brandDarkNavy tracking-tight mb-2 font-sora leading-tight">
              Reset password
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Enter your account email and choose a new password.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@relianceretail.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3.5 rounded-2xl outline-none focus:border-brandNavy transition-all bg-gray-50/50 text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3.5 rounded-2xl outline-none focus:border-brandNavy transition-all bg-gray-50/50 text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brandDarkNavy font-sora tracking-widest uppercase mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Confirm the new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3.5 rounded-2xl outline-none focus:border-brandNavy transition-all bg-gray-50/50 text-[15px]"
                />
              </div>

              {resetStatus.message && (
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  resetStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {resetStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={!resetEmail || !newPassword || !confirmPassword || resetLoading}
                className={`w-full py-4 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg ${!resetEmail || !newPassword || !confirmPassword || resetLoading
                    ? 'bg-[#B2C0D6] text-white cursor-not-allowed shadow-none'
                    : role === 'vendor'
                      ? 'bg-brandRed hover:bg-[#C2112C] text-white hover:shadow-brandRed/30'
                      : 'bg-brandNavy hover:bg-brandDarkNavy text-white hover:shadow-brandNavy/30'
                  }`}
              >
                <span>{resetLoading ? 'Resetting...' : 'Reset Password'}</span>
                {!resetLoading && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5A2.25 2.25 0 0 0 19.5 19.5v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        )}
          </div>
        </div>

      </div>

      {/* 3. SCREEN: ANIMATING BLOB (FULL SCREEN TRANSITION & SUCCESS) */}
      {screen === 'animating_blob' && (
        <BlobTransition
          selectedSubRole={role}
          loggedUser={loggedUser}
          onComplete={handleBlobComplete}
        />
      )}
    </div>
  );
};

export default LoginPage;
