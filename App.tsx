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
  Minus
} from 'lucide-react';
import { Location, Message, User } from './types';
import { DELSU_LOCATIONS } from './data/locations';
import { getCampusAssistance } from './services/gemini';
import { authService } from './services/auth';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am DelsuAI, your campus guide. How can I help you navigate DELSU today?',
      timestamp: Date.now()
    }
  ]);
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

  // GOOGLE MAPS REFS
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
        setTimeout(() => setAuthMode('login'), 2000);
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {authMode === 'login' && 'Welcome Back'}
                  {authMode === 'signup' && 'Join DelsuAI'}
                  {authMode === 'forgot' && 'Reset Password'}
                  {authMode === 'reset' && 'Create New Password'}
                </h2>
                <button
                  onClick={() => { setIsAuthModalOpen(false); setAuthError(''); setAuthSuccess(''); }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="e.g. John Doe"
                      value={authFormData.fullName}
                      onChange={(e) => setAuthFormData({ ...authFormData, fullName: e.target.value })}
                    />
                  </div>
                )}

                {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Campus Email</label>
                    <input
                      required
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="email@delsu.edu.ng"
                      value={authFormData.email}
                      onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    />
                  </div>
                )}

                {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                    <input
                      required
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                      placeholder="••••••••"
                      value={authFormData.password}
                      onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                    />
                  </div>
                )}

                {authError && <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg">{authError}</div>}
                {authSuccess && (
                  <div className="text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-lg flex items-center gap-2">
                    <MailCheck size={16} />
                    {authSuccess}
                  </div>
                )}

                <button
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
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
                Empowering campus mobility through AI. Final Year Project © 2024
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {/* Header - Configured with Mobile Safe Padding */}
        <header className="h-16 pt-2 pb-2 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
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
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
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
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-800 border-slate-100'}`}>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content.replace(/\*\*/g, '')}
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
                          className={`mt-3 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors ${msg.role === 'user' ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          <MapPin size={14} />
                          <span>View on Map</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(chatInput);
                }}
                className="max-w-3xl mx-auto flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask DelsuAI for campus assistance..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* CAMPUS MAP TAB */}
          <div className={`h-full flex flex-col md:flex-row relative ${activeTab === 'map' ? 'block' : 'hidden'}`}>
            <div className="flex-1 relative h-full">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Top Controls Overlay */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                <button
                  onClick={getUserLocation}
                  className="bg-white/90 backdrop-blur-md shadow-lg text-slate-700 font-bold py-2.5 px-4 rounded-xl flex items-center space-x-2 text-xs hover:bg-white transition-all border border-slate-200"
                >
                  <Navigation size={16} className="text-blue-600" />
                  <span>{locationLoading ? 'Locating...' : 'My Location'}</span>
                </button>
              </div>

              {/* Custom Clean Zoom Buttons for Mobile */}
              <div className="absolute bottom-6 right-4 flex flex-col space-y-2 z-10">
                <button
                  onClick={() => handleZoom('in')}
                  className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => handleZoom('out')}
                  className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>

            {/* Selected Location Details Panel */}
            {selectedLocation && (
              <div className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col space-y-4">
                <h3 className="text-lg font-bold text-slate-900">{selectedLocation.name}</h3>
                <p className="text-sm text-slate-600">{selectedLocation.description}</p>
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-500 uppercase">Location Coordinates</p>
                  <p className="font-mono text-slate-800">Lat: {selectedLocation.lat} Lng: {selectedLocation.lng}</p>
                </div>
                <button
                  onClick={() => handleOpenExternalGoogleMaps(selectedLocation)}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <Navigation size={18} />
                  <span>Navigate in Google Maps</span>
                  <ExternalLink size={14} className="opacity-80" />
                </button>
              </div>
            )}
          </div>

          {/* ACADEMIC DOCS TAB */}
          <div className={`p-8 max-w-4xl mx-auto space-y-4 ${activeTab === 'academic' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold text-slate-900">Academic Docs</h2>
            <p className="text-slate-600">DELSU Abraka Intelligent Campus Guidance Platform Documentation.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;