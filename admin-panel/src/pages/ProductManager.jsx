import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, X, Upload, Save, CheckCircle, Image as ImageIcon, Loader, Star } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const colorsToString = (colors) => Array.isArray(colors) ? colors.join(', ') : '';
const stringToColors = (str) => str.split(',').map(s => s.trim()).filter(s => s !== '');

const includedToString = (included) => Array.isArray(included) ? included.join(', ') : '';
const stringToIncluded = (str) => str.split(',').map(s => s.trim()).filter(s => s !== '');

const specsToString = (specs) => {
  if (!specs || typeof specs !== 'object') return '';
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n');
};
const stringToSpecs = (str) => {
  const specs = {};
  str.split('\n').forEach(line => {
    const [key, ...valParts] = line.split(':');
    if (key && valParts.length > 0) {
      specs[key.trim()] = valParts.join(':').trim();
    }
  });
  return specs;
};

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', category: '', price: '', stock: '', description: '', image: '',
    colors: '', specs: '', included: '', directions: '', status: 'In Stock',
    rating: 5,
    product_code: '',
    gallery: ['', '', '', '']
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const formatURL = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const API_BASE = 'http://essentialshub.local/api/';
    return `${API_BASE}${url.startsWith('/') ? url.slice(1) : url}`;
  };

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProducts();
    // Map stock_quantity to stock for consistency with frontend and calculate status
    const mapped = data.map(p => {
        const stock = parseInt(p.stock_quantity || 0);
        return {
            ...p,
            stock: stock,
            image: formatURL(p.image_url || p.image),
            status: stock <= 0 ? 'Out of Stock' : (stock < 10 ? 'Low Stock' : 'In Stock')
        };
    });
    setProducts(mapped);
    setLoading(false);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const galleryData = Array.isArray(product.gallery) 
        ? [...product.gallery.map(img => formatURL(img)), '', '', '', ''].slice(0, 4) 
        : ['', '', '', ''];

      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description || '',
        image: formatURL(product.image) || '',
        colors: colorsToString(product.colors),
        specs: specsToString(product.specs),
        included: includedToString(product.included),
        directions: product.directions || '',
        status: (product.stock <= 0) ? 'Out of Stock' : (product.stock < 10 ? 'Low Stock' : 'In Stock'),
        rating: product.rating || 5,
        product_code: product.product_code || '',
        gallery: galleryData
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', category: '', price: '', stock: '', description: '', image: '',
        colors: '', specs: '', included: '', directions: '', status: 'In Stock',
        rating: 5,
        product_code: '',
        gallery: ['', '', '', '']
      });
    }
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Max 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Max 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const newGallery = [...formData.gallery];
        newGallery[index] = reader.result;
        setFormData({ ...formData, gallery: newGallery });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large. Max 10MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, directions: reader.result });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data for API (convert strings back to JSON where necessary)
    const apiData = {
        ...formData,
        colors: JSON.stringify(stringToColors(formData.colors)),
        included: JSON.stringify(stringToIncluded(formData.included)),
        specs: JSON.stringify(stringToSpecs(formData.specs)),
        gallery: formData.gallery.filter(img => img !== '')
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, apiData);
      } else {
        await createProduct(apiData);
      }
      handleCloseModal();
      loadProducts();
    } catch (error) {
      console.error("Save error:", error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || 'Failed to delete product');
      }

    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
        <Loader className="animate-spin" size={48} color="var(--primary-blue)" />
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading Catalog...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Products</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your catalog and inventory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} /> Add Product
        </button>
      </header>

      <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 40px 12px 40px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="btn" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: filterCategory !== 'All' ? 'var(--primary-blue)' : 'var(--bg-surface-secondary)',
                color: filterCategory !== 'All' ? 'white' : 'var(--text-main)'
              }}
            >
              <Filter size={18} /> {filterCategory !== 'All' ? filterCategory : 'Filters'}
            </button>
            {showFilterMenu && (
              <>
                <div 
                  onClick={() => setShowFilterMenu(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '8px',
                  minWidth: '180px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                  zIndex: 100
                }}>
                  {['All', 'Optics', 'Connectors', 'Electromechanical', 'Semiconductors', 'Passives'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategory(cat);
                        setShowFilterMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        textAlign: 'left',
                        background: filterCategory === cat ? 'var(--primary-blue)' : 'transparent',
                        color: filterCategory === cat ? 'white' : 'var(--text-main)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: filterCategory === cat ? 600 : 400,
                        transition: 'all 0.2s',
                        marginBottom: '4px'
                      }}
                      onMouseEnter={(e) => {
                        if (filterCategory !== cat) {
                          e.currentTarget.style.background = 'var(--bg-surface-secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (filterCategory !== cat) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px' }}>Product</th>
                <th style={{ padding: '16px 24px' }}>Category</th>
                <th style={{ padding: '16px 24px' }}>Price</th>
                <th style={{ padding: '16px 24px' }}>Stock</th>
                <th style={{ padding: '16px 24px' }}>Status</th>
                <th style={{ padding: '16px 24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImageIcon size={16} opacity={0.3} />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                        {p.product_code && <span style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 700 }}>{p.product_code}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{p.category}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 700 }}>${p.price}</td>
                  <td style={{ padding: '16px 24px' }}>{p.stock}</td>
                  <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '100px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    background: p.status === 'In Stock' ? 'var(--success-bg)' : 
                                p.status === 'Low Stock' ? 'var(--warning-bg)' : 
                                (p.status === 'Out of Stock' || p.status === 'Suspended') ? 'var(--danger-bg)' : 'rgba(100, 116, 139, 0.1)',
                    color: p.status === 'In Stock' ? 'var(--success)' : 
                           p.status === 'Low Stock' ? 'var(--warning)' : 
                           (p.status === 'Out of Stock' || p.status === 'Suspended') ? 'var(--danger)' : 'var(--text-muted)'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={() => handleOpenModal(p)} title="Edit Product" style={{ padding: '8px', color: 'var(--primary-blue)', background: 'var(--info-bg)', borderRadius: '8px' }}><Edit2 size={16} /></button>
                    <button className="btn" onClick={() => handleDelete(p.id)} title="Delete Product" style={{ padding: '8px', color: 'var(--danger)', background: 'var(--danger-bg)', borderRadius: '8px' }}><Trash2 size={16} /></button>
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '12px',
          overflowY: 'auto'
        }}>
          <div className="card glass" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative', 
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            margin: 'auto'
          }}>
            <button onClick={handleCloseModal} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Product Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                      placeholder="e.g. Sony WH-1000XM5"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Component Code</label>
                    <input 
                      type="text" 
                      value={formData.product_code}
                      onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                      placeholder="e.g. NE555"
                    />
                  </div>
                </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                  >
                    <option value="">Select Category</option>
                    <optgroup label="Optics">
                      <option value="Optics">Optics (General)</option>
                      <option value="Optics > LEDs">Optics &gt; LEDs</option>
                      <option value="Optics > Displays">Optics &gt; Displays</option>
                      <option value="Optics > Sensors">Optics &gt; Sensors</option>
                    </optgroup>
                    <optgroup label="Connectors">
                      <option value="Connectors">Connectors (General)</option>
                      <option value="Connectors > Headers">Connectors &gt; Headers</option>
                      <option value="Connectors > Plugs">Connectors &gt; Plugs</option>
                      <option value="Connectors > Sockets">Connectors &gt; Sockets</option>
                    </optgroup>
                    <optgroup label="Electromechanical">
                      <option value="Electromechanical">Electromechanical (General)</option>
                      <option value="Electromechanical > Switches">Electromechanical &gt; Switches</option>
                      <option value="Electromechanical > Relays">Electromechanical &gt; Relays</option>
                      <option value="Electromechanical > Motors">Electromechanical &gt; Motors</option>
                    </optgroup>
                    <optgroup label="Semiconductors">
                      <option value="Semiconductors">Semiconductors (General)</option>
                      <option value="Semiconductors > Diodes">Semiconductors &gt; Diodes</option>
                      <option value="Semiconductors > Transistors">Semiconductors &gt; Transistors</option>
                      <option value="Semiconductors > ICs">Semiconductors &gt; ICs</option>
                    </optgroup>
                    <optgroup label="Passives">
                      <option value="Passives">Passives (General)</option>
                      <option value="Passives > Resistors">Passives &gt; Resistors</option>
                      <option value="Passives > Capacitors">Passives &gt; Capacitors</option>
                      <option value="Passives > Inductors">Passives &gt; Inductors</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Stock Qty</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.stock}
                    onChange={(e) => {
                      const val = e.target.value;
                      const stockVal = parseInt(val) || 0;
                      let newStatus = 'In Stock';
                      if (stockVal <= 0) newStatus = 'Out of Stock';
                      else if (stockVal < 10) newStatus = 'Low Stock';
                      setFormData({ ...formData, stock: val, status: newStatus });
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Star Rating (1-5)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-surface-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star}
                            size={20}
                            fill={star <= formData.rating ? "#fbbf24" : "transparent"}
                            color={star <= formData.rating ? "#fbbf24" : "var(--text-muted)"}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => setFormData({ ...formData, rating: star })}
                        />
                    ))}
                    <span style={{ marginLeft: '8px', fontWeight: 700, color: 'var(--primary-blue)' }}>{formData.rating}.0</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Product Status (Auto-calculated)</label>
                  <div style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-light)', 
                    background: 'rgba(0,0,0,0.05)', 
                    color: formData.status === 'In Stock' ? 'var(--success)' : 
                           formData.status === 'Low Stock' ? 'var(--warning)' : 'var(--danger)',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}>
                    {formData.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Available Colors</label>
                  <input 
                    type="text" 
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="Red, Blue, Black..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Included Items</label>
                  <input 
                    type="text" 
                    value={formData.included}
                    onChange={(e) => setFormData({ ...formData, included: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="Unit, Charger, Manual..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Specifications</label>
                  <textarea 
                    value={formData.specs}
                    onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none', minHeight: '80px', resize: 'vertical', fontSize: '13px' }}
                    placeholder="Brand: Sony&#10;Model: XM5..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Directions (PDF File)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-light)', 
                        background: 'var(--bg-surface-secondary)', 
                        cursor: 'pointer',
                        fontSize: '13px'
                    }}>
                        <Upload size={16} /> 
                        {formData.directions && formData.directions.startsWith('data:') ? 'Change PDF' : (formData.directions ? 'PDF Uploaded' : 'Upload Directions PDF')}
                        <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                    </label>
                    {formData.directions && (
                        <div style={{ fontSize: '12px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <FileText size={14} /> 
                            {formData.directions.startsWith('http') ? (
                                <a href={formData.directions} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>View Current PDF</a>
                            ) : 'New PDF ready for upload'}
                            <button type="button" onClick={() => setFormData({...formData, directions: ''})} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px' }}>Remove</button>
                        </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Product Image</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    padding: '32px', 
                    border: '2px dashed var(--border-light)', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    background: 'var(--bg-surface-secondary)',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '100px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-blue)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    {formData.image ? (
                        <>
                            <img src={formData.image} alt="Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: 600 }}>
                                <Upload size={18} /> Change Image
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Click to upload product image</span>
                        </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {formData.image && (
                     <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} color="var(--success)" /> Image ready for upload
                        <button type="button" onClick={() => setFormData({...formData, image: ''})} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                     </div>
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>Product Gallery (up to 4 extra images)</label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Click a slot to upload, or paste a URL below each slot.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {formData.gallery.map((img, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ 
                        aspectRatio: '1/1', 
                        border: img ? '2px solid var(--primary-blue)' : '2px dashed var(--border-light)', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: 'var(--bg-surface-secondary)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {img ? (
                          <>
                            <img src={img} alt={`Gallery ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.target.style.display='none'; }}
                            />
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                const newGallery = [...formData.gallery];
                                newGallery[idx] = '';
                                setFormData({ ...formData, gallery: newGallery });
                              }} 
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', zIndex: 2 }}
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                            <Plus size={20} />
                            <span style={{ fontSize: '10px' }}>Image {idx + 1}</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleGalleryUpload(idx, e)} style={{ display: 'none' }} />
                      </label>
                      <input
                        type="text"
                        placeholder="Paste URL..."
                        value={img && (img.startsWith('http') || img.startsWith('//')) ? img : ''}
                        onChange={(e) => {
                          const newGallery = [...formData.gallery];
                          newGallery[idx] = e.target.value;
                          setFormData({ ...formData, gallery: newGallery });
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          border: '1px solid var(--border-light)', 
                          background: 'var(--bg-surface-secondary)', 
                          color: 'var(--text-main)', 
                          fontSize: '11px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>General Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Marketing text and general overview..."
                />
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px' }}>
                  <Save size={20} /> {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
