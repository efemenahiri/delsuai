import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  MessageSquare,
  Info,
  Search,
  Navigation,
  Menu,
  X,
  School,
  ArrowRight,
  Sun,
  Moon,
  LogIn,
  LogOut,
  MailCheck,
  ExternalLink,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';
import { Location, Message, User } from './types';
import { DELSU_LOCATIONS } from './data/locations';
import { getCampusAssistance } from './services/gemini';
import { authService } from './services/auth';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  "Where is the Senate Building?",
  "Tell me about DELSU history",
  "Which campus has the Faculty of Law?",
  "Find Site 3 locations",
];

// Helper Component for Sidebar Items
const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active
      ? 'bg-blue-600 text-white shadow-lg'
      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const App: React.FC = () => {
  // NAVIGATION & UI STATE
  const [activeTab, setActiveTab] = useState<'map' | 'assistant' | 'academic'>('assistant');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const userMarkerRef = useRef<any>(null);

  // CHAT STATE
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // AUTH STATE
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [authFormData, setAuthFormData] = useState({ fullName: '', email: '', password: '', role: 'student', token: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // GOOGLE MAPS REFS
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Switch Auth Modes & Reset Errors
  const switchAuthMode = (mode: 'login' | 'signup' | 'forgot' | 'reset') => {
    setAuthMode(mode);
    setAuthError('');
    setAuthSuccess('');
    setShowPassword(false);
  };

  // Initialize Dark / Light Theme
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Scroll Chat to Bottom on New Message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Search Outside Clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- GOOGLE MAPS INITIALIZATION ---
  useEffect(() => {
    const google = (window as any).google;

    if (mapContainerRef.current && !googleMapInstance.current && google?.maps) {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 5.7952, lng: 6.1068 },
        zoom: 16,
        disableDefaultUI: true, // Clean clutter-free UI for mobile
        zoomControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
      });

      googleMapInstance.current = map;

      if (selectedLocation) {
        const marker = new google.maps.Marker({
          position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          map,
          title: selectedLocation.name,
          animation: google.maps.Animation.DROP,
        });

        markersRef.current.push(marker);
        map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        map.setZoom(18);
      }

      setMapLoaded(true);
    }
  }, [selectedLocation]);

  // Resize calculation when switching to map tab
  useEffect(() => {
    if (activeTab === 'map' && googleMapInstance.current) {
      const google = (window as any).google;
      if (google?.maps) {
        google.maps.event.trigger(googleMapInstance.current, 'resize');
        if (selectedLocation) {
          googleMapInstance.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        }
      }
    }
  }, [activeTab]);

  // Pan to Selected Location
  useEffect(() => {
    if (googleMapInstance.current && selectedLocation) {
      googleMapInstance.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      googleMapInstance.current.setZoom(18);
    }
  }, [selectedLocation]);

  // Get user's current GPS position
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Location services are not supported by this browser.');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(location);
        setLocationLoading(false);

        if (googleMapInstance.current) {
          googleMapInstance.current.panTo(location);
          googleMapInstance.current.setZoom(18);
        }
      },
      () => {
        setLocationLoading(false);
        alert('Please enable location permissions in your browser settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Render User GPS Marker
  useEffect(() => {
    if (!googleMapInstance.current || !userLocation) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    userMarkerRef.current = new google.maps.Marker({
      position: userLocation,
      map: googleMapInstance.current,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      zIndex: 1000,
    });

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
    };
  }, [userLocation, mapLoaded]);

  // Handle Custom Map Zoom
  const handleZoom = (direction: 'in' | 'out') => {
    if (!googleMapInstance.current) return;
    const currentZoom = googleMapInstance.current.getZoom();
    googleMapInstance.current.setZoom(direction === 'in' ? currentZoom + 1 : currentZoom - 1);
  };

  // Turn-by-turn Navigation in External Google Maps
  const handleOpenExternalGoogleMaps = (location: Location) => {
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&travelmode=walking&dir_action=navigate`;

    if (userLocation) {
      mapsUrl += `&origin=${userLocation.lat},${userLocation.lng}`;
    }

    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Auth Form Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const response = await authService.login(authFormData.email, authFormData.password);
        setCurrentUser(response.user);
        setIsAuthModalOpen(false);
      } else if (authMode === 'signup') {
        const response = await authService.register(authFormData.fullName, authFormData.email, authFormData.password, authFormData.role);
        setCurrentUser(response.user);
        setIsAuthModalOpen(false);
      } else if (authMode === 'forgot') {
        await authService.forgotPassword(authFormData.email);
        setAuthSuccess('Reset link sent to your email.');
      } else if (authMode === 'reset') {
        await authService.resetPassword(authFormData.token, authFormData.password);
        setAuthSuccess('Password updated successfully! You can now login.');
        setTimeout(() => switchAuthMode('login'), 2000);
      }

      if (authMode !== 'reset' && authMode !== 'forgot') {
        setAuthFormData({ fullName: '', email: '', password: '', role: 'student', token: '' });
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Send Chat Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setActiveTab('assistant');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setSearchQuery('');
    setShowSearchSuggestions(false);
    setIsLoading(true);

    try {
      const response = await getCampusAssistance(userMsg.content, messages.slice(-5));
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
        locationId: response.suggestedLocationId
      };

      setMessages(prev => [...prev, aiMsg]);

      if (response.suggestedLocationId) {
        const found = DELSU_LOCATIONS.find(l => l.id === response.suggestedLocationId);
        if (found) setSelectedLocation(found);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: 'err',
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting to the campus grid. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLocations = searchQuery.trim()
    ? DELSU_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 5)
    : [];

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      {/* IMPROVED AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            {/* Header Branding */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
              <button
                onClick={() => { setIsAuthModalOpen(false); setAuthError(''); setAuthSuccess(''); }}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3">
                <Navigation size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {authMode === 'login' && 'Welcome Back'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'Set New Password'}
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                {authMode === 'login' && 'Sign in to access your DELSU campus guide & saved routes'}
                {authMode === 'signup' && 'Join DelsuAI to get personalized campus assistance'}
                {authMode === 'forgot' && 'Enter your campus email to receive a password reset link'}
                {authMode === 'reset' && 'Enter your reset token and new secure password'}
              </p>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Full Name (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm text-slate-800"
                      placeholder="Your full name"
                      value={authFormData.fullName}
                      onChange={(e) => setAuthFormData({ ...authFormData, fullName: e.target.value })}
                    />
                  </div>
                )}

                {/* Role Selector (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthFormData({ ...authFormData, role: 'student' })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${authFormData.role === 'student'
                          ? 'bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthFormData({ ...authFormData, role: 'staff' })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${authFormData.role === 'staff'
                          ? 'bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        Staff / Lecturer
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Input */}
                {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campus Email</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm text-slate-800"
                      placeholder="email@delsu.edu.ng"
                      value={authFormData.email}
                      onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    />
                  </div>
                )}

                {/* Password Input */}
                {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchAuthMode('forgot')}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm text-slate-800"
                        placeholder="••••••••"
                        value={authFormData.password}
                        onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Token Input for Reset */}
                {authMode === 'reset' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Reset Token</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm text-slate-800"
                      placeholder="Enter reset token"
                      value={authFormData.token}
                      onChange={(e) => setAuthFormData({ ...authFormData, token: e.target.value })}
                    />
                  </div>
                )}

                {/* Error Banner */}
                {authError && (
                  <div className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 p-3 rounded-xl">
                    ⚠️ {authError}
                  </div>
                )}

                {/* Success Banner */}
                {authSuccess && (
                  <div className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2">
                    <MailCheck size={16} />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {/* Action Button */}
                <button
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 text-sm mt-2"
                >
                  {isLoading
                    ? 'Processing...'
                    : authMode === 'login'
                      ? 'Sign In'
                      : authMode === 'signup'
                        ? 'Create Account'
                        : authMode === 'forgot'
                          ? 'Send Reset Link'
                          : 'Update Password'}
                </button>
              </form>

              {/* Toggle Routes */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                {authMode === 'login' && (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode('signup')}
                      className="font-bold text-blue-600 hover:underline ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
                {authMode === 'signup' && (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchAuthMode('login')}
                      className="font-bold text-blue-600 hover:underline ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                )}
                {(authMode === 'forgot' || authMode === 'reset') && (
                  <button
                    type="button"
                    onClick={() => switchAuthMode('login')}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Navigation size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">DelsuAI</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Campus Guide</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</div>
            <SidebarItem
              icon={MessageSquare}
              label="AI Assistant"
              active={activeTab === 'assistant'}
              onClick={() => { setActiveTab('assistant'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={MapPin}
              label="Campus Map"
              active={activeTab === 'map'}
              onClick={() => { setActiveTab('map'); setIsSidebarOpen(false); }}
            />

            <div className="pt-6 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Project Info</div>
            <SidebarItem
              icon={Info}
              label="Academic Docs"
              active={activeTab === 'academic'}
              onClick={() => { setActiveTab('academic'); setIsSidebarOpen(false); }}
            />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-blue-700 mb-1">
                <School size={16} />
                <span className="text-sm font-semibold">DELSU Abraka</span>
              </div>
              <p className="text-xs text-blue-600/80 leading-relaxed">
                Empowering campus mobility through AI. Final Year Project © 2026
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {/* Header - Configured with Mobile Safe Padding */}
        <header className="pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 max-w-xl mx-auto px-4 lg:block hidden relative" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search campus locations..."
                className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl py-2 pl-10 pr-4 text-sm transition-all outline-none"
                value={searchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(searchQuery)}
              />
            </div>

            {/* Search Suggestions Dropdown */}
            {showSearchSuggestions && searchQuery.trim() && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="p-2">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setActiveTab('map');
                          setShowSearchSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{loc.name}</div>
                            <div className="text-xs text-slate-500">{loc.category}</div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-slate-300" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-500">No exact location matches.</p>
                      <button
                        onClick={() => handleSendMessage(searchQuery)}
                        className="mt-2 text-blue-600 text-xs font-bold hover:underline"
                      >
                        Ask DelsuAI instead?
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">{currentUser.fullName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{currentUser.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { switchAuthMode('login'); setIsAuthModalOpen(true); }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
              >
                <LogIn size={18} />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {/* AI ASSISTANT TAB */}
          <div className={`h-full flex flex-col ${activeTab === 'assistant' ? 'block' : 'hidden'}`}>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Navigation size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                      Welcome to DelsuAI Campus Guide
                    </h2>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
                      Ask anything about Delta State University (Abraka) campuses, faculties, administrative blocks, or historical details.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                      {SUGGESTIONS.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(suggestion)}
                          className="p-3 text-left text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all flex items-center justify-between group"
                        >
                          <span>{suggestion}</span>
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-800 border-slate-100'}`}>
                      <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'prose prose-sm max-w-none text-slate-800'}`}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        )}
                      </div>
                      {msg.locationId && (
                        <button
                          onClick={() => {
                            const loc = DELSU_LOCATIONS.find(l => l.id === msg.locationId);
                            if (loc) {
                              setSelectedLocation(loc);
                              setActiveTab('map');
                            }
                          }}
                          className={`mt-3 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors ${msg.role === 'user' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          <MapPin size={14} />
                          <span>View on Map</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Form */}
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white border-t border-slate-200">
              <div className="max-w-3xl mx-auto flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask DelsuAI about campus locations or history..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                  className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                />
                <button
                  onClick={() => handleSendMessage(chatInput)}
                  disabled={!chatInput.trim() || isLoading}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* CAMPUS MAP TAB */}
          <div className={`h-full relative ${activeTab === 'map' ? 'block' : 'hidden'}`}>
            <div ref={mapContainerRef} className="w-full h-full bg-slate-200" />

            {/* Map Controls */}
            <div className="absolute right-4 top-4 flex flex-col space-y-2 z-10">
              <button
                onClick={() => handleZoom('in')}
                className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={getUserLocation}
                disabled={locationLoading}
                className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-slate-50 transition-colors"
                title="Current Position"
              >
                <Navigation size={18} className={locationLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Selected Location Card Overlay */}
            {selectedLocation && (
              <div className="absolute bottom-6 left-4 right-4 max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {selectedLocation.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedLocation.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{selectedLocation.description}</p>
                <button
                  onClick={() => handleOpenExternalGoogleMaps(selectedLocation)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <span>Start Walking Directions</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ACADEMIC DOCS TAB */}
          <div className={`h-full overflow-y-auto p-6 ${activeTab === 'academic' ? 'block' : 'hidden'}`}>
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Project Documentation</h2>
                <p className="text-xs text-slate-500 mt-1">DelsuAI: Intelligent Campus Navigation & Assistance Framework</p>
              </div>
              <div className="prose prose-slate max-w-none text-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Abstract</h3>
                <p className="text-slate-600 leading-relaxed">
                  Navigating the complex physical layouts of multi-campus institutions like Delta State University (DELSU), Abraka, often poses challenges to new students, visitors, and academic staff. DelsuAI integrates modern conversational AI with precise geospatial visualization tools to deliver real-time campus assistance.
                </p>
                <h3 className="text-lg font-bold text-slate-800">Architecture Overview</h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>Frontend Architecture:</strong> Modular React TypeScript application styled with Tailwind CSS and enhanced with Lucide icons.</li>
                  <li><strong>Intelligence Layer:</strong> Powered by the Gemini API for natural language understanding and instant conversational intent extraction.</li>
                  <li><strong>Geospatial Engine:</strong> Custom Google Maps API integration mapping DELSU landmarks, faculties, administrative hubs, and residential zones.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;