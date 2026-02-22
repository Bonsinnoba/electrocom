import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useUser } from '../context/UserContext';
import { HeartOff, ShoppingBag, LogIn } from 'lucide-react';

export default function Favorites({ onProductClick, searchQuery }) {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="animate-fade-in glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', textAlign: 'center' }}>
        <div className="glass" style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '24px',
          color: 'var(--primary-blue)'
        }}>
          <LogIn size={40} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Log in to view favorites</h2>
        <p style={{ fontSize: '15px', maxWidth: '300px', lineHeight: '1.6', color: 'var(--text-muted)' }}>Sign in to save items you love and access your wishlist from any device.</p>
        <button 
          className="btn-primary" 
          style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => document.getElementById('btn-login')?.click()}
        >
          <LogIn size={18} />
          Login / Register
        </button>
      </div>
    );
  }

  const filteredItems = wishlistItems.filter(p => {
    const q = searchQuery.toLowerCase();
    return !searchQuery || 
           p.name.toLowerCase().includes(q) || 
           (p.product_code && p.product_code.toLowerCase().includes(q));
  });

  return (
    <div className="animate-fade-in" style={{ padding: '0 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>My Favorites</h1>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '100px' }}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
        </div>
      </div>
      
      {wishlistItems.length === 0 ? (
        <div className="glass" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '80px 20px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div className="glass" style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '24px',
            color: 'var(--text-muted)'
          }}>
            <HeartOff size={40} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Your wishlist is empty</h2>
          <p style={{ fontSize: '15px', maxWidth: '300px', lineHeight: '1.6' }}>Save items you love to find them later and keep track of products you're interested in.</p>
          <button 
            className="btn-primary" 
            style={{ marginTop: '32px' }}
            onClick={() => navigate('/shop')}
          >
            <ShoppingBag size={18} />
            Explore Shop
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '24px',
        }}>
          {filteredItems.map(p => (
            <ProductCard 
              key={p.id}
              name={p.name} 
              price={p.price} 
              image={p.image} 
              rating={p.rating}
              onClick={() => onProductClick(p)}
              onRemove={() => toggleWishlist(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
