import React from 'react';
import {
  LayoutDashboard, Package, Search, BarChart2, Users,
  Settings, Pill, TrendingUp, Bookmark, Plus, Zap
} from 'lucide-react';

const navItems = [
  { icon: Search, key: null },
  { icon: LayoutDashboard, key: 'dashboard', label: 'Dashboard' },
  { icon: Package, key: 'inventory', label: 'Inventory' },
  { icon: BarChart2, key: null, label: 'Analytics' },
  { icon: TrendingUp, key: null, label: 'Sales' },
  { icon: Users, key: null, label: 'Patients' },
  { icon: Bookmark, key: null, label: 'Bookmarks' },
  { icon: Pill, key: null, label: 'Medicines' },
  { icon: Plus, key: null, label: 'Add' },
  { icon: Zap, key: null, label: 'Quick' },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 64, background: '#fff',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: 16,
      zIndex: 100, gap: 2
    }}>
      {/* Logo */}
      <div style={{
        width: 40, height: 40,
        background: 'var(--primary)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16
      }}>
        <Pill size={20} color="white" />
      </div>

      {navItems.map(({ icon: Icon, key, label }, i) => (
        <button
          key={i}
          onClick={() => key && setActivePage(key)}
          title={label}
          style={{
            width: 42, height: 42,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, border: 'none', cursor: key ? 'pointer' : 'default',
            background: activePage === key ? 'var(--primary-light)' : 'transparent',
            color: activePage === key ? 'var(--primary)' : key ? 'var(--text-muted)' : 'var(--text-light)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            if (key && activePage !== key) {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.color = 'var(--text)';
            }
          }}
          onMouseLeave={e => {
            if (key && activePage !== key) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }
          }}
        >
          <Icon size={18} />
        </button>
      ))}

      <div style={{ flex: 1 }} />
      <button style={{
        width: 42, height: 42,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, border: 'none', cursor: 'pointer',
        background: 'transparent', color: 'var(--text-muted)', marginBottom: 12
      }}>
        <Settings size={18} />
      </button>
    </aside>
  );
}
