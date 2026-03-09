import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
import ProductSkeleton from '../components/ProductSkeleton';
import { Filter as FilterIcon } from 'lucide-react';

export default function Shop({ products, onProductClick, searchQuery, loading }) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Dynamically extract categories from the product list
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => (p.category || 'Uncategorized')));
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  // Find the maximum price among all products precisely
  const maxPriceInRange = useMemo(() => {
    if (products.length === 0) return 1000;
    const prices = products.map(p => {
      const rawPrice = String(p.price || '0').replace(/[^0-9.]/g, '');
      return parseFloat(rawPrice) || 0;
    });
    return Math.max(...prices, 1); // Ensure at least 1 to avoid slider errors
  }, [products]);

  const [filters, setFilters] = useState({
    category: 'All',
    maxPrice: 2000, // Initial high default
    minRating: 0
  });

  // Sync maxPrice filter default ONLY on initial load or if maxPrice is currently at 0 (unset)
  useEffect(() => {
    if (products.length > 0 && filters.maxPrice === 2000) {
      setFilters(f => ({ ...f, maxPrice: maxPriceInRange }));
    }
  }, [maxPriceInRange, products.length]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const query = searchQuery.toLowerCase();
      const name = String(p.name || '').toLowerCase();
      const category = String(p.category || '').toLowerCase();
      const code = String(p.product_code || '').toLowerCase();
      const matchSearch = name.includes(query) || category.includes(query) || code.includes(query);
      
      const matchCategory = filters.category === 'All' || 
                            category === filters.category.toLowerCase();
      
      // Convert price to number safely, stripping any non-numeric characters if needed
      const rawPrice = String(p.price || '0').replace(/[^0-9.]/g, '');
      const itemPrice = parseFloat(rawPrice) || 0;
      const matchPrice = itemPrice <= (Number(filters.maxPrice) || Infinity);
      
      const itemRating = parseFloat(p.rating) || 0;
      const matchRating = itemRating >= filters.minRating;
      
      return matchSearch && matchCategory && matchPrice && matchRating;
    });
  }, [filters, searchQuery, products]);

  const resetFilters = () => {
    setFilters({
      category: 'All',
      maxPrice: maxPriceInRange,
      minRating: 0
    });
  };

  return (
    <div className="shop-container" style={{ 
      display: 'grid', 
      gridTemplateColumns: '280px 1fr', 
      gap: '32px',
      padding: '24px 0'
    }}>
      {/* Desktop Filter Sidebar */}
      <aside className="desktop-filters card glass" style={{ height: 'fit-content', position: 'sticky', top: '24px' }}>
        <FilterPanel 
          filters={filters} 
          setFilters={setFilters} 
          onReset={resetFilters} 
          categories={availableCategories}
          maxRange={maxPriceInRange}
        />
      </aside>

      <div className="shop-content-area" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Secondary Mobile Navbar - Sticky filter & count */}
        <div className="shop-secondary-nav mobile-only" style={{ 
          display: 'none', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px max(20px, env(safe-area-inset-left))',
          margin: '16px -4px 24px -4px',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-light)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}>
          <button 
            className="btn-primary" 
            onClick={() => setShowMobileFilters(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 20px', 
              fontSize: '14px', 
              borderRadius: '100px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <FilterIcon size={16} /> Filter & Sort
          </button>
          
          <div style={{ 
            color: 'var(--text-main)', 
            fontSize: '13px', 
            fontWeight: 700,
            paddingRight: '8px'
          }}>
            {loading ? '...' : filteredProducts.length} <span style={{ color: 'var(--text-muted)' }}>Items</span>
          </div>
        </div>

        <div style={{ padding: '0 0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Shop All</h1>
            
            <button 
              className="btn-secondary mobile-filter-trigger desktop-only-flex" 
              onClick={() => setShowMobileFilters(true)}
              style={{ display: 'none', gap: '8px' }}
            >
              <FilterIcon size={18} /> Filters
            </button>

            <div className="desktop-only-block" style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
              Showing {loading ? '...' : filteredProducts.length} Products
            </div>
          </div>

          {loading ? (
            <div className="product-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <ProductSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card glass" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--bg-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <FilterIcon size={32} />
              </div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No products found</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button className="btn-outline" onClick={resetFilters} style={{ marginTop: '24px' }}>Clear All Filters</button>
            </div>
          ) : (
            <div className="product-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
            }}>
              {filteredProducts.map((p, idx) => (
                <div 
                  key={p.id} 
                  className="animate-slide-up" 
                  style={{ 
                    animationDelay: `${idx * 0.05}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <ProductCard 
                    name={p.name} 
                    price={p.price} 
                    image={p.image} 
                    rating={p.rating}
                    onClick={() => onProductClick(p)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer Overlay - Styled in CSS */}
      <div className={`mobile-filter-drawer ${showMobileFilters ? 'active' : ''}`}>
        <div className="mobile-filter-content">
          <FilterPanel 
            filters={filters} 
            setFilters={setFilters} 
            onReset={resetFilters} 
            isMobile={true}
            onClose={() => setShowMobileFilters(false)}
            categories={availableCategories}
            maxRange={maxPriceInRange}
          />
        </div>
        <div className="mobile-filter-backdrop" onClick={() => setShowMobileFilters(false)}></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1025px) {
          .mobile-filter-drawer {
            display: none !important;
          }
          .mobile-only {
            display: none !important;
          }
        }
`}} />
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .shop-container {
            grid-template-columns: 1fr !important;
            padding-top: 16px !important;
          }
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
            gap: 16px !important;
          }
          .desktop-filters {
            display: none !important;
          }
          .desktop-only-flex {
            display: none !important;
          }
          .desktop-only-block {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
          .shop-secondary-nav {
            display: flex !important;
          }
        }

        .mobile-filter-drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5000;
          visibility: hidden;
          transition: visibility 0.3s;
        }
        .mobile-filter-drawer.active {
          visibility: visible;
        }
        .mobile-filter-content {
          position: absolute;
          bottom: 16px;
          left: 50%;
          width: calc(100% - 32px);
          max-width: 420px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          z-index: 5002;
          background: var(--bg-surface);
          border-radius: 32px !important;
          padding: 24px 20px 32px;
          transform: translate(-50%, 120%);
          transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-light);
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-transform: translate3d(-50%, 120%, 0);
        }
        .category-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .dark-mode .mobile-filter-content {
          background: rgba(15, 23, 42, 0.98);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
        }
        .mobile-filter-drawer.active .mobile-filter-content {
          transform: translate(-50%, 0);
          -webkit-transform: translate3d(-50%, 0, 0);
        }
        .mobile-filter-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 5001;
          will-change: opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .mobile-filter-drawer.active .mobile-filter-backdrop {
          opacity: 1;
        }
      `}} />
    </div>
  );
}
