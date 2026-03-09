import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw, Star } from 'lucide-react';

export default function FilterPanel({ filters, setFilters, onReset, isMobile, onClose, categories = [], maxRange = 1000 }) {
  // Local state for the slider to feel responsive without triggering expensive filtering
  const [localPrice, setLocalPrice] = useState(filters.maxPrice);

  // Sync local price with global filter state (e.g. when reset or loaded)
  useEffect(() => {
    setLocalPrice(filters.maxPrice);
  }, [filters.maxPrice]);

  const handleCategoryChange = (cat) => {
    setFilters(prev => ({ ...prev, category: cat }));
  };

  const handlePriceDrag = (e) => {
    setLocalPrice(parseInt(e.target.value));
  };

  const handlePriceCommit = () => {
    setFilters(prev => ({ ...prev, maxPrice: localPrice }));
  };

  const handleRatingChange = (rating) => {
    setFilters(prev => ({ ...prev, minRating: rating }));
  };

  return (
    <div className={`filter-panel ${isMobile ? 'mobile' : ''}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '20px' : '24px',
      height: '100%',
      padding: isMobile ? '0 8px' : '24px'
    }}>
      {isMobile && <div className="drawer-handle" style={{
        width: '40px',
        height: '4px',
        background: 'var(--border-light)',
        borderRadius: '2px',
        margin: '-20px auto 10px',
        opacity: 0.6
      }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          <Filter size={18} /> Filters
        </h3>
        {isMobile && (
          <button 
            className="btn-secondary" 
            onClick={onClose} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 0
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="filter-group">
        <label style={{ display: 'block', marginBottom: '14px', fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</label>
        <div className="category-scroll-container" style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'row' : 'column',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: '10px',
          paddingBottom: isMobile ? '8px' : '0',
          scrollbarWidth: 'none',
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`filter-pill ${filters.category === cat ? 'active' : ''}`}
              style={{
                width: isMobile ? 'max-content' : '100%',
                padding: isMobile ? '10px 20px' : '8px 18px',
                textAlign: 'center',
                fontSize: '14px',
                flexShrink: 0,
                borderRadius: '100px'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Max Price</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              position: 'absolute', 
              left: isMobile ? '16px' : '12px', 
              color: 'var(--primary-blue)', 
              fontWeight: 800,
              fontSize: isMobile ? '16px' : '14px',
              pointerEvents: 'none'
            }}>$</span>
            <input 
              type="number"
              min="0"
              max={maxRange}
              value={localPrice}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                if (val === '') {
                  setLocalPrice('');
                } else {
                  setLocalPrice(Math.max(0, Math.min(val, maxRange)));
                }
              }}
              onBlur={() => {
                // If empty, default to maxRange so all products show
                const finalVal = localPrice === '' ? maxRange : localPrice;
                setLocalPrice(finalVal);
                setFilters(prev => ({ ...prev, maxPrice: finalVal }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const finalVal = localPrice === '' ? maxRange : localPrice;
                  setLocalPrice(finalVal);
                  setFilters(prev => ({ ...prev, maxPrice: finalVal }));
                }
              }}
              style={{
                width: isMobile ? '130px' : '110px',
                padding: isMobile ? '12px 16px 12px 30px' : '8px 12px 8px 25px',
                borderRadius: '12px',
                border: '1.5px solid var(--border-light)',
                background: 'var(--bg-surface-secondary)',
                fontSize: isMobile ? '16px' : '15px',
                fontWeight: 800,
                color: 'var(--primary-blue)',
                textAlign: 'right',
                outline: 'none',
                transition: 'border-color 0.2s',
                WebkitAppearance: 'none'
              }}
              className="price-input-manual"
            />
          </div>
        </div>
        <div className="slider-wrapper" style={{ position: 'relative', padding: '0 2px' }}>
          <input 
            type="range" 
            min="0" 
            max={maxRange} 
            step="1"
            value={localPrice || 0}
            onChange={handlePriceDrag}
            onMouseUp={handlePriceCommit}
            onTouchEnd={handlePriceCommit}
            className="filter-range-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>$0</span>
            <span>${maxRange}</span>
          </div>
        </div>
      </div>

      <div className="filter-group">
        <label style={{ display: 'block', marginBottom: '14px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Rating</label>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : '4px',
          background: 'var(--bg-surface-secondary)',
          padding: isMobile ? '12px' : '12px 8px',
          borderRadius: '16px',
          border: '1.5px solid var(--border-light)',
          justifyContent: 'center'
        }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleRatingChange(star)}
              className={`rating-btn ${filters.minRating >= star ? 'active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                padding: isMobile ? '6px' : '6px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: filters.minRating >= star ? 'scale(1.1)' : 'scale(1)',
                filter: filters.minRating >= star ? 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4))' : 'none'
              }}
            >
              <Star 
                size={isMobile ? 24 : 22} 
                fill={filters.minRating >= star ? "var(--warning)" : "none"} 
                stroke={filters.minRating >= star ? "var(--warning)" : "var(--text-muted)"}
                strokeWidth={2.5}
                style={{
                  transition: 'all 0.3s ease'
                }}
              />
            </button>
          ))}
        </div>
        {filters.minRating > 0 && (
          <div style={{ 
            marginTop: '10px', 
            textAlign: 'center', 
            fontSize: '13px', 
            fontWeight: 600,
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Star size={14} fill="var(--warning)" stroke="var(--warning)" />
            {filters.minRating}+ stars and above
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'row' : 'column', 
        gap: '12px', 
        marginTop: isMobile ? '12px' : 'auto' 
      }}>
        <button 
          className="btn-secondary" 
          onClick={onReset}
          style={{ 
            flex: isMobile ? 1 : 'none',
            width: isMobile ? 'auto' : '100%', 
            gap: '8px', 
            padding: '12px',
            borderRadius: '16px',
            fontWeight: 700,
            border: '1.5px solid var(--border-light)',
            fontSize: '14px'
          }}
        >
          <RotateCcw size={16} /> Reset
        </button>

        {isMobile && (
          <button 
            className="btn-primary" 
            onClick={onClose}
            style={{ 
              flex: 2,
              padding: '12px',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '14px'
            }}
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
}
