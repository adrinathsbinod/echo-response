import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Activity, Map as MapIcon, RadioReceiver, ShieldAlert, Cpu,
  Search, Filter, ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react';

// --- DATA & CONSTANTS ---
const START_TIME = new Date().getTime();
const ZONES = ['A1', 'A2', 'B1', 'B2', 'B7', 'C3', 'D4', 'D5', 'E1', 'F9'];
const SIGNAL_TYPES = ['Acoustic', 'RF Probe', 'Thermal', 'Ultrasonic'];

const PRE_WRITTEN_MESSAGES = [
  "Node N-047 detected rhythmic tapping — confidence 91% — Grid B7",
  "NTN satellite link rerouted through LEO-3",
  "Thermal anomaly flagged — Zone D4 — possible survivor",
  "Voltage drop detected on Backbone Relay M-12",
  "UAV sweep initiated over Sector C3",
  "Ultrasonic ping returned anomalous density in Block F9",
  "Intermittent packet loss on Edge Cluster 2",
  "Acoustic triangulated: human voice patterns — Grid A2",
  "Structural shift detected via accelerometer array",
  "Mesh heal algorithm successfully bypassed failed node N-102",
  "Survivor beacon S-11 active, low battery warning",
  "Deploying spotter drone to Sector E1"
];

const SYSTEM_LOG_MESSAGES = [
  "Mesh backbone latency nominal (42ms)",
  "Satellite handoff completed: LEO-2 -> LEO-3",
  "Battery warning: Node N-089 below 15%",
  "Edge AI node #4 retraining completed",
  "Routing table updated (1240 routes)",
  "Telemetry sync successful",
  "Warning: RF interference detected on band 4",
  "Auto-healing network topology..."
];

const generateInitialNodes = () => {
  const nodes = [];
  for (let i = 1; i <= 158; i++) {
    let status = 'online';
    if (i <= 5) status = 'offline';
    else if (i <= 16) status = 'degraded';

    nodes.push({
      id: `N-${i.toString().padStart(3, '0')}`,
      status,
      battery: Math.floor(Math.random() * 60) + 20 + (status === 'online' ? 20 : 0),
      lastSignal: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
      confidence: Math.floor(Math.random() * 60) + 40,
      uptime: Math.floor(Math.random() * 200) + 10,
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      lat: 9.9312 + (Math.random() - 0.5) * 0.08,
      lng: 76.2673 + (Math.random() - 0.5) * 0.08,
      history: Array.from({ length: 10 }, () => Math.floor(Math.random() * 40) + 50)
    });
  }
  return nodes;
};

const generateInitialSurvivorSignals = () => {
  return Array.from({ length: 31 }, (_, i) => ({
    id: `SIG-${1000 + i}`,
    time: new Date(Date.now() - Math.random() * 10000000).toISOString(),
    nodeId: `N-${Math.floor(Math.random() * 158).toString().padStart(3, '0')}`,
    method: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
    confidence: Math.floor(Math.random() * 50) + 50,
    grid: ZONES[Math.floor(Math.random() * ZONES.length)],
    status: Math.random() > 0.8 ? 'High Priority' : Math.random() > 0.5 ? 'Relayed to Rescue' : 'Unconfirmed'
  })).sort((a, b) => b.confidence - a.confidence);
};

const SUBSYSTEMS = [
  'Telemetry Aggregator', 'AI Vision Core', 'Mesh Routing Daemon',
  'Sat-Link Controller', 'Power Management Unit', 'Emergency Beacon Relay'
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  
  // Global States
  const [nodes, setNodes] = useState(generateInitialNodes());
  const [survivorSignals, setSurvivorSignals] = useState(generateInitialSurvivorSignals());
  const [eventFeed, setEventFeed] = useState([]);
  const [threatData, setThreatData] = useState(Array.from({ length: 20 }, (_, i) => ({
    time: i,
    smoke: Math.random() * 40 + 10,
    aftershock: Math.random() * 30 + 5,
    structure: Math.random() * 50 + 20
  })));
  const [systemLogs, setSystemLogs] = useState(Array.from({ length: 8 }, () => ({
    id: Math.random(),
    text: SYSTEM_LOG_MESSAGES[Math.floor(Math.random() * SYSTEM_LOG_MESSAGES.length)],
    time: new Date().toLocaleTimeString()
  })));

  // Simulation Effects
  useEffect(() => {
    // 1s Timer
    const timer = setInterval(() => setElapsed(Math.floor((new Date().getTime() - START_TIME) / 1000)), 1000);
    
    // 4s Event Feed
    const feedTimer = setInterval(() => {
      setEventFeed(prev => {
        const msg = PRE_WRITTEN_MESSAGES[Math.floor(Math.random() * PRE_WRITTEN_MESSAGES.length)];
        const newFeed = [...prev, { id: Math.random(), time: new Date().toLocaleTimeString(), text: msg }];
        return newFeed.slice(-50);
      });
    }, 4000);

    // 8s Survivor Signal count increment (by adding a new signal implicitly)
    // Wait, prompt says: "Survivor Signals (starts at 31, randomly increments by 1 every 8 seconds)"
    // AND "Survivor Log: A new simulated card animates in from the top every 12 seconds".
    // I'll combine these by just adding a signal every 8s, but the log page will just render the list.
    const signalTimer = setInterval(() => {
      setSurvivorSignals(prev => {
        const newSig = {
          id: `SIG-${Math.floor(Math.random()*10000)}`,
          time: new Date().toISOString(),
          nodeId: `N-${Math.floor(Math.random() * 158).toString().padStart(3, '0')}`,
          method: SIGNAL_TYPES[Math.floor(Math.random() * SIGNAL_TYPES.length)],
          confidence: Math.floor(Math.random() * 40) + 60,
          grid: ZONES[Math.floor(Math.random() * ZONES.length)],
          status: Math.random() > 0.8 ? 'High Priority' : 'Unconfirmed',
          isNew: true
        };
        const newList = [newSig, ...prev].sort((a, b) => b.confidence - a.confidence);
        return newList;
      });
    }, 8000);

    // 5s Threat Chart Shift
    const threatTimer = setInterval(() => {
      setThreatData(prev => {
        const next = [...prev.slice(1), {
          time: prev[prev.length - 1].time + 1,
          smoke: Math.max(0, prev[prev.length-1].smoke + (Math.random() - 0.5) * 10),
          aftershock: Math.max(0, prev[prev.length-1].aftershock + (Math.random() - 0.5) * 10),
          structure: Math.max(0, prev[prev.length-1].structure + (Math.random() - 0.5) * 10),
        }];
        return next;
      });
    }, 5000);

    // 6s System Logs
    const sysLogTimer = setInterval(() => {
      setSystemLogs(prev => {
        const next = [{
          id: Math.random(),
          text: SYSTEM_LOG_MESSAGES[Math.floor(Math.random() * SYSTEM_LOG_MESSAGES.length)],
          time: new Date().toLocaleTimeString()
        }, ...prev];
        return next.slice(0, 8);
      });
    }, 6000);

    // 30s Node Flip
    const nodeFlipTimer = setInterval(() => {
      setNodes(prev => {
        const next = [...prev];
        const onlineNodes = next.filter(n => n.status === 'online');
        if (onlineNodes.length > 0) {
          const target = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
          const idx = next.findIndex(n => n.id === target.id);
          next[idx] = { ...next[idx], status: 'degraded', battery: Math.max(5, next[idx].battery - 20) };
        }
        return next;
      });
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(feedTimer);
      clearInterval(signalTimer);
      clearInterval(threatTimer);
      clearInterval(sysLogTimer);
      clearInterval(nodeFlipTimer);
    };
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const tabs = [
    { name: 'Overview', icon: Activity },
    { name: 'Mesh Map', icon: MapIcon },
    { name: 'Node Intel', icon: Cpu },
    { name: 'Survivor Log', icon: RadioReceiver },
    { name: 'Threat Analysis', icon: ShieldAlert },
    { name: 'System Status', icon: Activity },
  ];

  return (
    <div className="min-h-screen flex flex-col font-share-tech text-text-gray bg-dark-ops relative">
      {/* Top Nav */}
      <header className="flex justify-between items-center px-6 py-3 border-b border-primary-blue/30 bg-dark-ops z-50">
        <div className="text-safe-teal font-barlow text-2xl font-bold tracking-wider">
          ECHO-RESPONSE // MESH MONITOR v2.4
        </div>
        <div className="flex space-x-6">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center space-x-2 pb-1 border-b-2 transition-colors ${
                  activeTab === idx ? 'border-primary-blue text-primary-blue' : 'border-transparent text-text-gray hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-barlow uppercase text-lg">{tab.name}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center space-x-2 text-critical-red font-bold">
          <div className="w-3 h-3 rounded-full bg-critical-red animate-pulse-glow"></div>
          <span>LIVE SIM</span>
        </div>
      </header>

      {/* Amber Banner */}
      <div className="bg-warning-amber/20 border-b border-warning-amber text-warning-amber px-6 py-2 flex items-center font-barlow text-xl tracking-wide z-40">
        <AlertTriangle className="mr-3" size={24} />
        <span>⚠ ACTIVE EVENT: MAGNITUDE 6.8 SEISMIC EVENT — DISTRICT 7, KOCHI URBAN ZONE — T+ {formatTime(elapsed)}</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-6 relative z-10">
        {activeTab === 0 && <OverviewTab nodes={nodes} signals={survivorSignals} feed={eventFeed} />}
        {activeTab === 1 && <MeshMapTab nodes={nodes} />}
        {activeTab === 2 && <NodeIntelTab nodes={nodes} />}
        {activeTab === 3 && <SurvivorLogTab signals={survivorSignals} />}
        {activeTab === 4 && <ThreatAnalysisTab threatData={threatData} />}
        {activeTab === 5 && <SystemStatusTab logs={systemLogs} />}
      </main>
    </div>
  );
}

// --- TABS ---

function OverviewTab({ nodes, signals, feed }) {
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const degradedCount = nodes.filter(n => n.status === 'degraded').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;
  
  const pieData = [
    { name: 'Online', value: onlineCount, color: '#00E5A0' },
    { name: 'Degraded', value: degradedCount, color: '#FFA500' },
    { name: 'Offline', value: offlineCount, color: '#FF3B3B' }
  ];

  const barData = [
    { name: 'Acoustic', count: 18 },
    { name: 'RF Probe', count: 11 },
    { name: 'Thermal', count: 6 },
    { name: 'Ultrasonic', count: 2 },
  ];

  const avgBattery = Math.round(nodes.reduce((acc, n) => acc + n.battery, 0) / nodes.length);
  const feedEndRef = useRef(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="panel p-4 flex flex-col items-center justify-center">
          <div className="font-barlow text-lg text-primary-blue">ACTIVE NODES</div>
          <div className="text-3xl font-bold">{onlineCount} / {nodes.length}</div>
        </div>
        <div className="panel p-4 flex flex-col items-center justify-center">
          <div className="font-barlow text-lg text-primary-blue">SURVIVOR SIGNALS</div>
          <div className="text-3xl font-bold text-safe-teal">{signals.length}</div>
        </div>
        <div className="panel p-4 flex flex-col items-center justify-center">
          <div className="font-barlow text-lg text-primary-blue">CRITICAL ZONES</div>
          <div className="text-3xl font-bold text-critical-red">4</div>
        </div>
        <div className="panel p-4 flex flex-col items-center justify-center">
          <div className="font-barlow text-lg text-primary-blue">MESH COVERAGE</div>
          <div className="text-3xl font-bold">{(onlineCount / nodes.length * 100).toFixed(1)}%</div>
        </div>
        <div className="panel p-4 flex flex-col items-center justify-center">
          <div className="font-barlow text-lg text-primary-blue">AVG NODE BATTERY</div>
          <div className="text-3xl font-bold text-warning-amber">{avgBattery}%</div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        <div className="panel p-4 flex flex-col overflow-hidden">
          <div className="font-barlow text-xl text-primary-blue border-b border-primary-blue/30 pb-2 mb-4">LIVE EVENT FEED</div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {feed.map((f) => (
              <div key={f.id} className="flex space-x-3 text-sm animate-[fadeIn_0.5s_ease-in-out]">
                <span className="text-primary-blue opacity-70">[{f.time}]</span>
                <span className="text-text-gray">{f.text}</span>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>
        </div>
        <div className="panel p-4 flex flex-col">
          <div className="font-barlow text-xl text-primary-blue border-b border-primary-blue/30 pb-2 mb-4">NETWORK HEALTH & TELEMETRY</div>
          <div className="flex-1 flex flex-col">
            <div className="h-1/2 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1C9BE6' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-3xl font-bold text-safe-teal">{onlineCount}</span>
                <span className="text-xs uppercase font-barlow">Online</span>
              </div>
            </div>
            <div className="h-1/2 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#C9D6E3" tick={{fontFamily: 'Share Tech Mono', fontSize: 12}} />
                  <YAxis stroke="#C9D6E3" tick={{fontFamily: 'Share Tech Mono', fontSize: 12}} />
                  <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1C9BE6' }} cursor={{fill: 'rgba(28,155,230,0.1)'}}/>
                  <Bar dataKey="count" fill="#1C9BE6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeshMapTab({ nodes }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.L || mapRef.current) return;
    
    const L = window.L;
    const map = L.map('mesh-map').setView([9.9312, 76.2673], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Render Danger Zone
    L.polygon([
      [9.94, 76.25],
      [9.95, 76.28],
      [9.92, 76.29],
      [9.91, 76.26]
    ], { color: '#FF3B3B', fillColor: '#FF3B3B', fillOpacity: 0.2, weight: 2 }).addTo(map);

    // Assembly Point
    L.circleMarker([9.90, 76.26], {
      radius: 12, color: '#1C9BE6', fillColor: '#1C9BE6', fillOpacity: 0.8, weight: 3
    }).addTo(map).bindPopup("Assembly Point Alpha");

    // Safe Corridor
    L.polyline([
      [9.90, 76.26], [9.91, 76.25], [9.93, 76.24], [9.95, 76.24]
    ], { color: '#00E5A0', dashArray: '5, 10', weight: 3 }).addTo(map);

    // Render Nodes
    nodes.forEach(node => {
      let color = node.status === 'online' ? '#00E5A0' : node.status === 'degraded' ? '#FFA500' : '#FF3B3B';
      L.circleMarker([node.lat, node.lng], {
        radius: 5, color, fillColor: color, fillOpacity: 0.7, weight: 1
      }).addTo(map).bindPopup(`
        <div style="font-family: 'Share Tech Mono', monospace; background: #070B14; color: #C9D6E3; padding: 5px;">
          <strong style="color: #1C9BE6">${node.id}</strong><br/>
          Status: <span style="color: ${color}">${node.status.toUpperCase()}</span><br/>
          Battery: ${node.battery}%<br/>
          Last Signal: ${node.lastSignal}<br/>
          Grid: ${node.zone}
        </div>
      `, { className: 'custom-popup' });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [nodes]);

  return (
    <div className="w-full h-full panel relative p-1 flex flex-col">
       <div id="mesh-map" className="w-full flex-1 z-0 rounded-sm"></div>
       <div className="absolute bottom-6 left-6 panel p-4 z-[400] text-sm">
         <div className="font-barlow text-primary-blue mb-2 text-lg">MAP LEGEND</div>
         <div className="flex items-center space-x-2 mb-1"><div className="w-3 h-3 rounded-full bg-safe-teal"></div><span>Node Online</span></div>
         <div className="flex items-center space-x-2 mb-1"><div className="w-3 h-3 rounded-full bg-warning-amber"></div><span>Node Degraded</span></div>
         <div className="flex items-center space-x-2 mb-1"><div className="w-3 h-3 rounded-full bg-critical-red"></div><span>Node Offline</span></div>
         <div className="flex items-center space-x-2 mb-1"><div className="w-3 h-3 border border-critical-red bg-critical-red/20"></div><span>Danger Zone</span></div>
         <div className="flex items-center space-x-2"><div className="w-4 border-t-2 border-dashed border-safe-teal"></div><span>Safe Corridor</span></div>
       </div>
    </div>
  )
}

function NodeIntelTab({ nodes }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const filtered = nodes.filter(n => {
    if (filter !== 'All' && n.status !== filter.toLowerCase()) return false;
    if (search && !n.id.toLowerCase().includes(search.toLowerCase()) && !n.zone.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-primary-blue/30 flex justify-between items-center">
        <div className="flex space-x-2">
          {['All', 'Online', 'Degraded', 'Offline'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm uppercase font-barlow border ${filter === f ? 'bg-primary-blue/20 border-primary-blue text-primary-blue' : 'border-primary-blue/30 text-text-gray hover:border-primary-blue/70'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2 text-primary-blue" />
          <input type="text" placeholder="Search ID or Zone..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent border border-primary-blue/30 text-text-gray pl-9 pr-3 py-1 focus:outline-none focus:border-primary-blue"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-primary-blue/10 font-barlow text-primary-blue sticky top-0 z-10">
            <tr>
              <th className="p-3">NODE ID</th>
              <th className="p-3">GRID</th>
              <th className="p-3">STATUS</th>
              <th className="p-3">BATTERY</th>
              <th className="p-3">LAST SIGNAL</th>
              <th className="p-3">CONFIDENCE</th>
              <th className="p-3">UPTIME (H)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(node => {
              const isOffline = node.status === 'offline';
              const isDegraded = node.status === 'degraded';
              const bgClass = isOffline ? 'bg-critical-red/5' : isDegraded ? 'bg-warning-amber/5' : 'hover:bg-primary-blue/5';
              const statusColor = isOffline ? 'text-critical-red' : isDegraded ? 'text-warning-amber' : 'text-safe-teal';
              
              return (
                <React.Fragment key={node.id}>
                  <tr className={`border-b border-primary-blue/10 cursor-pointer transition-colors ${bgClass}`} onClick={() => setExpandedRow(expandedRow === node.id ? null : node.id)}>
                    <td className="p-3 font-bold text-primary-blue flex items-center">
                      {expandedRow === node.id ? <ChevronDown size={16} className="mr-2"/> : <ChevronRight size={16} className="mr-2"/>}
                      {node.id}
                    </td>
                    <td className="p-3">{node.zone}</td>
                    <td className={`p-3 uppercase font-bold ${statusColor}`}>
                      {node.status}
                    </td>
                    <td className="p-3">{node.battery}%</td>
                    <td className="p-3">{node.lastSignal}</td>
                    <td className="p-3">{node.confidence}%</td>
                    <td className="p-3">{node.uptime}</td>
                  </tr>
                  {expandedRow === node.id && (
                    <tr className="bg-black/40">
                      <td colSpan="7" className="p-4">
                        <div className="h-32 w-full">
                           <div className="text-xs text-primary-blue mb-2 font-barlow uppercase">Signal Confidence History (Last 10 Intervals)</div>
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={node.history.map((val, i) => ({ time: i, value: val }))}>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1C9BE6' }} />
                                <Line type="monotone" dataKey="value" stroke="#1C9BE6" strokeWidth={2} dot={{ r: 3, fill: '#070B14' }} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SurvivorLogTab({ signals }) {
  const highPriorityCount = signals.filter(s => s.status === 'High Priority').length;

  return (
    <div className="flex flex-col h-full">
      <div className="font-barlow text-2xl text-primary-blue mb-4 flex items-center">
        <span>{signals.length} SIGNALS DETECTED</span>
        <span className="mx-4 text-text-gray/50">—</span>
        <span className="text-critical-red">{highPriorityCount} HIGH PRIORITY</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {signals.map((sig, idx) => {
          const isHighPriority = sig.status === 'High Priority';
          const methodColors = {
            'Acoustic': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
            'RF Probe': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
            'Thermal': 'bg-red-500/20 text-red-400 border-red-500/50',
            'Ultrasonic': 'bg-teal-500/20 text-teal-400 border-teal-500/50',
          };
          
          return (
            <div key={sig.id} className={`panel p-4 flex flex-col relative overflow-hidden transition-all duration-500 ${isHighPriority ? 'border-critical-red animate-pulse-glow' : ''} ${sig.isNew ? 'animate-[slideIn_0.5s_ease-out]' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-primary-blue">{sig.id}</span>
                  <span className="text-sm opacity-60">{new Date(sig.time).toLocaleTimeString()}</span>
                  <span className="px-2 py-1 text-xs border rounded-sm font-barlow uppercase tracking-wider bg-dark-ops/50 border-primary-blue/30 text-primary-blue">
                    Node: {sig.nodeId}
                  </span>
                  <span className={`px-2 py-1 text-xs border rounded-sm font-barlow uppercase tracking-wider ${methodColors[sig.method] || 'border-gray-500 text-gray-400'}`}>
                    {sig.method}
                  </span>
                </div>
                <div className={`px-3 py-1 text-xs font-bold border rounded-sm font-barlow uppercase tracking-wider ${
                  isHighPriority ? 'bg-critical-red/20 text-critical-red border-critical-red' : 
                  sig.status === 'Relayed to Rescue' ? 'bg-safe-teal/20 text-safe-teal border-safe-teal' : 'bg-gray-500/20 text-gray-400 border-gray-500'
                }`}>
                  {sig.status}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="w-1/3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-primary-blue uppercase font-barlow">Confidence</span>
                    <span>{sig.confidence}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-ops border border-primary-blue/30 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-blue transition-all" style={{ width: `${sig.confidence}%` }}></div>
                  </div>
                </div>
                <div className="flex-1 pl-4 border-l border-primary-blue/20">
                  <span className="text-xs text-primary-blue uppercase font-barlow block mb-1">Grid Coordinates</span>
                  <span>Zone {sig.grid} (Approx {Math.floor(Math.random()*100)}m radius)</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ThreatAnalysisTab({ threatData }) {
  // 10x10 Grid Data
  const gridCells = useMemo(() => Array.from({length: 100}, (_, i) => {
    const danger = Math.random();
    let color = 'bg-safe-teal/30 border-safe-teal/50';
    if (danger > 0.8) color = 'bg-critical-red/60 border-critical-red';
    else if (danger > 0.6) color = 'bg-orange-500/50 border-orange-500';
    else if (danger > 0.4) color = 'bg-warning-amber/40 border-warning-amber';
    return { id: i, score: (danger * 100).toFixed(1), color, name: ZONES[i % ZONES.length] };
  }), []);

  const barData = [
    { zone: 'D4', score: 89 }, { zone: 'B7', score: 76 }, { zone: 'F9', score: 72 }, { zone: 'A2', score: 65 }, { zone: 'C3', score: 58 }
  ];

  return (
    <div className="flex h-full space-x-6">
      <div className="w-2/3 flex flex-col space-y-6">
        <div className="panel p-4 flex-1 flex flex-col">
          <div className="font-barlow text-xl text-primary-blue mb-4">LIVE THREAT METRICS</div>
          <div className="flex-1 min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={threatData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorSmoke" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorShock" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#FF3B3B" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#FF3B3B" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorStruct" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#FFA500" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#FFA500" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="time" hide />
                 <YAxis stroke="#C9D6E3" />
                 <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1C9BE6' }} />
                 <Area type="monotone" dataKey="smoke" stroke="#8884d8" fillOpacity={1} fill="url(#colorSmoke)" name="Smoke Density" />
                 <Area type="monotone" dataKey="aftershock" stroke="#FF3B3B" fillOpacity={1} fill="url(#colorShock)" name="Aftershock" />
                 <Area type="monotone" dataKey="structure" stroke="#FFA500" fillOpacity={1} fill="url(#colorStruct)" name="Structural Risk" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4 flex-1 flex flex-col">
           <div className="font-barlow text-xl text-primary-blue mb-4">CRITICAL ZONE RANKING (STRUCTURAL RISK)</div>
           <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#C9D6E3" />
                  <YAxis dataKey="zone" type="category" stroke="#C9D6E3" />
                  <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1C9BE6' }} cursor={{fill: 'rgba(28,155,230,0.1)'}} />
                  <Bar dataKey="score" fill="#FF3B3B" radius={[0,4,4,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="w-1/3 panel p-4 flex flex-col">
        <div className="font-barlow text-xl text-primary-blue mb-4">CITY SECTOR DANGER MAP</div>
        <div className="flex-1 grid grid-cols-10 gap-1 aspect-square content-start">
          {gridCells.map(cell => (
            <div key={cell.id} className={`w-full pt-[100%] relative border ${cell.color} group`}>
               <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/80 text-xs z-10 p-1 text-center font-bold scale-150 rounded border border-primary-blue shadow-lg">
                 Z-{cell.name}<br/>{cell.score}
               </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-xs font-barlow uppercase text-primary-blue">
          <span>Safe (0-40)</span>
          <span>Moderate (40-60)</span>
          <span>High (60-80)</span>
          <span>Critical (80-100)</span>
        </div>
      </div>
    </div>
  )
}

function SystemStatusTab({ logs }) {
  // Generate random 60-segment uptime data
  const uptimeData = useMemo(() => {
    return SUBSYSTEMS.map(sys => {
      const segments = Array.from({length: 60}, () => Math.random() > 0.05 ? 'up' : 'down');
      return { name: sys, segments };
    });
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="panel p-6 flex flex-col items-center justify-center text-center border-safe-teal/50">
          <div className="font-barlow text-xl text-text-gray mb-2">MESH BACKBONE</div>
          <div className="text-2xl font-bold text-safe-teal tracking-widest">OPERATIONAL</div>
        </div>
        <div className="panel p-6 flex flex-col items-center justify-center text-center border-warning-amber/50">
          <div className="font-barlow text-xl text-text-gray mb-2">SATELLITE NTN BACKHAUL</div>
          <div className="text-2xl font-bold text-warning-amber tracking-widest">ACTIVE (2/3 LINKS)</div>
        </div>
        <div className="panel p-6 flex flex-col items-center justify-center text-center border-safe-teal/50">
          <div className="font-barlow text-xl text-text-gray mb-2">EDGE AI PROCESSING</div>
          <div className="text-2xl font-bold text-safe-teal tracking-widest">RUNNING</div>
        </div>
      </div>

      <div className="panel p-4 flex-1 flex flex-col overflow-hidden">
        <div className="font-barlow text-xl text-primary-blue mb-6">SUBSYSTEM UPTIME (LAST 60 MIN)</div>
        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          {uptimeData.map(sys => (
            <div key={sys.name} className="flex flex-col">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold">{sys.name}</span>
                <span className="text-safe-teal">{(sys.segments.filter(s=>s==='up').length / 60 * 100).toFixed(1)}%</span>
              </div>
              <div className="flex space-x-1 h-6">
                {sys.segments.map((seg, i) => (
                  <div key={i} className={`flex-1 ${seg === 'up' ? 'bg-safe-teal/70' : 'bg-critical-red'}`} title={seg === 'up' ? 'Operational' : 'Outage'}></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 h-48">
        <div className="panel p-4 flex flex-col justify-center">
          <div className="font-barlow text-xl text-primary-blue mb-4">FEDERATED LEARNING SYNC</div>
          <div className="text-lg mb-2">118 / 142 nodes synced latest AI model</div>
          <div className="text-sm text-primary-blue mb-4">Model v4.7.1 — Last sync 3m ago</div>
          <div className="w-full h-3 bg-dark-ops border border-primary-blue/30 rounded-full overflow-hidden">
            <div className="h-full bg-safe-teal w-[83%]"></div>
          </div>
        </div>
        <div className="panel p-4 flex flex-col overflow-hidden">
          <div className="font-barlow text-xl text-primary-blue mb-2">SYSTEM EVENT LOG</div>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm pr-2">
            {logs.map(log => (
              <div key={log.id} className="flex space-x-3 border-b border-primary-blue/10 pb-1">
                <span className="text-primary-blue/60">[{log.time}]</span>
                <span className="text-text-gray">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Add these custom animations to a global css or style tag
// The styles are assumed to be loaded via tailwind or index.css
