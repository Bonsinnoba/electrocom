import React, { useState, useEffect } from 'react';
import { fetchAdminSlides, createSlide, updateSlide, deleteSlide } from '../services/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Upload } from 'lucide-react';

export default function SliderManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    subtitle: '',
    button_text: 'Shop Now',
    button_link: '/shop',
    text_position: 'left',
    content_blocks: [],
    display_order: 1,
    is_active: 1
  });

  const loadSlides = async () => {
    setLoading(true);
    const data = await fetchAdminSlides();
    setSlides(data);
    setLoading(false);
  };

  const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
  const isAccountant = user.role === 'accountant';

  useEffect(() => {
    if (!isAccountant) {
      loadSlides();
    }
  }, []);

  if (isAccountant) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Plus size={64} color="var(--danger)" style={{ marginBottom: '24px', transform: 'rotate(45deg)' }} />
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>Accounting roles do not have permission to manage store media and sliders.</p>
      </div>
    );
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Max 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openModal = (slide = null) => {
    if (slide) {
      setEditingSlide(slide);
      let blocks = [];
      try {
          blocks = typeof slide.content_blocks === 'string' ? JSON.parse(slide.content_blocks) : (slide.content_blocks || []);
      } catch(e) { blocks = []; }
      
      setFormData({
        image_url: slide.image_url,
        title: slide.title,
        subtitle: slide.subtitle,
        button_text: slide.button_text,
        button_link: slide.button_link,
        text_position: slide.text_position || 'left',
        content_blocks: Array.isArray(blocks) ? blocks : [],
        display_order: slide.display_order,
        is_active: slide.is_active ? 1 : 0
      });
    } else {
      setEditingSlide(null);
      setFormData({
        image_url: '',
        title: '',
        subtitle: '',
        button_text: 'Shop Now',
        button_link: '/shop',
        text_position: 'left',
        content_blocks: [],
        display_order: slides.length + 1,
        is_active: 1
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
  };

  const addBlock = () => {
      setFormData(prev => ({
          ...prev,
          content_blocks: [...prev.content_blocks, { 
              text: '', 
              type: 'paragraph', 
              fontSize: '18px', 
              color: '#ffffff',
              top: '50', 
              left: '50', 
              textAlign: 'center',
              width: 'auto'
          }]
      }));
  };

  const removeBlock = (index) => {
      setFormData(prev => ({
          ...prev,
          content_blocks: prev.content_blocks.filter((_, i) => i !== index)
      }));
  };

  const updateBlock = (index, field, value) => {
      setFormData(prev => {
          const newBlocks = [...prev.content_blocks];
          newBlocks[index] = { ...newBlocks[index], [field]: value };
          return { ...prev, content_blocks: newBlocks };
      });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSlide) {
        await updateSlide(editingSlide.id, formData);
      } else {
        await createSlide(formData);
      }
      closeModal();
      loadSlides();
    } catch (error) {
      console.error('Failed to save slide', error);
      alert('Failed to save slide');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await deleteSlide(id);
        loadSlides();
      } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || 'Failed to delete slide');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
           <h1 className="page-title">Hero Slider</h1>
           <p className="page-subtitle">Manage the images and text on your homepage slider.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus size={20} />
          Add Slide
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading slides...</div>
      ) : (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {slides.map(slide => (
            <div key={slide.id} className="card glass" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
               <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                  <img src={slide.image_url} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    Order: {slide.display_order}
                  </div>
                  {!slide.is_active && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--danger-bg)', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid var(--danger-bg)' }}>
                          Inactive
                      </div>
                  )}
               </div>
               <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{slide.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>{slide.subtitle}</p>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={() => openModal(slide)} className="btn-secondary" style={{ flex: 1, padding: '8px' }}>
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(slide.id)} className="btn-danger" style={{ flex: 1, padding: '8px' }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '90%', padding: '32px', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</h2>
            
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group">
                <label>Slide Image</label>
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
                    minHeight: '120px'
                  }}>
                    {formData.image_url ? (
                        <>
                            <img src={formData.image_url} alt="Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: 600 }}>
                                <Upload size={18} /> Change Image
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Click to upload slide image</span>
                        </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <input type="text" name="image_url" value={formData.image_url.startsWith('data:') ? 'Custom Upload' : formData.image_url} onChange={handleChange} className="input-field" placeholder="Or paste image URL here..." />
                </div>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="Big Sale!" />
              </div>

              <div className="form-group">
                <label>Subtitle</label>
                <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} className="input-field" placeholder="Get 50% off today" />
              </div>

              <div className="form-group">
                <label>Text Content Position</label>
                <select name="text_position" value={formData.text_position} onChange={handleChange} className="input-field">
                  <option value="left">Left (Default)</option>
                  <option value="right">Right</option>
                  <option value="center">Center</option>
                  <option value="top">Top Center</option>
                  <option value="bottom">Bottom Center</option>
                </select>
              </div>

              <div className="form-group" style={{ border: '1px solid var(--border-light)', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ margin: 0, fontWeight: 700 }}>Additional Content Blocks</label>
                      <button type="button" onClick={addBlock} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                          <Plus size={14} /> Add Block
                      </button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                      {formData.content_blocks.map((block, index) => (
                          <div key={index} style={{ display: 'grid', gap: '12px', padding: '20px', background: 'var(--bg-surface-secondary)', borderRadius: '16px', border: '1px solid var(--border-light)', position: 'relative' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Block #{index + 1}</span>
                                  <button type="button" onClick={() => removeBlock(index)} className="btn-danger" style={{ padding: '6px', borderRadius: '6px' }}>
                                      <Trash2 size={14} />
                                  </button>
                              </div>

                              <div className="form-group">
                                  <label style={{ fontSize: '11px' }}>Text Content</label>
                                  <input 
                                      type="text" 
                                      value={block.text} 
                                      onChange={(e) => updateBlock(index, 'text', e.target.value)} 
                                      className="input-field" 
                                      placeholder="What should this block say?" 
                                  />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                  <div className="form-group">
                                      <label style={{ fontSize: '11px' }}>Type</label>
                                      <select 
                                          value={block.type} 
                                          onChange={(e) => updateBlock(index, 'type', e.target.value)} 
                                          className="input-field"
                                          style={{ fontSize: '12px' }}
                                      >
                                          <option value="paragraph">Paragraph</option>
                                          <option value="heading">Heading</option>
                                          <option value="subheading">Sub-heading</option>
                                      </select>
                                  </div>
                                  <div className="form-group">
                                      <label style={{ fontSize: '11px' }}>Font Size</label>
                                      <input 
                                          type="text" 
                                          value={block.fontSize} 
                                          onChange={(e) => updateBlock(index, 'fontSize', e.target.value)} 
                                          className="input-field" 
                                          placeholder="e.g. 24px"
                                          style={{ fontSize: '12px' }}
                                      />
                                  </div>
                                  <div className="form-group">
                                      <label style={{ fontSize: '11px' }}>Color</label>
                                      <input 
                                          type="color" 
                                          value={block.color || '#ffffff'} 
                                          onChange={(e) => updateBlock(index, 'color', e.target.value)} 
                                          className="input-field"
                                          style={{ height: '38px', padding: '4px' }}
                                      />
                                  </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                                  <div className="form-group">
                                      <label style={{ fontSize: '11px' }}>Top (%)</label>
                                      <input 
                                          type="number" 
                                          value={block.top} 
                                          onChange={(e) => updateBlock(index, 'top', e.target.value)} 
                                          className="input-field"
                                          style={{ fontSize: '12px' }}
                                      />
                                  </div>
                                  <div className="form-group">
                                      <label style={{ fontSize: '11px' }}>Left (%)</label>
                                      <input 
                                          type="number" 
                                          value={block.left} 
                                          onChange={(e) => updateBlock(index, 'left', e.target.value)} 
                                          className="input-field"
                                          style={{ fontSize: '12px' }}
                                      />
                                  </div>
                                  <div className="form-group">
                                      <label style={{ fontSize: '11px' }}>Alignment</label>
                                      <select 
                                          value={block.textAlign || 'center'} 
                                          onChange={(e) => updateBlock(index, 'textAlign', e.target.value)} 
                                          className="input-field"
                                          style={{ fontSize: '12px' }}
                                      >
                                          <option value="left">Left</option>
                                          <option value="center">Center</option>
                                          <option value="right">Right</option>
                                      </select>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {formData.content_blocks.length === 0 && (
                          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', margin: '20px 0' }}>No custom text blocks. Only main Title/Subtitle will show.</p>
                      )}
                  </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                    <label>Button Text</label>
                    <input type="text" name="button_text" value={formData.button_text} onChange={handleChange} className="input-field" />
                </div>
                <div className="form-group">
                    <label>Button Link</label>
                    <input type="text" name="button_link" value={formData.button_link} onChange={handleChange} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                    <label>Display Order</label>
                    <input type="number" name="display_order" value={formData.display_order} onChange={handleChange} className="input-field" />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '30px' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} id="active_check" style={{ width: '20px', height: '20px' }} />
                    <label htmlFor="active_check" style={{ margin: 0, cursor: 'pointer' }}>Active</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Slide</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
