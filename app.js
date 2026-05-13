// --- CONFIGURATION & STATE ---
const CONFIG = {
    totalNodes: 158,
    kochiCenter: [9.9312, 76.2673],
    updateInterval: 2000, // ms for quick visual updates
};

const STATE = {
    elapsedTimeSeconds: 47 * 60 + 23, // Start at T+00:47:23
    nodes: [],
    survivorSignals: [],
    timelineLogs: [],
    stats: {
        online: 0,
        degraded: 0,
        offline: 0,
        signals: 37,
        highPriority: 9
    }
};

// Colors for JS charts/map
const COLORS = {
    red: '#FF3B3B',
    green: '#00E5A0',
    amber: '#FFB300',
    blue: '#1C9BE6',
    darkPanel: 'rgba(11, 18, 33, 0.85)'
};

// --- UTILS ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `T+${h}:${m}:${s} ELAPSED`;
};
const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
};

// --- DATA GENERATION ---
function generateNodes() {
    const statuses = ['online', 'online', 'online', 'online', 'degraded', 'offline'];
    const types = ['Acoustic', 'Thermal', 'RF Probe', 'Ultrasonic', 'None'];
    
    for (let i = 1; i <= CONFIG.totalNodes; i++) {
        const status = randomChoice(statuses);
        const hasSignal = status !== 'offline' && Math.random() > 0.5;
        
        STATE.nodes.push({
            id: `N-${i.toString().padStart(3, '0')}`,
            status: status,
            battery: status === 'offline' ? 0 : randomInt(15, 100),
            lat: CONFIG.kochiCenter[0] + (Math.random() - 0.5) * 0.15,
            lng: CONFIG.kochiCenter[1] + (Math.random() - 0.5) * 0.15,
            zone: `Grid ${randomChoice(['A','B','C','D','E','F'])}${randomInt(1, 9)}`,
            lastSignalType: hasSignal ? randomChoice(types.filter(t=>t!=='None')) : 'None',
            confidence: hasSignal ? randomInt(40, 98) : 0,
            uptime: status === 'offline' ? '0h 0m' : `${randomInt(2, 47)}h ${randomInt(0, 59)}m`,
            history: Array.from({length: 10}, () => randomInt(20, 100)) // for sparkline
        });
    }
    updateStats();
}

function updateStats() {
    STATE.stats.online = STATE.nodes.filter(n => n.status === 'online').length;
    STATE.stats.degraded = STATE.nodes.filter(n => n.status === 'degraded').length;
    STATE.stats.offline = STATE.nodes.filter(n => n.status === 'offline').length;
}

function generateInitialSignals() {
    for(let i=0; i<STATE.stats.signals; i++) {
        createNewSignal(false);
    }
    STATE.survivorSignals.sort((a,b) => b.confidence - a.confidence);
}

function createNewSignal(addToUI = true) {
    const methods = ['Acoustic', 'Thermal', 'RF Probe', 'Ultrasonic'];
    const conf = randomInt(50, 99);
    const isHigh = conf > 85;
    
    const sig = {
        id: `SIG-${randomInt(1000,9999)}`,
        time: getTimestamp(),
        node: `N-${randomInt(1, CONFIG.totalNodes).toString().padStart(3, '0')}`,
        method: randomChoice(methods),
        confidence: conf,
        coords: `9.${randomInt(9000,9500)}, 76.${randomInt(2000,2900)}`,
        priority: isHigh ? 'High' : (conf > 70 ? 'Medium' : 'Unconfirmed')
    };
    
    STATE.survivorSignals.push(sig);
    if(isHigh && addToUI) STATE.stats.highPriority++;
    if(addToUI) {
        STATE.stats.signals++;
        STATE.survivorSignals.sort((a,b) => b.confidence - a.confidence);
        renderSurvivorLog(); // Re-render to keep sorted
        
        // Add timeline event
        addTimelineEvent(`New survivor signal detected by ${sig.node} (${sig.method}) - Conf: ${sig.confidence}%`, isHigh ? 'critical' : 'success');
    }
}

// --- DOM UPDATES ---

function updateTopTimer() {
    STATE.elapsedTimeSeconds++;
    document.getElementById('elapsed-timer').textContent = formatTime(STATE.elapsedTimeSeconds);
}

function updateOverviewKPIs() {
    document.getElementById('kpi-nodes').textContent = `${STATE.stats.online + STATE.stats.degraded}/${CONFIG.totalNodes}`;
    document.getElementById('kpi-signals').textContent = STATE.stats.signals;
    
    let totalBat = 0;
    let activeCount = 0;
    STATE.nodes.forEach(n => {
        if(n.status !== 'offline') { totalBat += n.battery; activeCount++; }
    });
    document.getElementById('kpi-battery').textContent = Math.round(totalBat/activeCount) + '%';
}

function addTimelineEvent(msg, type = 'normal') {
    const feed = document.getElementById('timeline-feed');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">[${getTimestamp()}]</span> <span class="log-msg">${msg}</span>`;
    
    feed.prepend(entry);
    if(feed.children.length > 50) feed.removeChild(feed.lastChild);
}

// --- CHARTS (Chart.js) ---
let healthChart, signalChart, threatChart, smokeChart, seismicChart, structChart;

Chart.defaults.color = COLORS.textMuted;
Chart.defaults.font.family = "'Share Tech Mono', monospace";

function initCharts() {
    // 1. Node Health Donut
    const ctxHealth = document.getElementById('nodeHealthChart').getContext('2d');
    healthChart = new Chart(ctxHealth, {
        type: 'doughnut',
        data: {
            labels: ['Online', 'Degraded', 'Offline'],
            datasets: [{
                data: [STATE.stats.online, STATE.stats.degraded, STATE.stats.offline],
                backgroundColor: [COLORS.green, COLORS.amber, COLORS.red],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%' }
    });

    // 2. Signal Types Bar
    const ctxSignal = document.getElementById('signalTypeChart').getContext('2d');
    signalChart = new Chart(ctxSignal, {
        type: 'bar',
        data: {
            labels: ['Acoustic', 'Thermal', 'RF Probe', 'Ultra'],
            datasets: [{
                label: 'Detections',
                data: [randomInt(10,30), randomInt(5,20), randomInt(2,15), randomInt(1,10)],
                backgroundColor: COLORS.blue
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    // 3. Threat Area Chart
    const ctxThreat = document.getElementById('threatAreaChart').getContext('2d');
    const labels = Array.from({length: 20}, (_, i) => `T-${20-i}m`);
    threatChart = new Chart(ctxThreat, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Smoke', data: labels.map(()=>randomInt(20,60)), borderColor: COLORS.amber, backgroundColor: 'rgba(255,179,0,0.1)', fill: true, tension: 0.4 },
                { label: 'Seismic', data: labels.map(()=>randomInt(10,90)), borderColor: COLORS.red, backgroundColor: 'rgba(255,59,59,0.1)', fill: true, tension: 0.4 },
                { label: 'Structural', data: labels.map(()=>randomInt(40,80)), borderColor: COLORS.blue, backgroundColor: 'rgba(28,155,230,0.1)', fill: true, tension: 0.4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, elements: { point: { radius: 0 } }, scales: { y: { max: 100 } } }
    });

    // 4. Bar Charts for Threats
    const createMiniBar = (id, color, data) => {
        return new Chart(document.getElementById(id).getContext('2d'), {
            type: 'bar',
            data: { labels: ['A4', 'B7', 'C1', 'D9', 'E2'], datasets: [{ data: data, backgroundColor: color }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    };
    smokeChart = createMiniBar('smokeBarChart', COLORS.amber, [90, 85, 70, 65, 50]);
    seismicChart = createMiniBar('seismicBarChart', COLORS.red, [95, 88, 82, 75, 60]);
    structChart = createMiniBar('structBarChart', COLORS.blue, [85, 80, 75, 60, 55]);
}

function updateChartsSim() {
    // Update donut
    healthChart.data.datasets[0].data = [STATE.stats.online, STATE.stats.degraded, STATE.stats.offline];
    healthChart.update();

    // Shift area chart
    threatChart.data.datasets.forEach(ds => {
        ds.data.shift();
        ds.data.push(ds.data[ds.data.length-1] + randomInt(-10, 10));
        // clamp
        ds.data[ds.data.length-1] = Math.max(0, Math.min(100, ds.data[ds.data.length-1]));
    });
    threatChart.update();
}

// --- LEAFLET MAP ---
let map;
let markers = [];

function initMap() {
    map = L.map('leaflet-map', {
        zoomControl: false,
        attributionControl: false
    }).setView(CONFIG.kochiCenter, 13);

    // Dark theme map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Danger Zone Polygon
    L.polygon([
        [9.94, 76.25], [9.95, 76.28], [9.92, 76.29], [9.91, 76.26]
    ], { color: COLORS.red, fillColor: COLORS.red, fillOpacity: 0.1, weight: 1 }).addTo(map);

    // Safe Corridor Polyline
    L.polyline([
        [9.90, 76.24], [9.92, 76.25], [9.94, 76.24], [9.96, 76.25]
    ], { color: COLORS.green, dashArray: '5, 10', weight: 2 }).addTo(map);

    // Render Markers
    STATE.nodes.forEach(node => {
        let color = node.status === 'online' ? COLORS.green : (node.status === 'degraded' ? COLORS.amber : COLORS.red);
        let marker = L.circleMarker([node.lat, node.lng], {
            radius: 4,
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 1
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family:'Share Tech Mono'; background:#070B14; color:#fff; padding:5px;">
                <strong style="color:${COLORS.blue}">${node.id}</strong><br>
                Status: <span style="color:${color}">${node.status.toUpperCase()}</span><br>
                Battery: ${node.battery}%<br>
                Last Signal: ${node.lastSignalType}<br>
                Grid: ${node.zone}
            </div>
        `);
        markers.push(marker);
    });
}

// --- NODE INTEL TABLE ---
function renderNodeTable(filter = 'all', search = '') {
    const tbody = document.getElementById('node-table-body');
    tbody.innerHTML = '';
    
    let filteredNodes = STATE.nodes.filter(n => {
        if (filter !== 'all' && n.status !== filter) return false;
        if (search && !n.id.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    filteredNodes.forEach(node => {
        const tr = document.createElement('tr');
        if (node.status === 'offline') tr.className = 'row-critical';
        
        tr.innerHTML = `
            <td><strong>${node.id}</strong></td>
            <td>${node.zone}</td>
            <td><span class="status-badge bg-${node.status}">${node.status}</span></td>
            <td>${node.battery}%</td>
            <td>${node.lastSignalType}</td>
            <td>${node.confidence > 0 ? node.confidence+'%' : '-'}</td>
            <td>${node.uptime}</td>
        `;
        
        tr.addEventListener('click', () => {
            tr.classList.toggle('expanded-row');
            if(!tr.nextElementSibling || !tr.nextElementSibling.classList.contains('sparkline-row')) {
                const sparkRow = document.createElement('tr');
                sparkRow.className = 'sparkline-row';
                sparkRow.innerHTML = `<td colspan="7">
                    <div class="sparkline-container">
                        <canvas id="spark-${node.id}"></canvas>
                    </div>
                </td>`;
                tr.after(sparkRow);
                
                // Draw tiny chart
                const ctx = document.getElementById(`spark-${node.id}`).getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: { labels: node.history.map((_,i)=>i), datasets: [{ data: node.history, borderColor: COLORS.blue, tension: 0.3, borderWidth: 2, pointRadius: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false, min:0, max:100}} }
                });
            } else {
                tr.nextElementSibling.remove();
            }
        });
        
        tbody.appendChild(tr);
    });
}

// --- SURVIVOR LOG ---
function renderSurvivorLog() {
    const container = document.getElementById('survivor-cards-container');
    container.innerHTML = '';
    
    document.getElementById('survivor-stats').innerHTML = `${STATE.stats.signals} Signals Detected — <span class="danger-text">${STATE.stats.highPriority} High Priority</span>`;

    STATE.survivorSignals.forEach(sig => {
        const card = document.createElement('div');
        card.className = `survivor-card priority-${sig.priority.toLowerCase()}`;
        
        let icon = 'fa-wave-square';
        if(sig.method === 'Thermal') icon = 'fa-temperature-high';
        if(sig.method === 'Acoustic') icon = 'fa-volume-high';

        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="card-details">
                <div class="detail-group"><span class="detail-label">SIGNAL ID</span><span class="detail-value" style="color:${COLORS.blue}">${sig.id}</span></div>
                <div class="detail-group"><span class="detail-label">DETECTION TIME</span><span class="detail-value">${sig.time}</span></div>
                <div class="detail-group"><span class="detail-label">NODE / GRID</span><span class="detail-value">${sig.node} / ${sig.coords}</span></div>
                <div class="detail-group"><span class="detail-label">METHOD / CONFIDENCE</span><span class="detail-value">${sig.method} — ${sig.confidence}%</span></div>
            </div>
            <div class="card-status">
                <span class="status-badge" style="border:1px solid ${sig.priority === 'High' ? COLORS.red : COLORS.amber}; color:${sig.priority === 'High' ? COLORS.red : COLORS.amber}">${sig.priority.toUpperCase()}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- THREAT HEATMAP ---
function renderHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    grid.innerHTML = '';
    for(let i=0; i<100; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        // Random danger level
        const r = Math.random();
        if(r > 0.9) cell.style.background = COLORS.red;
        else if(r > 0.7) cell.style.background = '#FF6B00'; // Orange
        else if(r > 0.4) cell.style.background = COLORS.amber;
        
        grid.appendChild(cell);
    }
}
function animateHeatmap() {
    const cells = document.querySelectorAll('.heatmap-cell');
    if(!cells.length) return;
    const idx = randomInt(0, 99);
    const r = Math.random();
    cells[idx].style.background = r > 0.8 ? COLORS.red : (r > 0.5 ? COLORS.amber : COLORS.green);
}

// --- SYSTEM LOGS ---
function addSystemLog(msg) {
    const log = document.getElementById('sys-log');
    log.innerHTML = `<div class="sys-log-entry"><span class="time">[${getTimestamp()}]</span> <span>${msg}</span></div>` + log.innerHTML;
    if(log.children.length > 30) log.removeChild(log.lastChild);
}

// --- GANTT CHART (Faked with Chart.js Horizontal Bar) ---
function renderGantt() {
    const ctx = document.getElementById('gantt-container');
    ctx.innerHTML = '<canvas id="ganttChart"></canvas>';
    const c = document.getElementById('ganttChart').getContext('2d');
    
    new Chart(c, {
        type: 'bar',
        data: {
            labels: ['Mesh Backbone', 'Satellite Link 1', 'Satellite Link 2', 'Satellite Link 3', 'Edge AI'],
            datasets: [
                { label: 'Uptime', data: [[0, 60], [0, 60], [10, 60], [0, 45], [0, 60]], backgroundColor: COLORS.green },
                { label: 'Outage', data: [[0,0], [0,0], [0, 10], [45, 60], [0,0]], backgroundColor: COLORS.red }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, indexAxis: 'y', 
            plugins: { legend: { display: false } },
            scales: { x: { min: 0, max: 60, title: {display:true, text: 'Minutes Ago (0 = Now)', color:COLORS.textMuted} }, y: { stacked: true } }
        }
    });
}

// --- INITIALIZATION & SIMULATION LOOP ---
function init() {
    generateNodes();
    generateInitialSignals();
    initCharts();
    renderNodeTable();
    renderSurvivorLog();
    renderHeatmap();
    renderGantt();
    
    addTimelineEvent('SYSTEM INITIALIZED. Awaiting telemetry...', 'normal');
    addTimelineEvent('Connection established with 142 nodes.', 'success');
    addSystemLog('Federated learning model RES-AI-v4.2.1 pushed to edge.');

    // Navigation logic
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if(targetId === 'mesh-map' && !map) {
                setTimeout(initMap, 100); // init after div is visible
            }
        });
    });

    // Table Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderNodeTable(e.target.getAttribute('data-filter'), document.getElementById('node-search').value);
        });
    });
    document.getElementById('node-search').addEventListener('input', (e) => {
        renderNodeTable(document.querySelector('.filter-btn.active').getAttribute('data-filter'), e.target.value);
    });

    // Simulation Loop
    setInterval(() => {
        updateTopTimer();
        document.getElementById('last-sync-time').textContent = getTimestamp();
    }, 1000);

    setInterval(() => {
        // Random node drops or comes back
        if(Math.random() > 0.7) {
            const node = randomChoice(STATE.nodes);
            const oldStatus = node.status;
            node.status = randomChoice(['online', 'degraded', 'offline']);
            if(oldStatus !== node.status) {
                updateStats();
                updateOverviewKPIs();
                updateChartsSim();
                addTimelineEvent(`Node ${node.id} status changed: ${oldStatus.toUpperCase()} -> ${node.status.toUpperCase()}`, node.status === 'offline' ? 'critical' : 'warning');
                addSystemLog(`Heartbeat monitor: ${node.id} is now ${node.status}`);
            }
        }

        // Random new signal
        if(Math.random() > 0.8) {
            createNewSignal();
        }

        animateHeatmap();

    }, CONFIG.updateInterval);
}

window.onload = init;
