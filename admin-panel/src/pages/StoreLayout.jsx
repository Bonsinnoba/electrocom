import React, { useState, useEffect, useMemo } from 'react';
import { 
  Library, 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  Package, 
  Box, 
  Info,
  Layers,
  FileSpreadsheet,
  Download,
  Filter,
  X
} from 'lucide-react';
import { fetchStoreData, saveProductLocation, deleteProductLocation, fetchProducts, createBranch } from '../services/api';

const STANDARD_SHELVES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

export default function StoreLayout() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shelfFilter, setShelfFilter] = useState('');

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignForm, setAssignForm] = useState({
    product_id: '',
    shelf_label: '',
    bin_label: '',
    target_branch_id: '',
    branch_code_verify: '',
    admin_name: '',
    admin_password: ''
  });

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    branch_code: '',
    address: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [storeData, productsData] = await Promise.all([
        fetchStoreData(),
        fetchProducts()
      ]);
      
      if (storeData.success) {
        setBranches(storeData.branches);
        setLocations(storeData.locations);
        if (storeData.branches.length > 0 && !selectedBranch) {
          setSelectedBranch(storeData.branches[0]);
        } else if (selectedBranch) {
            // Keep current selection but refresh its data
            const updated = storeData.branches.find(b => b.id === selectedBranch.id);
            if (updated) setSelectedBranch(updated);
        }
      }
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load store layout data", error);
    }
    setLoading(false);
  };

  const branchLocations = useMemo(() => {
    if (!selectedBranch) return [];
    return locations.filter(loc => loc.branch_id === selectedBranch.id);
  }, [locations, selectedBranch]);

  const filteredItems = useMemo(() => {
    return branchLocations.filter(loc => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        loc.product_name.toLowerCase().includes(q) ||
        loc.product_code.toLowerCase().includes(q);
      
      const matchesShelf = !shelfFilter || loc.shelf_label === shelfFilter;
      
      return matchesSearch && matchesShelf;
    });
  }, [branchLocations, searchQuery, shelfFilter]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.target_branch_id || !assignForm.product_id || !assignForm.shelf_label) return;

    try {
      const res = await saveProductLocation({
        branch_id: assignForm.target_branch_id,
        ...assignForm
      });

      if (res.success) {
        await loadAllData();
        setIsAssigning(false);
        setAssignForm({ 
            product_id: '', 
            shelf_label: '', 
            bin_label: '', 
            target_branch_id: '', 
            branch_code_verify: '', 
            admin_name: '', 
            admin_password: '' 
        });
      } else {
          alert(res.message || "Verification failed");
      }
    } catch (error) {
      alert("Failed to assign location. Please check your credentials.");
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Remove item from this location?")) return;
    try {
      const res = await deleteProductLocation(id);
      if (res.success) {
        loadAllData();
      }
    } catch (error) {
      alert("Failed to delete location");
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createBranch(branchForm);
      if (res.success) {
        await loadAllData();
        setIsAddingBranch(false);
        setBranchForm({ name: '', branch_code: '', address: '' });
      }
    } catch (error) {
      alert("Failed to create branch. Branch code might already exist.");
    }
  };

  if (loading && branches.length === 0) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading Store Data...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 0 48px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <FileSpreadsheet size={28} className="text-primary" />
             <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Inventory Spreadsheet</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Detailed logistical view of stock placement in <strong>{selectedBranch?.name}</strong> ({selectedBranch?.branch_code}).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export CSV
          </button>
          <button className="btn-primary" onClick={() => setIsAssigning(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Assign Location
          </button>
        </div>
      </header>

      {/* Branch Selection Bar */}
      <div className="card glass" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
            <MapPin size={20} />
            <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Branch:</span>
          </div>
          <select 
            value={selectedBranch?.id || ''}
            onChange={(e) => setSelectedBranch(branches.find(b => b.id === parseInt(e.target.value)))}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '2px solid var(--primary-blue)', 
              background: 'white', 
              color: 'var(--text-main)', 
              fontWeight: 700,
              fontSize: '15px',
              minWidth: '280px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(var(--primary-blue-rgb), 0.1)'
            }}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.branch_code} — {b.name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={() => setIsAddingBranch(true)}
          style={{ 
            fontSize: '13px',
            color: 'var(--primary-blue)',
            background: 'transparent',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '6px',
            transition: 'background 0.2s'
          }}
          className="btn-text-hover"
        >
          + Register New Branch
        </button>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        {/* Spreadsheet Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search items or codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-main)', width: '280px', fontSize: '14px' }}
              />
            </div>
            <select 
              value={shelfFilter}
              onChange={(e) => setShelfFilter(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '14px', minWidth: '160px' }}
            >
              <option value="">All Shelves</option>
              {STANDARD_SHELVES.map(s => <option key={s} value={s}>Shelf {s}</option>)}
            </select>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredItems.length} records
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '2px solid var(--border-light)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>Product</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>Component Code</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>Shelf</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>Bin #</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px' }}>Last Updated</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Box size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                    <p>No inventory records found for this branch.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((loc, idx) => (
                  <tr 
                    key={loc.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-light)', 
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(var(--primary-blue-rgb), 0.02)',
                      transition: 'background 0.2s'
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                          <img src={loc.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{loc.product_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <code style={{ background: 'var(--info-bg)', color: 'var(--primary-blue)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 800 }}>
                        {loc.product_code}
                      </code>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={14} className="text-primary" />
                        <span style={{ fontWeight: 600 }}>{loc.shelf_label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ color: loc.bin_label ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {loc.bin_label || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(loc.updated_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteLocation(loc.id)}
                        style={{ padding: '8px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                        className="btn-icon-danger"
                        title="Delete record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="card glass" style={{ padding: '24px', background: 'var(--bg-surface-secondary)', borderLeft: '4px solid var(--primary-blue)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
          <Info size={24} className="text-primary" style={{ marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800 }}>Logistics Guide</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '12px' }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Branch Address</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{selectedBranch?.address || '—'}</p>
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Branch Stats</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        SKU Count: <strong>{branchLocations.length}</strong> | 
                        Unique Shelves: <strong>{new Set(branchLocations.map(l => l.shelf_label)).size}</strong>
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssigning && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Assign Product</h2>
                <button onClick={() => setIsAssigning(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Target Branch</label>
                <select 
                  value={assignForm.target_branch_id}
                  onChange={(e) => setAssignForm({ ...assignForm, target_branch_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)' }}
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Product to Move</label>
                <select 
                  value={assignForm.product_id}
                  onChange={(e) => setAssignForm({ ...assignForm, product_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)' }}
                  required
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.product_code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Shelf</label>
                  <select 
                    value={assignForm.shelf_label}
                    onChange={(e) => setAssignForm({ ...assignForm, shelf_label: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)' }}
                    required
                  >
                    <option value="">-- Select Shelf --</option>
                    {STANDARD_SHELVES.map(s => (
                      <option key={s} value={s}>Shelf {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Bin (Opt)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 102"
                    value={assignForm.bin_label}
                    onChange={(e) => setAssignForm({ ...assignForm, bin_label: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(var(--primary-blue-rgb), 0.05)', borderRadius: '12px', border: '1px solid var(--info-bg)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', color: 'var(--primary-blue)', letterSpacing: '0.5px' }}>Security Verification</h4>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Verify Branch Code</label>
                  <input 
                    type="text" 
                    placeholder="Enter target branch code"
                    value={assignForm.branch_code_verify}
                    onChange={(e) => setAssignForm({ ...assignForm, branch_code_verify: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-main)' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Admin Name</label>
                    <input 
                        type="text" 
                        placeholder="Your full name"
                        value={assignForm.admin_name}
                        onChange={(e) => setAssignForm({ ...assignForm, admin_name: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-main)' }}
                        required
                    />
                    </div>
                    <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>Admin Password</label>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        value={assignForm.admin_password}
                        onChange={(e) => setAssignForm({ ...assignForm, admin_password: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-main)' }}
                        required
                    />
                    </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, height: '44px' }}>Authorize & Move</button>
                <button type="button" className="btn-secondary" onClick={() => setIsAssigning(false)} style={{ flex: 1, height: '44px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {isAddingBranch && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Register New Branch</h2>
                <button onClick={() => setIsAddingBranch(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleBranchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Branch Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Accra Mall Branch"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Branch Code</label>
                  <input 
                    type="text" 
                    placeholder="ACC-02"
                    value={branchForm.branch_code}
                    onChange={(e) => setBranchForm({ ...branchForm, branch_code: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Physical Address</label>
                <textarea 
                  placeholder="Street name, landmark, city..."
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Initialize Branch</button>
                <button type="button" className="btn-secondary" onClick={() => setIsAddingBranch(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
