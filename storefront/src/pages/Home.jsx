import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import ProductSkeleton from '../components/ProductSkeleton';
import { useSettings } from '../context/SettingsContext';

export default function Home({ products, onProductClick, searchQuery, loading }) {
  const { siteSettings } = useSettings();
  const itemsPerPage = parseInt(siteSettings?.defaultItemsPerPage || 9);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [viewHistory, setViewHistory] = useState({});

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('ehub_view_history');
      if (historyStr) {
        setViewHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.warn("Failed to parse view history:", e);
    }
  }, []);

  const sortedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Sort primarily by view count (descending), then maintain original order
    return [...products].sort((a, b) => {
      const viewsA = viewHistory[a.id] || 0;
      const viewsB = viewHistory[b.id] || 0;
      return viewsB - viewsA;
    });
  }, [products, viewHistory]);

  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(p => {
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) || 
             (p.category && p.category.toLowerCase().includes(query)) ||
             (p.product_code && p.product_code.toLowerCase().includes(query));
    });
  }, [sortedProducts, searchQuery]);

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [searchQuery, itemsPerPage]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!searchQuery && <HeroSlider />}
      
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
          {searchQuery ? `Search Results for "${searchQuery}"` : (siteSettings.homepageSectionTitle || 'Product Catalog')}
        </h2>
        
        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <ProductSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card glass" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No products found matching "{searchQuery}"
          </div>
        ) : (
          <>
            <div className="product-grid">
              {displayedProducts.map((p, idx) => (
              <div 
                key={p.id} 
                className="animate-slide-up" 
                style={{ 
                  animationDelay: `${idx * 0.05}s`,
                  animationFillMode: 'both'
                }}
              >
                <ProductCard 
                  id={p.id}
                  name={p.name} 
                  price={p.price} 
                  image={p.image} 
                  rating={p.rating}
                  discount_percent={p.discount_percent}
                  sale_ends_at={p.sale_ends_at}
                  onClick={() => onProductClick(p)}
                />
              </div>
            ))}
            </div>

            {visibleCount < filteredProducts.length && !loading && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px', marginBottom: '24px' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => setVisibleCount(prev => prev + itemsPerPage)}
                  style={{ 
                    padding: '14px 48px', 
                    borderRadius: '100px', 
                    fontWeight: 800,
                    fontSize: '15px',
                    boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.2)',
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  View More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
