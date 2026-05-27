import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { RoleContext } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';
import BlobTransition from '../components/BlobTransition';
import relianceLogo from '../assets/reliance_logo.png';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
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
      title: 'Vendor User',
      desc: 'Who can raise tickets, track status',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      )
    }
  ];

  // States
  const [screen, setScreen] = useState('role_selection'); // role_selection, login_form, animating_blob, success_screen
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedUser, setLoggedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0); // For triggering slide-up animations

  // Reset email/password when role changes
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, [role]);

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
  };

  const handleContinue = () => {
    if (!role) return;
    setFormKey(prev => prev + 1);
    setScreen('login_form');
  };

  const handleBack = () => {
    setScreen('role_selection');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) return;

    setScreen('animating_blob');
    setLoading(true);

    try {
      // Execute the existing AuthContext login call
      const user = await login(email, password);
      // Save user profile for success screen
      setLoggedUser(user);
      setSelectedSubRole(role); // Store selected UI role in lightweight context
    } catch (error) {
      setScreen('login_form');
      setLoading(false);
      alert('Invalid Credentials');
    }
  };

  const handleBlobComplete = () => {
    // If login has completed successfully, go to success screen
    if (loggedUser) {
      setScreen('success_screen');
    } else {
      // In the rare case that the animation finished but the API call is still pending,
      // the API will update the screen state to 'success_screen' once done.
      // We keep a small listener here just in case.
    }
  };

  // Redirect after success screen completes (2 seconds progress bar fill)
  useEffect(() => {
    if (screen === 'success_screen' && loggedUser) {
      const timer = setTimeout(() => {
        if (loggedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen, loggedUser, navigate]);

  const getRoleTitle = (roleId) => {
    const r = roles.find(x => x.id === roleId);
    return r ? r.title : '';
  };

  return (
    <div className="min-h-screen flex bg-brandBg font-dmSans overflow-hidden relative">
      {/* ----------------- LEFT PANEL ----------------- */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-gradient-to-b from-brandNavy to-brandDarkNavy text-white p-12 flex-col justify-between relative overflow-hidden z-10 shadow-2xl">
        {/* Floating Animated Background Rings */}
        <div className="absolute top-12 -right-16 w-80 h-80 rounded-full border border-white/5 pointer-events-none animate-float-ring-1" />
        <div className="absolute -bottom-24 -left-12 w-[450px] h-[450px] rounded-full border border-white/5 pointer-events-none animate-float-ring-2" />

        {/* Top Branding Section */}
        <div className="relative z-10">
          <div className="flex flex-col space-y-2 mb-10">
            {/* Reliance Retail Logo */}
            <img 
              src={relianceLogo} 
              alt="Reliance Retail Logo" 
              className="h-12 w-auto object-contain self-start brightness-0 invert" 
            />
            <p className="text-[10px] uppercase font-sora tracking-widest text-brandMuted">Query Management System</p>
          </div>

          {/* Headline & Subtitle */}
          <div className="mt-8 space-y-4">
            <h1 className="text-4xl font-extrabold font-sora leading-tight">
              Manage Retail <span className="text-[#E31837]"> Queries </span> Efficiently.
            </h1>
            <p className="text-sm text-brandMuted leading-relaxed">
                Raise, track, manage, and resolve vendor queries efficiently through one centralized platform.
            </p>
          </div>

          {/* Features Checklist */}
          <ul className="mt-12 space-y-5 text-sm font-medium">
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-[#E31837] shadow-lg shadow-brandRed/50 shrink-0"></span>
              <span className="text-gray-200">Centralized Vendor Query Management.</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-[#E31837] shadow-lg shadow-brandRed/50 shrink-0"></span>
              <span className="text-gray-200">End-to-End Workflow & Status Tracking.</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-[#E31837] shadow-lg shadow-brandRed/50 shrink-0"></span>
              <span className="text-gray-200">Real-time ticket tracking & resolution.</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-[#E31837] shadow-lg shadow-brandRed/50 shrink-0"></span>
              <span className="text-gray-200">Analytics-Driven Operational Decisions.</span>
            </li>
          </ul>
        </div>

        {/* Security Badge Footer */}
        <div className="relative z-10 flex items-center space-x-2 text-[11px] text-brandMuted bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-[#E31837]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <span>Streamlining Vendor Support & Operations</span>
        </div>
      </div>

      {/* ----------------- RIGHT PANEL & TRANSITIONS ----------------- */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-white z-0">
        
        {/* BACKGROUND ACCENT SHAPE */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#F3F5FB]/30 rounded-bl-[100px] pointer-events-none -z-10" />

        {/* 1. SCREEN: ROLE SELECTION */}
        {screen === 'role_selection' && (
          <div className="w-full max-w-[450px] animate-slide-up-fade">
            <h2 className="text-4xl font-extrabold text-brandDarkNavy tracking-tight mb-2 font-sora">
              Welcome 
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Select your role to continue
            </p>

            {/* Role Card Tiles */}
            <div className="space-y-4 mb-8">
              {roles.map((item) => {
                const isSelected = role === item.id;
                let activeBorder = 'border-brandNavy';
                let activeBg = 'bg-brandNavy/[0.02]';
                
                if (item.id === 'vendor') {
                  activeBorder = 'border-brandRed';
                  activeBg = 'bg-brandRed/[0.02]';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleRoleSelect(item.id)}
                    className={`relative flex items-center justify-between border rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? `${activeBorder} ${activeBg} shadow-md`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Left Accent Bar */}
                    {isSelected && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                          item.id === 'vendor' ? 'bg-brandRed' : 'bg-brandNavy'
                        }`}
                      />
                    )}

                    <div className="flex items-center space-x-4 pl-1">
                      {/* Role Icon Container */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                          isSelected
                            ? item.id === 'vendor'
                              ? 'bg-brandRed/10 text-brandRed'
                              : 'bg-brandNavy/10 text-brandNavy'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.icon}
                      </div>
                      
                      {/* Description */}
                      <div className="text-left">
                        <h3 className={`font-bold text-[16px] font-sora ${isSelected ? 'text-brandDarkNavy' : 'text-gray-700'}`}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className={`transition-all duration-300 ${isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={`w-4 h-4 ${role === 'vendor' ? 'text-brandRed' : 'text-brandNavy'}`}>
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
              className={`w-full py-4 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg ${
                !role
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
            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              <span>Intelligent Support Management System</span>
            </div>
          </div>
        )}

        {/* 2. SCREEN: LOGIN FORM */}
        {screen === 'login_form' && (
          <div key={`form-${formKey}`} className="w-full max-w-[450px] animate-slide-up-fade">
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
            <div className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 border ${
              role === 'vendor'
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
                className={`w-full py-4 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg ${
                  !email || !password
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
              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                className="text-xs font-semibold text-brandNavy hover:text-brandDarkNavy transition-colors hover:underline"
              >
                Forgot your password?
              </a>
            </div>
          </div>
        )}

        {/* 3. SCREEN: ANIMATING BLOB */}
        {screen === 'animating_blob' && (
          <BlobTransition
            selectedSubRole={role}
            loggedUser={loggedUser}
            onComplete={handleBlobComplete}
          />
        )}

        {/* 4. SCREEN: SUCCESS SCREEN */}
        {screen === 'success_screen' && loggedUser && (
          <div className="w-full max-w-[450px] flex flex-col items-center justify-center text-center animate-slide-up-fade">
            {/* 5 Colored Bouncing Dots */}
            <div className="flex space-x-2.5 mb-10">
              <span className="w-3.5 h-3.5 rounded-full bg-brandRed dot-bounce-delay-1 shadow-md shadow-brandRed/20" />
              <span className="w-3.5 h-3.5 rounded-full bg-brandNavy dot-bounce-delay-2 shadow-md shadow-brandNavy/20" />
              <span className="w-3.5 h-3.5 rounded-full bg-brandGold dot-bounce-delay-3 shadow-md shadow-brandGold/20" />
              <span className="w-3.5 h-3.5 rounded-full bg-brandRed dot-bounce-delay-4 shadow-md shadow-brandRed/20" />
              <span className="w-3.5 h-3.5 rounded-full bg-brandNavy dot-bounce-delay-5 shadow-md shadow-brandNavy/20" />
            </div>

            {/* Green Tick Circle */}
            <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-8 animate-scale-in">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-emerald-600">
                <path
                  d="M20 50 L42 72 L80 30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-check"
                />
              </svg>
            </div>

            {/* Headings */}
            <h2 className="text-4xl font-extrabold text-brandNavy font-sora mb-3">
              You're in!
            </h2>
            <p className="text-gray-500 text-sm mb-1.5">
              Successfully authenticated as
            </p>
            <p className="text-brandNavy font-bold font-sora text-[15px] mb-12">
              {loggedUser.email}
            </p>

            {/* Bottom Progress Bar & Redirect Info */}
            <div className="w-64">
              <p className="text-[11px] text-gray-400 font-medium mb-3">
                Redirecting to dashboard...
              </p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brandNavy rounded-full animate-fill-progress" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginPage;