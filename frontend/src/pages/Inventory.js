import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Activity, AlertTriangle, DollarSign, Search, Filter,
  Download, Plus, Edit2, Trash2, X, Check
} from 'lucide-react';
import {
  getInventoryOverview, getMedicines,
  addMedicine, updateMedicine, deleteMedicine, updateMedicineStatus
} from '../api';

function formatCurrency(n) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function StatusBadge({ status }) {
  const map = {
    Active: 'badge-active',
    'Low Stock': 'badge-low',
    Expired: 'badge-expired',
    'Out of Stock': 'badge-out',
  };
  return <span className={`badge ${map[status] || 'badge-out'}`}>● {status}</span>;
}

const emptyForm = {
  medicine_name: '', generic_name: '', category: '', batch_no: '',
  expiry_date: '', quantity: '', cost_price: '', mrp: '', supplier: '', status: 'Active'
};

function MedicineModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...emptyForm, ...initial } : emptyForm);
  }, [initial, open]);

  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial?.id;

  const handleSave = async () => {
    if (!form.medicine_name.trim()) return alert('Medicine name is required');
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) || 0, cost_price: Number(form.cost_price) || 0, mrp: Number(form.mrp) || 0 };
      if (isEdit) await updateMedicine(initial.id, payload);
      else await addMedicine(payload);
      onSave();
      onClose();
    } catch {
      alert('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const fields = [
    { k: 'medicine_name', label: 'Medicine Name', span: 2 },
    { k: 'generic_name', label: 'Generic Name' },
    { k: 'category', label: 'Category' },
    { k: 'batch_no', label: 'Batch No.' },
    { k: 'expiry_date', label: 'Expiry Date', type: 'date' },
    { k: 'quantity', label: 'Quantity', type: 'number' },
    { k: 'cost_price', label: 'Cost Price (₹)', type: 'number' },
    { k: 'mrp', label: 'MRP (₹)', type: 'number' },
    { k: 'supplier', label: 'Supplier' },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Update Medicine' : 'Add New Medicine'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-grid">
          {fields.map(({ k, label, type = 'text', span }) => (
            <div key={k} className="input-group" style={span === 2 ? { gridColumn: '1/-1' } : {}}>
              <label className="input-label">{label}</label>
              <input
                className="input"
                type={type}
                value={form[k]}
                onChange={e => set(k, e.target.value)}
                placeholder={label}
              />
            </div>
          ))}
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {['Active', 'Low Stock', 'Expired', 'Out of Stock'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <><Check size={14} /> {isEdit ? 'Update' : 'Add Medicine'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [overview, setOverview] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMed, setEditMed] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, med] = await Promise.all([
        getInventoryOverview(),
        getMedicines({ search: search || undefined, status: statusFilter || undefined })
      ]);
      setOverview(ov.data);
      setMedicines(med.data.medicines);
      setTotal(med.data.total);
    } catch {}
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try {
      await deleteMedicine(id);
      loadData();
    } catch { alert('Failed to delete'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateMedicineStatus(id, status);
      loadData();
    } catch { alert('Failed to update status'); }
  };

  const overviewCards = [
    { icon: <Package size={18} />, iconBg: 'var(--primary-light)', iconColor: 'var(--primary)', label: 'Total Items', value: overview?.total_items ?? 0 },
    { icon: <Activity size={18} />, iconBg: 'var(--green-light)', iconColor: 'var(--green)', label: 'Active Stock', value: overview?.active_stock ?? 0 },
    { icon: <AlertTriangle size={18} />, iconBg: 'var(--amber-light)', iconColor: 'var(--amber)', label: 'Low Stock', value: overview?.low_stock ?? 0 },
    { icon: <DollarSign size={18} />, iconBg: 'var(--purple-light)', iconColor: 'var(--purple)', label: 'Total Value', value: formatCurrency(overview?.total_value) },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pharmacy CRM</h1>
          <p>Manage inventory, sales, and purchase orders</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline"><Download size={14} /> Export</button>
          <button className="btn btn-primary" onClick={() => { setEditMed(null); setModalOpen(true); }}>
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Inventory Overview</h3>
        <div style={{ display: 'flex', gap: 0 }}>
          {overviewCards.map((c, i) => (
            <div key={i} style={{
              flex: 1, padding: '12px 20px',
              borderRight: i < overviewCards.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: c.iconBg, color: c.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {c.icon}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: c.label === 'Total Value' ? 'DM Mono, monospace' : 'inherit' }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Complete Inventory</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                className="input"
                placeholder="Search medicines..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>
            <select
              className="input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="">All Status</option>
              {['Active', 'Low Stock', 'Expired', 'Out of Stock'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-outline btn-sm"><Filter size={13} /> Filter</button>
            <button className="btn btn-outline btn-sm"><Download size={13} /> Export</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading inventory...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {['Medicine Name', 'Generic Name', 'Category', 'Batch No', 'Expiry Date', 'Quantity', 'Cost Price', 'MRP', 'Supplier', 'Status', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 && (
                  <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '32px 0' }}>
                    No medicines found
                  </td></tr>
                )}
                {medicines.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.medicine_name}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.generic_name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.category || '—'}</td>
                    <td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{m.batch_no}</span></td>
                    <td style={{ fontSize: 12 }}>{m.expiry_date}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{m.quantity}</span>
                    </td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>₹{m.cost_price?.toFixed(2)}</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 600 }}>₹{m.mrp?.toFixed(2)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.supplier}</td>
                    <td>
                      <select
                        value={m.status}
                        onChange={e => handleStatusChange(m.id, e.target.value)}
                        style={{
                          border: 'none', background: 'transparent',
                          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 12
                        }}
                      >
                        <option>Active</option>
                        <option>Low Stock</option>
                        <option>Expired</option>
                        <option>Out of Stock</option>
                      </select>
                      <StatusBadge status={m.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="action-btn" onClick={() => { setEditMed(m); setModalOpen(true); }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="action-btn danger" onClick={() => handleDelete(m.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {medicines.length} of {total} medicines
          </div>
        )}
      </div>

      <MedicineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={loadData}
        initial={editMed}
      />
    </div>
  );
}
