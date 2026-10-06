import React, { useState, useMemo } from 'react';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import CampusMap from './components/map/CampusMap';
import GuideMePanel from './components/navigation/GuideMePanel';
import LocationSearch from './components/locations/LocationSearch';
import LocationList from './components/locations/LocationList';
import LocationModal from './components/locations/LocationModal';
import EmergencyModal from './components/modes/EmergencyModal';
import FresherMode from './components/modes/FresherMode';
import CampusMateChat from './components/assistant/CampusMateChat';

import { CAMPUS_LOCATIONS, BUILDINGS } from './data/campusLocations';
import { calculateRoute } from './utils/router';
import { matchesLocationQuery } from './utils/searchHelper';

import { 
  Compass, 
  Navigation, 
  Bot, 
  MapPin, 
  ShieldAlert, 
  Accessibility, 
  Sparkles, 
  Search,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  HeartPulse,
  Flame,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'guide', 'places', 'assistant'
  const [selectedLocation, setSelectedLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [originLocation, setOriginLocation] = useState(CAMPUS_LOCATIONS.find(l => l.id === 'gate-1') || CAMPUS_LOCATIONS[0]);
  const [activeRoute, setActiveRoute] = useState(() => 
    calculateRoute('gate-1', 'cs-102', { wheelchair: false, emergency: false })
  );

  // Modes State
  const [wheelchairMode, setWheelchairMode] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isFresherModalOpen, setIsFresherModalOpen] = useState(false);
  const [detailModalLocation, setDetailModalLocation] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentFloorFilter, setCurrentFloorFilter] = useState('all');

  // Filtered locations memo
  const filteredLocations = useMemo(() => {
    const hasSearchQuery = Boolean(searchQuery.trim());
    return CAMPUS_LOCATIONS.filter(loc => {
      // 1. Intelligent Query Filter (Name, Code, Aliases, Building, Category)
      if (hasSearchQuery) {
        if (!matchesLocationQuery(loc, searchQuery)) {
          return false;
        }
      }

      // 2. Category Filter
      // If user is searching a query that explicitly matches this location, don't hide it due to previous category filter
      if (selectedCategory !== 'all') {
        if (!hasSearchQuery && loc.category !== selectedCategory) {
          return false;
        }
      }

      // 3. Floor Filter
      if (currentFloorFilter !== 'all') {
        if (currentFloorFilter === 'ground' && loc.floorNumber !== 0) return false;
        if (currentFloorFilter === '1' && loc.floorNumber !== 1) return false;
        if (currentFloorFilter === '2' && loc.floorNumber !== 2) return false;
        if (currentFloorFilter === '3' && loc.floorNumber !== 3) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, currentFloorFilter]);

  // Popular locations list
  const popularLocations = useMemo(() => {
    return CAMPUS_LOCATIONS.filter(l => l.popularDestination);
  }, []);

  // Handlers
  const handleCalculateRoute = (originId, destId) => {
    const route = calculateRoute(originId, destId, {
      wheelchair: wheelchairMode,
      emergency: emergencyMode
    });
    setActiveRoute(route);
  };

  const handleSelectLocation = (loc) => {
    if (!loc) return;
    setSelectedLocation(loc);
    handleCalculateRoute(originLocation.id, loc.id);
  };

  const handleStartNavigation = (loc) => {
    if (!loc) return;
    setSelectedLocation(loc);
    handleCalculateRoute(originLocation.id, loc.id);
    setActiveTab('guide');
  };

  const handleSetAsOrigin = (loc) => {
    if (!loc) return;
    setOriginLocation(loc);
    if (selectedLocation) {
      handleCalculateRoute(loc.id, selectedLocation.id);
    }
  };

  const handleNavigateToEmergencyLocation = (targetLocId) => {
    const target = CAMPUS_LOCATIONS.find(l => l.id === targetLocId) || CAMPUS_LOCATIONS.find(l => l.id === 'med-101');
    if (target) {
      setSelectedLocation(target);
      setEmergencyMode(true);
      const route = calculateRoute(originLocation.id, target.id, {
        wheelchair: wheelchairMode,
        emergency: true
      });
      setActiveRoute(route);
      setActiveTab('map');
    }
  };

  const handleNavigateToFresherLocation = (targetLocId) => {
    const target = CAMPUS_LOCATIONS.find(l => l.id === targetLocId);
    if (target) {
      setSelectedLocation(target);
      handleCalculateRoute(originLocation.id, target.id);
      setActiveTab('guide');
    }
  };

  const handleToggleEmergencySOS = () => {
    setIsEmergencyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-white pb-16 md:pb-6">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wheelchairMode={wheelchairMode}
        setWheelchairMode={(val) => {
          setWheelchairMode(val);
          if (originLocation && selectedLocation) {
            handleCalculateRoute(originLocation.id, selectedLocation.id);
          }
        }}
        onOpenEmergency={handleToggleEmergencySOS}
        onOpenFresher={() => setIsFresherModalOpen(true)}
        totalLocationsCount={CAMPUS_LOCATIONS.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5">
        {/* Emergency Alert Banner if Emergency Mode is Active */}
        {emergencyMode && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border border-red-500/60 shadow-xl flex items-center justify-between gap-3 text-red-200 animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white uppercase tracking-wider">Active Emergency Route:</span>{' '}
                Routing directly to <strong>{selectedLocation?.name}</strong>. Keep emergency lanes clear.
              </div>
            </div>
            <button
              onClick={() => setEmergencyMode(false)}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors flex-shrink-0"
            >
              Exit SOS Mode
            </button>
          </div>
        )}

        {/* Live Campus Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Campus Coverage</p>
              <p className="text-sm font-bold text-white">25+ Mapped Locations</p>
            </div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Academic Blocks</p>
              <p className="text-sm font-bold text-white">6 Primary Complexes</p>
            </div>
          </div>

          <div 
            onClick={() => setWheelchairMode(!wheelchairMode)}
            className="cursor-pointer bg-slate-900/70 backdrop-blur-md border border-slate-800/80 p-3 rounded-2xl flex items-center gap-3 hover:border-emerald-500/40 transition-colors"
          >
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Accessibility className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Accessibility</p>
              <p className="text-sm font-bold text-emerald-300">100% Barrier-Free Ramps</p>
            </div>
          </div>

          <div 
            onClick={handleToggleEmergencySOS}
            className="cursor-pointer bg-slate-900/70 backdrop-blur-md border border-slate-800/80 p-3 rounded-2xl flex items-center gap-3 hover:border-red-500/40 transition-colors"
          >
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Emergency Health</p>
              <p className="text-sm font-bold text-rose-300">24/7 Clinic (MED-101)</p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: CAMPUS MAP & QUICK WAYFINDING                    */}
        {/* ======================================================== */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* Map Canvas (7 cols on Desktop) */}
            <div className="lg:col-span-8 flex flex-col min-h-[500px]">
              <CampusMap
                locations={CAMPUS_LOCATIONS}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                activeRoute={activeRoute}
                wheelchairMode={wheelchairMode}
                emergencyMode={emergencyMode}
                currentFloorFilter={currentFloorFilter}
                setCurrentFloorFilter={setCurrentFloorFilter}
                onStartNavigation={handleStartNavigation}
              />
            </div>

            {/* Quick Location Explorer & Inspector (4 cols on Desktop) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Search & Categories Box */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
                <LocationSearch
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onQuickSelect={handleSelectLocation}
                  popularLocations={popularLocations}
                  searchResults={filteredLocations}
                  onStartNavigation={handleStartNavigation}
                />
              </div>

              {/* Selected Location Card */}
              {selectedLocation && (
                <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4.5 shadow-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Room: {selectedLocation.code}
                    </span>
                    <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      Category: {selectedLocation.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedLocation.name}
                    </h3>
                    <div className="mt-1 space-y-1 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <p className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span><strong>Building:</strong> {selectedLocation.building} ({selectedLocation.block})</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span><strong>Floor:</strong> {selectedLocation.floor}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                    <strong className="text-slate-400">Landmarks:</strong> {selectedLocation.landmarks}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedLocation.wheelchairAccessible && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <Accessibility className="w-3 h-3" />
                        <span>Step-Free Access</span>
                      </span>
                    )}
                    {selectedLocation.facilities.slice(0, 3).map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setDetailModalLocation(selectedLocation)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-center"
                    >
                      Room Details
                    </button>
                    <button
                      onClick={() => handleStartNavigation(selectedLocation)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Route</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Academic Complexes Directory */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Campus Complexes</span>
                  <span className="text-[10px] text-cyan-400 font-mono">6 Blocks</span>
                </h4>

                <div className="space-y-2">
                  {BUILDINGS.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        const loc = CAMPUS_LOCATIONS.find(l => l.block === b.id);
                        if (loc) handleSelectLocation(loc);
                      }}
                      className="cursor-pointer p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: b.color }}
                        />
                        <div>
                          <p className="font-bold text-white">{b.name}</p>
                          <p className="text-[11px] text-slate-400">{b.departments.join(' • ')}</p>
                        </div>
                      </div>
                      <span className="text-slate-500 text-[10px] font-mono">{b.shortName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: GUIDE ME (Turn-by-Turn Stepper & Map Synced)      */}
        {/* ======================================================== */}
        {activeTab === 'guide' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* Guide Me Navigation Stepper (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <GuideMePanel
                locations={CAMPUS_LOCATIONS}
                activeRoute={activeRoute}
                onCalculateRoute={handleCalculateRoute}
                wheelchairMode={wheelchairMode}
                setWheelchairMode={(val) => {
                  setWheelchairMode(val);
                  if (activeRoute) {
                    handleCalculateRoute(activeRoute.origin.id, activeRoute.destination.id);
                  }
                }}
                selectedLocation={selectedLocation}
                onResetRoute={() => handleCalculateRoute('gate-1', 'cs-102')}
              />
            </div>

            {/* Live Map Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col min-h-[460px]">
              <CampusMap
                locations={CAMPUS_LOCATIONS}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                activeRoute={activeRoute}
                wheelchairMode={wheelchairMode}
                emergencyMode={emergencyMode}
                currentFloorFilter={currentFloorFilter}
                setCurrentFloorFilter={setCurrentFloorFilter}
                onStartNavigation={handleStartNavigation}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: FIND PLACES DIRECTORY                            */}
        {/* ======================================================== */}
        {activeTab === 'places' && (
          <div className="flex flex-col gap-5 flex-1">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Smart Campus Directory
                  </h2>
                  <p className="text-xs text-slate-400">
                    Showing {filteredLocations.length} locations across all campus zones
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Floor Filter:</span>
                  <select
                    value={currentFloorFilter}
                    onChange={(e) => setCurrentFloorFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="all">All Floors</option>
                    <option value="ground">Ground Floor</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                  </select>
                </div>
              </div>

              <LocationSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onQuickSelect={handleSelectLocation}
                popularLocations={popularLocations}
              />
            </div>

            <LocationList
              locations={filteredLocations}
              onSelectLocation={(loc) => setDetailModalLocation(loc)}
              onStartNavigation={handleStartNavigation}
              selectedLocation={selectedLocation}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: MATEAI COPILOT                                   */}
        {/* ======================================================== */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* Chat Assistant (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <CampusMateChat
                onStartNavigation={handleStartNavigation}
                onSelectLocation={(loc) => {
                  setSelectedLocation(loc);
                  setActiveTab('map');
                }}
                setWheelchairMode={setWheelchairMode}
                onOpenFresher={() => setIsFresherModalOpen(true)}
                onOpenEmergency={handleToggleEmergencySOS}
              />
            </div>

            {/* Quick Context & Features (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h3 className="text-sm font-bold text-white">What can MateAI do?</h3>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-semibold text-cyan-300">🎯 Exact Room Guidance</p>
                    <p className="text-slate-400 mt-0.5">Find any classroom code (e.g. CS-204, LH-101), lab, or professor office.</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-semibold text-emerald-300">♿ Barrier-Free Wayfinding</p>
                    <p className="text-slate-400 mt-0.5">Calculates routes avoiding stairs, finding automatic doors & elevators.</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-semibold text-amber-300">☕ Food & Study Discovery</p>
                    <p className="text-slate-400 mt-0.5">Find quiet study pods with power outlets, printing shops, or fresh coffee.</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p className="font-semibold text-rose-300">🚨 Immediate Emergency Help</p>
                    <p className="text-slate-400 mt-0.5">Instant dispatch to Campus Health Clinic, Security Post, and Fire Exits.</p>
                  </div>
                </div>
              </div>

              {/* Mini Map Snapshot */}
              <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Explore Interactive Map</h4>
                    <p className="text-[11px] text-slate-400">View live campus schematic with floor filters</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('map')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all border border-cyan-500/30"
                >
                  <span>Open Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFresher={() => setIsFresherModalOpen(true)}
      />

      {/* Modal 1: Location Room Inspector */}
      {detailModalLocation && (
        <LocationModal
          location={detailModalLocation}
          onClose={() => setDetailModalLocation(null)}
          onStartNavigation={handleStartNavigation}
          onSetAsOrigin={handleSetAsOrigin}
        />
      )}

      {/* Modal 2: Emergency SOS HUD */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onNavigateToLocation={handleNavigateToEmergencyLocation}
      />

      {/* Modal 3: "I'm New Here" Fresher Guide */}
      <FresherMode
        isOpen={isFresherModalOpen}
        onClose={() => setIsFresherModalOpen(false)}
        onNavigateToLocation={handleNavigateToFresherLocation}
      />
    </div>
  );
}
