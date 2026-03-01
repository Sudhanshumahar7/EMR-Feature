import React from 'react';

export default function StatCard({ icon, iconBg, iconColor, label, value, badge, badgeColor, badgeBg, trend, trendLabel }) {
  return (
    <div className="card" style={{ padding: '20px 24px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            background: badgeBg || '#e8f5e9',
            color: badgeColor || 'var(--green)'
          }}>
            {badge}
          </span>
        )}
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 8px', borderRadius: 20,
            background: '#e8f5e9', color: 'var(--green)',
            display: 'flex', alignItems: 'center', gap: 3
          }}>
            ↑ {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        {trendLabel || label}
      </div>
    </div>
  );
}
