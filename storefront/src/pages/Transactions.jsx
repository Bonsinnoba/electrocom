import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';
import { CreditCard, History, Smartphone, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Transactions() {
  const { transactions, paymentMethods } = useWallet();
  const { formatPrice } = useSettings();

  return (
    <div className="transactions-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px', 
      padding: '0 16px 48px',
      width: '100%'
    }}>
      <div className="page-header" style={{ padding: '24px 0 8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Receipt size={32} className="text-blue" />
          Transactions
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Track your spending and manage your saved payment methods.</p>
      </div>

      {/* Row 1: Transaction History - Moved to top as it's now primary */}
      <div className="card glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
            <History size={20} /> Transaction History
          </div>
          <button className="btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>View All Activity</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {transactions.length > 0 ? transactions.map(tx => (
            <div key={tx.id} className="glass" style={{ 
              padding: '16px', 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: tx.type === 'credit' ? 'var(--success-bg)' : 'var(--danger-bg)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: tx.type === 'credit' ? 'var(--success)' : 'var(--danger)' 
                }}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{tx.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.date} • {tx.details}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: tx.type === 'credit' ? 'var(--success)' : 'var(--text-main)', fontWeight: 800, fontSize: '18px' }}>
                  {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)}
                </div>
                <div style={{ fontSize: '10px', color: tx.type === 'credit' ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>{tx.status}</div>
              </div>
            </div>
          )) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent transactions found.
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Payment Methods */}
      <div className="card glass" style={{ padding: '24px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <CreditCard size={20} /> Saved Payment Methods
        </div>
        <div className="payment-methods-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
        }}>
          {paymentMethods.length > 0 ? paymentMethods.map(method => (
            <div key={method.id} style={{ 
              background: method.type === 'visa' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #fbbf24, #d97706)', 
              borderRadius: '20px', 
              padding: '24px', 
              color: method.type === 'visa' ? 'white' : '#1a1a1a',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '1.6 / 1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {method.type === 'momo' && <Smartphone size={24} />}
                  <span style={{ fontSize: method.type === 'visa' ? '20px' : '18px', fontWeight: 800, fontStyle: method.type === 'visa' ? 'italic' : 'normal', letterSpacing: '1px' }}>
                    {method.label}
                  </span>
                </div>
                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}>
                  {method.isPrimary ? 'Primary' : (method.status || 'Active')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '22px', letterSpacing: method.type === 'visa' ? '3px' : '1px', marginBottom: '16px', fontFamily: method.type === 'visa' ? 'monospace' : 'inherit', fontWeight: method.type === 'visa' ? 400 : 700 }}>
                  {method.type === 'visa' ? `•••• •••• •••• ${method.last4}` : method.number}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>{method.type === 'visa' ? 'Card Holder' : 'Linked Name'}</span>
                    <span style={{ fontWeight: 600 }}>{method.holder}</span>
                  </div>
                  {method.type === 'visa' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Expires</span>
                      <span style={{ fontWeight: 600 }}>{method.expiry}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px', background: 'white', opacity: 0.03, borderRadius: '50%' }}></div>
            </div>
          )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No saved payment methods</div>
          )}
        </div>
      </div>
    </div>
  );
}
