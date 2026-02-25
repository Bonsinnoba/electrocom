import React from 'react';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import ProductSkeleton from '../components/ProductSkeleton';

export default function Home({ products, onProductClick, searchQuery, loading }) {
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           (p.category && p.category.toLowerCase().includes(query)) ||
           (p.product_code && p.product_code.toLowerCase().includes(query));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!searchQuery && <HeroSlider />}
      
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Product Catalog'}
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
          <div className="product-grid">
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
  );
}
