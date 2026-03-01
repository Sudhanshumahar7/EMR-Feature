import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, AlertTriangle, ClipboardList, Plus, Download, Search } from 'lucide-react';
import StatCard from '../components/StatCard';
import {
  getDashboardSalesSummary, getDashboardItemsSold,
  getDashboardLowStock, getDashboardPurchaseOrders, getRecentSales
} from '../api';

function formatCurrency(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function Badge({ status }) {
  const map = {
    Completed: ['badge-completed', '●'],
    Pending: ['badge-pending', '●'],
  };
  const [cls, dot] = map[status] || ['badge-out', '●'];
  return <span className={`badge ${cls}`}>{dot} {status}</span>;
}

export default function Dashboard() {
  const [sales, setSales] = useState(null);
  const [items, setItems] = useState(null);
  const [lowStock, setLowStock] = useState(null);
  const [orders, setOrders] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardSalesSummary(),
      getDashboardItemsSold(),
      getDashboardLowStock(),
      getDashboardPurchaseOrders(),
      getRecentSales(5),
    ]).then(([s, i, l, o, r]) => {
      setSales(s.data);
      setItems(i.data);
      setLowStock(l.data);
      setOrders(o.data);
      setRecentSales(r.data);
      setLoading(false);
    }).catch(e => {
      setError('Failed to load dashboard data. Is the backend running?');
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>
      <AlertTriangle size={32} style={{ marginBottom: 12 }} />
      <p>{error}</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Pharmacy CRM</h1>
          <p>Manage inventory, sales, and purchase orders</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline">
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary">
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon={<ShoppingCart size={18} />}
          iconBg="var(--green-light)"
          iconColor="var(--green)"
          value={formatCurrency(sales?.today_sales)}
          trend={`+${sales?.growth_percent || 12.5}%`}
          label="Today's Sales"
          trendLabel="Today's Sales"
        />
        <StatCard
          icon={<Package size={18} />}
          iconBg="var(--primary-light)"
          iconColor="var(--primary)"
          value={items?.items_sold_today ?? 0}
          badge={`${items?.items_sold_today ?? 0} Orders`}
          badgeBg="var(--primary-light)"
          badgeColor="var(--primary)"
          label="Items Sold Today"
          trendLabel="Items Sold Today"
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          iconBg="var(--amber-light)"
          iconColor="var(--amber)"
          value={lowStock?.low_stock_count ?? 0}
          badge="Action Needed"
          badgeBg="var(--amber-light)"
          badgeColor="var(--amber)"
          label="Low Stock Items"
          trendLabel="Low Stock Items"
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          iconBg="var(--purple-light)"
          iconColor="var(--purple)"
          value={formatCurrency(orders?.total_value)}
          badge={`${orders?.pending_count ?? 0} Pending`}
          badgeBg="var(--purple-light)"
          badgeColor="var(--purple)"
          label="Purchase Orders"
          trendLabel="Purchase Orders"
        />
      </div>

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="tabs">
          {[
            { key: 'sales', label: '↑↓ Sales' },
            { key: 'purchase', label: '⊙ Purchase' },
            { key: 'inventory', label: '⊞ Inventory' },
          ].map(t => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm"><Plus size={13} /> New Sale</button>
          <button className="btn btn-outline btn-sm"><Plus size={13} /> New Purchase</button>
        </div>
      </div>

      {/* Make a Sale */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Make a Sale</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Select medicines from inventory</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="input" placeholder="Patient Id" style={{ maxWidth: 180 }} />
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input className="input" placeholder="Search medicines..." />
          </div>
          <button className="btn btn-primary">Order</button>
          <button className="btn btn-danger">Bill</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Medicine Name', 'Generic Name', 'Batch No', 'Expiry Date', 'Quantity', 'MRP / Price', 'Supplier', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0', fontSize: 13 }}>
                  Search for medicines to add to the sale
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Sales</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentSales.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No sales today</p>
          )}
          {recentSales.map((sale) => (
            <div key={sale.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 10px', borderRadius: 8, transition: 'background 0.1s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <ShoppingCart size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{sale.invoice_no}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {sale.patient_name} • {sale.items_count} items • {sale.payment_mode}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>
                  {formatCurrency(sale.total_amount)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>{sale.sale_date}</div>
                <Badge status={sale.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
