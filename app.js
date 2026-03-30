/* ============================================================
   CalibFlow — Shared Application Utilities
   Supabase client, Auth guard, Toast system, Navigation
   ============================================================ */

// ── Supabase Config ─────────────────────────────────────────
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Initialize Supabase client (loaded from CDN in each page)
let supabase;
function initSupabase() {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// ── Auth Guard ──────────────────────────────────────────────
let currentUser = null;

async function checkAuth(requiredRole = null) {
  if (!supabase) initSupabase();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    window.location.href = 'login.html';
    return null;
  }

  currentUser = {
    user_id: session.user.id,
    company_id: profile.company_id,
    role: profile.role,
    full_name: profile.full_name,
    phone: profile.phone,
    email: session.user.email
  };

  if (requiredRole && currentUser.role !== requiredRole) {
    window.location.href = 'dashboard.html';
    showToast(`Access denied. This page requires ${requiredRole} permissions.`, 'error');
    return null;
  }

  updateNavUser();
  return currentUser;
}

async function checkNoAuth() {
  if (!supabase) initSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

async function logout() {
  if (!supabase) initSupabase();
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// ── Toast Notification System ───────────────────────────────
function getToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info', duration = 4000) {
  const container = getToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;

  toast.addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  toast.style.animation = 'slideOut 0.3s ease-in forwards';
  setTimeout(() => toast.remove(), 300);
}

// ── Navigation Builder ──────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', href: 'dashboard.html', icon: '🏠' },
  { label: 'Equipment',  href: 'equipment.html', icon: '🔧' },
  { label: 'Calendar',   href: 'calendar.html',  icon: '📅' },
  { label: 'Alerts',     href: 'alerts.html',    icon: '🔔' },
  { label: 'Certificates', href: 'certificates.html', icon: '📄' },
  { label: 'Reports',    href: 'reports.html',   icon: '📊' },
];

function buildTopNav(activePage) {
  const nav = document.getElementById('topnav');
  if (!nav) return;

  nav.innerHTML = `
    <a href="dashboard.html" class="topnav-logo">
      <svg width="40" height="40" viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="11" fill="#1E5FAD"/>
        <rect width="44" height="44" rx="11" fill="url(#lgrad)" opacity="0.6"/>
        <path d="M22 8C14.268 8 8 14.268 8 22C8 29.732 14.268 36 22 36C29.732 36 36 29.732 36 22"
              stroke="#0EC7C7" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="22" cy="22" r="3" fill="#0EC7C7"/>
        <path d="M22 22L28 16" stroke="#0EC7C7" stroke-width="2" stroke-linecap="round"/>
        <path d="M33 22L36 22" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <path d="M35.5 16L32.7 17.5" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <path d="M35.5 28L32.7 26.5" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        <defs>
          <linearGradient id="lgrad" x1="0" y1="0" x2="44" y2="44">
            <stop stop-color="#0EC7C7"/>
            <stop offset="1" stop-color="#0EC7C7" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>
      <div class="logo-name">Calib<span>Flow</span></div>
    </a>
    <div class="topnav-links">
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="topnav-link ${activePage === item.label ? 'active' : ''}">${item.label}</a>
      `).join('')}
    </div>
    <div class="topnav-user" id="topnav-user" onclick="toggleUserDropdown()">
      <div class="topnav-avatar" id="topnav-avatar">CF</div>
      <div class="topnav-user-info">
        <span class="topnav-user-name" id="topnav-name">User</span>
        <span class="topnav-user-company" id="topnav-company">Company</span>
      </div>
      <span style="color:var(--muted);font-size:12px;">▾</span>
    </div>
    <div class="topnav-dropdown" id="topnav-dropdown">
      <a href="settings.html">⚙️ Settings</a>
      <a href="#" onclick="logout(); return false;">🚪 Logout</a>
    </div>
    <button class="hamburger" id="hamburger" onclick="toggleMobileMenu()" style="display:none;">
      <span></span><span></span><span></span>
    </button>
  `;
}

function buildSidebar(activePage) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const allItems = [...NAV_ITEMS];
  
  sidebar.innerHTML = `
    ${allItems.map(item => `
      <a href="${item.href}" class="sidebar-link ${activePage === item.label ? 'active' : ''}">
        <span class="icon">${item.icon}</span>
        <span class="label">${item.label}</span>
      </a>
    `).join('')}
    <div class="sidebar-divider"></div>
    <a href="settings.html" class="sidebar-link ${activePage === 'Settings' ? 'active' : ''}" id="sidebar-settings" style="display:none;">
      <span class="icon">⚙️</span>
      <span class="label">Settings</span>
    </a>
  `;
}

function updateNavUser() {
  if (!currentUser) return;

  const avatar = document.getElementById('topnav-avatar');
  const name = document.getElementById('topnav-name');
  const company = document.getElementById('topnav-company');
  const settingsLink = document.getElementById('sidebar-settings');

  if (avatar) {
    const initials = currentUser.full_name
      ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'CF';
    avatar.textContent = initials;
  }
  if (name) name.textContent = currentUser.full_name || 'User';
  if (company) company.textContent = currentUser.company_id ? 'Company' : '';
  if (settingsLink && currentUser.role === 'admin') {
    settingsLink.style.display = 'flex';
  }
}

function toggleUserDropdown() {
  const dd = document.getElementById('topnav-dropdown');
  if (dd) dd.classList.toggle('active');
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('mobile-open');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('topnav-dropdown');
  const user = document.getElementById('topnav-user');
  if (dd && !user?.contains(e.target) && !dd.contains(e.target)) {
    dd.classList.remove('active');
  }
});

// ── Helpers ─────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function formatDateFull(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(dateStr);
  target.setHours(0,0,0,0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

function calculateNextDue(lastCalDate, intervalDays) {
  if (!lastCalDate || !intervalDays) return null;
  const d = new Date(lastCalDate);
  d.setDate(d.getDate() + parseInt(intervalDays));
  return d.toISOString().split('T')[0];
}

function getStatusFromDays(days) {
  if (days === null) return 'pending';
  if (days <= 0) return 'overdue';
  if (days <= 30) return 'due_soon';
  return 'compliant';
}

function getStatusBadge(status) {
  const map = {
    compliant: { class: 'badge-compliant', label: 'Compliant' },
    due_soon: { class: 'badge-due-soon', label: 'Due Soon' },
    overdue: { class: 'badge-overdue', label: 'Overdue' },
    scheduled: { class: 'badge-scheduled', label: 'Scheduled' },
    pending: { class: 'badge-muted', label: 'Pending' },
  };
  const s = map[status] || map.pending;
  return `<span class="badge ${s.class}"><span class="badge-dot"></span>${s.label}</span>`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Demo Data (for development without Supabase) ────────────
const DEMO_EQUIPMENT = [
  { id: 1, name: 'Pressure Gauge PG-100', serial_number: 'SN-2024-00142', model: 'XYZ-500', manufacturer: 'Acme Corp', category: 'Pressure', location: 'Lab A', location_id: 1, responsible: 'John Smith', vendor: 'CalibCo Services', last_calibration_date: '2026-01-12', calibration_interval_days: 180, next_due_date: '2026-07-11', status: 'compliant', active: true },
  { id: 2, name: 'Temperature Sensor TS-200', serial_number: 'SN-2024-00089', model: 'TMP-Pro', manufacturer: 'ThermoTech', category: 'Temperature', location: 'Lab B', location_id: 2, responsible: 'Maria Lee', vendor: 'CalibCo Services', last_calibration_date: '2025-11-15', calibration_interval_days: 365, next_due_date: '2026-11-15', status: 'compliant', active: true },
  { id: 3, name: 'Digital Multimeter DM-50', serial_number: 'SN-2023-00210', model: 'DMM-X1', manufacturer: 'ElectroPrecision', category: 'Electrical', location: 'Lab A', location_id: 1, responsible: 'Ahmed Hassan', vendor: 'MeterCal Inc', last_calibration_date: '2025-09-28', calibration_interval_days: 180, next_due_date: '2026-03-27', status: 'overdue', active: true },
  { id: 4, name: 'Analytical Balance AB-300', serial_number: 'SN-2024-00055', model: 'AB-300X', manufacturer: 'WeighPro', category: 'Weight', location: 'Lab C', location_id: 3, responsible: 'John Smith', vendor: 'ScaleCal Ltd', last_calibration_date: '2026-02-01', calibration_interval_days: 90, next_due_date: '2026-05-02', status: 'due_soon', active: true },
  { id: 5, name: 'Flow Meter FM-400', serial_number: 'SN-2024-00178', model: 'FM-Ultra', manufacturer: 'FlowDynamics', category: 'Flow', location: 'Plant Floor', location_id: 4, responsible: 'Maria Lee', vendor: 'FlowCal Group', last_calibration_date: '2026-01-20', calibration_interval_days: 365, next_due_date: '2027-01-20', status: 'compliant', active: true },
  { id: 6, name: 'pH Meter PM-100', serial_number: 'SN-2023-00334', model: 'pH-Elite', manufacturer: 'ChemSense', category: 'Other', location: 'Lab B', location_id: 2, responsible: 'Ahmed Hassan', vendor: 'CalibCo Services', last_calibration_date: '2025-12-10', calibration_interval_days: 180, next_due_date: '2026-06-08', status: 'due_soon', active: true },
  { id: 7, name: 'Torque Wrench TW-250', serial_number: 'SN-2024-00091', model: 'TQ-250Pro', manufacturer: 'TorqueMaster', category: 'Other', location: 'Workshop', location_id: 5, responsible: 'John Smith', vendor: 'MeterCal Inc', last_calibration_date: '2025-08-15', calibration_interval_days: 180, next_due_date: '2026-02-11', status: 'overdue', active: true },
  { id: 8, name: 'Oscilloscope OS-500', serial_number: 'SN-2024-00201', model: 'OSC-500X', manufacturer: 'WaveGen', category: 'Electrical', location: 'Lab A', location_id: 1, responsible: 'Maria Lee', vendor: 'MeterCal Inc', last_calibration_date: '2026-03-01', calibration_interval_days: 365, next_due_date: '2027-03-01', status: 'compliant', active: true },
  { id: 9, name: 'Pressure Transducer PT-150', serial_number: 'SN-2023-00445', model: 'PT-150HD', manufacturer: 'Acme Corp', category: 'Pressure', location: 'Plant Floor', location_id: 4, responsible: 'Ahmed Hassan', vendor: 'CalibCo Services', last_calibration_date: '2026-03-15', calibration_interval_days: 90, next_due_date: '2026-06-13', status: 'due_soon', active: true },
  { id: 10, name: 'Humidity Sensor HS-80', serial_number: 'SN-2024-00312', model: 'HS-Pro80', manufacturer: 'ThermoTech', category: 'Temperature', location: 'Lab C', location_id: 3, responsible: 'John Smith', vendor: 'CalibCo Services', last_calibration_date: '2026-02-20', calibration_interval_days: 180, next_due_date: '2026-08-19', status: 'compliant', active: true },
  { id: 11, name: 'Conductivity Meter CM-70', serial_number: 'SN-2023-00501', model: 'CM-70X', manufacturer: 'ChemSense', category: 'Other', location: 'Lab B', location_id: 2, responsible: 'Maria Lee', vendor: 'CalibCo Services', last_calibration_date: '2025-10-05', calibration_interval_days: 180, next_due_date: '2026-04-03', status: 'due_soon', active: true },
  { id: 12, name: 'Caliper DC-200', serial_number: 'SN-2024-00088', model: 'DC-200Pro', manufacturer: 'MeasurePrecision', category: 'Other', location: 'Workshop', location_id: 5, responsible: 'Ahmed Hassan', vendor: 'ScaleCal Ltd', last_calibration_date: '2026-01-05', calibration_interval_days: 365, next_due_date: '2027-01-05', status: 'compliant', active: true },
];

const DEMO_ALERTS = [
  { id: 1, equipment_id: 3, device_name: 'Digital Multimeter DM-50', alert_type: '1-day', sent_to: 'ahmed@company.com', channel: 'email', status: 'delivered', sent_at: '2026-03-26T08:00:00Z', confirmed_at: null },
  { id: 2, equipment_id: 4, device_name: 'Analytical Balance AB-300', alert_type: '30-day', sent_to: 'john@company.com', channel: 'email', status: 'confirmed', sent_at: '2026-03-02T07:00:00Z', confirmed_at: '2026-03-02T09:30:00Z' },
  { id: 3, equipment_id: 7, device_name: 'Torque Wrench TW-250', alert_type: 'overdue', sent_to: 'john@company.com', channel: 'email', status: 'delivered', sent_at: '2026-02-12T07:00:00Z', confirmed_at: null },
  { id: 4, equipment_id: 3, device_name: 'Digital Multimeter DM-50', alert_type: '7-day', sent_to: 'ahmed@company.com', channel: 'whatsapp', status: 'delivered', sent_at: '2026-03-20T08:00:00Z', confirmed_at: null },
  { id: 5, equipment_id: 6, device_name: 'pH Meter PM-100', alert_type: '30-day', sent_to: 'ahmed@company.com', channel: 'email', status: 'sent', sent_at: '2026-03-10T07:00:00Z', confirmed_at: null },
  { id: 6, equipment_id: 9, device_name: 'Pressure Transducer PT-150', alert_type: '30-day', sent_to: 'ahmed@company.com', channel: 'email', status: 'confirmed', sent_at: '2026-03-15T07:00:00Z', confirmed_at: '2026-03-15T10:12:00Z' },
  { id: 7, equipment_id: 11, device_name: 'Conductivity Meter CM-70', alert_type: '7-day', sent_to: 'maria@company.com', channel: 'email', status: 'delivered', sent_at: '2026-03-27T07:00:00Z', confirmed_at: null },
  { id: 8, equipment_id: 4, device_name: 'Analytical Balance AB-300', alert_type: '7-day', sent_to: 'john@company.com', channel: 'whatsapp', status: 'failed', sent_at: '2026-03-25T08:00:00Z', confirmed_at: null },
  { id: 9, equipment_id: 7, device_name: 'Torque Wrench TW-250', alert_type: '30-day', sent_to: 'john@company.com', channel: 'email', status: 'confirmed', sent_at: '2026-01-12T07:00:00Z', confirmed_at: '2026-01-12T14:20:00Z' },
  { id: 10, equipment_id: 3, device_name: 'Digital Multimeter DM-50', alert_type: '30-day', sent_to: 'ahmed@company.com', channel: 'email', status: 'confirmed', sent_at: '2026-02-25T07:00:00Z', confirmed_at: '2026-02-25T08:45:00Z' },
];

const DEMO_CALIBRATIONS = [
  { id: 1, equipment_id: 1, calibration_date: '2026-01-12', result: 'pass', technician: 'J. Smith', cert_number: 'CF-2026-00142', observations: 'All readings within tolerance', readings: { r1: '100.2', r2: '100.1', r3: '100.0' } },
  { id: 2, equipment_id: 1, calibration_date: '2025-07-14', result: 'pass', technician: 'M. Lee', cert_number: 'CF-2025-00089', observations: 'Minor adjustment made', readings: { r1: '99.8', r2: '100.0', r3: '100.1' } },
  { id: 3, equipment_id: 2, calibration_date: '2025-11-15', result: 'pass', technician: 'A. Hassan', cert_number: 'CF-2025-00201', observations: 'Passed all tests', readings: { r1: '23.1', r2: '23.0', r3: '23.1' } },
  { id: 4, equipment_id: 3, calibration_date: '2025-09-28', result: 'pass', technician: 'J. Smith', cert_number: 'CF-2025-00178', observations: 'Within specification', readings: { r1: '5.001', r2: '5.000', r3: '5.002' } },
  { id: 5, equipment_id: 4, calibration_date: '2026-02-01', result: 'pass', technician: 'M. Lee', cert_number: 'CF-2026-00055', observations: 'Zero deviation < 0.01g', readings: { r1: '100.001', r2: '100.000', r3: '100.002' } },
];

const DEMO_CERTIFICATES = [
  { id: 1, cert_number: 'CF-2026-00142', equipment_id: 1, device_name: 'Pressure Gauge PG-100', serial_number: 'SN-2024-00142', calibration_date: '2026-01-12', result: 'pass', valid_until: '2026-07-11', pdf_url: '#' },
  { id: 2, cert_number: 'CF-2025-00089', equipment_id: 1, device_name: 'Pressure Gauge PG-100', serial_number: 'SN-2024-00142', calibration_date: '2025-07-14', result: 'pass', valid_until: '2026-01-12', pdf_url: '#' },
  { id: 3, cert_number: 'CF-2025-00201', equipment_id: 2, device_name: 'Temperature Sensor TS-200', serial_number: 'SN-2024-00089', calibration_date: '2025-11-15', result: 'pass', valid_until: '2026-11-15', pdf_url: '#' },
  { id: 4, cert_number: 'CF-2025-00178', equipment_id: 3, device_name: 'Digital Multimeter DM-50', serial_number: 'SN-2023-00210', calibration_date: '2025-09-28', result: 'pass', valid_until: '2026-03-27', pdf_url: '#' },
  { id: 5, cert_number: 'CF-2026-00055', equipment_id: 4, device_name: 'Analytical Balance AB-300', serial_number: 'SN-2024-00055', calibration_date: '2026-02-01', result: 'pass', valid_until: '2026-05-02', pdf_url: '#' },
  { id: 6, cert_number: 'CF-2026-00088', equipment_id: 5, device_name: 'Flow Meter FM-400', serial_number: 'SN-2024-00178', calibration_date: '2026-01-20', result: 'pass', valid_until: '2027-01-20', pdf_url: '#' },
  { id: 7, cert_number: 'CF-2025-00334', equipment_id: 6, device_name: 'pH Meter PM-100', serial_number: 'SN-2023-00334', calibration_date: '2025-12-10', result: 'pass', valid_until: '2026-06-08', pdf_url: '#' },
];

const DEMO_LOCATIONS = [
  { id: 1, name: 'Lab A', building: 'Building 1' },
  { id: 2, name: 'Lab B', building: 'Building 1' },
  { id: 3, name: 'Lab C', building: 'Building 2' },
  { id: 4, name: 'Plant Floor', building: 'Main Plant' },
  { id: 5, name: 'Workshop', building: 'Building 3' },
];

const DEMO_VENDORS = [
  { id: 1, name: 'CalibCo Services', email: 'info@calibco.com', phone: '+1 555 0101', specialty: 'General', active: true },
  { id: 2, name: 'MeterCal Inc', email: 'service@metercal.com', phone: '+1 555 0202', specialty: 'Electrical', active: true },
  { id: 3, name: 'ScaleCal Ltd', email: 'cal@scalecal.com', phone: '+1 555 0303', specialty: 'Weight', active: true },
  { id: 4, name: 'FlowCal Group', email: 'contact@flowcal.com', phone: '+1 555 0404', specialty: 'Flow', active: true },
];

// ── Logo SVG (reusable) ─────────────────────────────────────
function getLogoSVG(size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="11" fill="#1E5FAD"/>
    <rect width="44" height="44" rx="11" fill="url(#lgrad-${size})" opacity="0.6"/>
    <path d="M22 8C14.268 8 8 14.268 8 22C8 29.732 14.268 36 22 36C29.732 36 36 29.732 36 22"
          stroke="#0EC7C7" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="22" cy="22" r="3" fill="#0EC7C7"/>
    <path d="M22 22L28 16" stroke="#0EC7C7" stroke-width="2" stroke-linecap="round"/>
    <path d="M33 22L36 22" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M35.5 16L32.7 17.5" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M35.5 28L32.7 26.5" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <defs>
      <linearGradient id="lgrad-${size}" x1="0" y1="0" x2="44" y2="44">
        <stop stop-color="#0EC7C7"/>
        <stop offset="1" stop-color="#0EC7C7" stop-opacity="0"/>
      </linearGradient>
    </defs>
  </svg>`;
}
