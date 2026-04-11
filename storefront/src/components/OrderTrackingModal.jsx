import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Truck, Package, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { fetchOrderDetails } from '../services/api';
import { formatRelativeTime, formatDate } from '../utils/dateFormatter';


export default function OrderTrackingModal({ orderId, isOpen, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      const loadDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchOrderDetails(orderId);
          setOrder(data);
        } catch (err) {
          setError('Failed to load tracking information');
        } finally {
          setLoading(false);
        }
      };
      loadDetails();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const steps = [
    { id: 'pending', label: 'Order Placed', icon: Clock, desc: 'Your order has been received' },
    { id: 'processing', label: 'Processing', icon: Package, desc: 'We are preparing your items' },
    { id: 'shipped', label: 'Shipped', icon: Truck, desc: 'Your order is on the way' },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle, desc: 'Order has been delivered' }
  ];

  const getStatusIndex = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'delivered') return 3;
    if (s === 'shipped' || s === 'completed') return 2;
    if (['processing', 'received', 'picking', 'picked'].includes(s)) return 1;
    return 0;
  };

  const currentIndex = getStatusIndex(order?.status);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div 
        className="glass animate-scale-in w-full max-w-2xl overflow-hidden rounded-3xl" 
        style={{ background: 'var(--bg-surface)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-light)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--text-main)]">Track Order</h2>
            <span className="text-sm font-bold text-[var(--primary-blue)]">{orderId}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-main)] transition-colors text-[var(--text-muted)]">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
               <div className="w-12 h-12 border-4 border-[var(--primary-blue)] border-t-transparent rounded-full animate-spin"></div>
               <span className="text-[var(--text-muted)] font-medium">Checking status...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
               <div className="text-red-500 mb-2">⚠️</div>
               <p className="text-[var(--text-muted)]">{error}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Progress Stepper */}
              <div className="relative pt-4 pb-8">
                {/* Connector Line */}
                <div className="absolute top-[48px] left-[40px] right-[40px] h-1 bg-[var(--bg-main)] -z-10">
                   <div 
                    className="h-full bg-[var(--primary-blue)] transition-all duration-1000 ease-out"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                   ></div>
                </div>

                <div className="flex justify-between items-start">
                  {steps.map((step, idx) => {
                    const isCompleted = idx <= currentIndex;
                    const isActive = idx === currentIndex;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center text-center gap-3 w-1/4">
                        <div 
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                            isCompleted ? 'bg-[var(--primary-blue)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                          } ${isActive ? 'scale-110 ring-4 ring-blue-500/20' : ''}`}
                        >
                          <Icon size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold leading-tight ${isCompleted ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                            {step.label}
                          </span>
                          {isActive && (
                            <span className="text-[10px] text-[var(--primary-blue)] font-bold animate-pulse mt-1">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-light)] flex items-start gap-4">
                    <div className="p-2 bg-[var(--primary-blue)]/10 text-[var(--primary-blue)] rounded-xl">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Estimated Delivery</div>
                      <div className="text-sm font-bold text-[var(--text-main)]">
                         {order?.status === 'delivered' ? 'Delivered successfully' : 'Arriving in 3-5 working days'}
                      </div>
                    </div>
                 </div>
                 
                 <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-light)] flex items-start gap-4">
                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Shipping Address</div>
                      <div className="text-sm font-bold text-[var(--text-main)] line-clamp-1">
                        {order?.shipping_address}
                      </div>
                    </div>
                 </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                 <h3 className="text-sm font-extrabold text-[var(--text-muted)] uppercase tracking-widest pl-1">Order Activity</h3>
                 <div className="bg-[var(--bg-main)] rounded-2xl p-5 border border-[var(--border-light)] space-y-6">
                    {order?.logs && order.logs.length > 0 ? (
                      [...order.logs].reverse().map((log, index) => (
                        <div key={index} className="flex gap-4 relative">
                          <div className={`w-2 h-2 rounded-full mt-1.5 z-10 ${index === 0 ? 'bg-[var(--primary-blue)] ring-4 ring-blue-500/20' : 'bg-[var(--border-light)]'}`}></div>
                          {index !== order.logs.length - 1 && (
                            <div className="absolute left-[3.5px] top-4 bottom-[-24px] w-0.5 bg-[var(--border-light)]"></div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div className={`text-sm font-bold ${index === 0 ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                {log.status_key.charAt(0).toUpperCase() + log.status_key.slice(1)}: {log.message}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] font-bold">{formatRelativeTime(log.created_at)}</div>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-1">{formatDate(log.created_at)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex gap-4 relative">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary-blue)] mt-1.5 z-10 ring-4 ring-blue-500/20"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <div className="text-sm font-bold text-[var(--text-main)]">Order Placed Successfully</div>
                             <div className="text-[10px] text-[var(--text-muted)] font-bold">{formatDate(order?.created_at)}</div>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-1">Your order # {orderId} was confirmed and is awaiting pickup.</p>
                        </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Items Summary */}
              <div className="pb-2">
                 <h3 className="text-sm font-extrabold text-[var(--text-muted)] uppercase tracking-widest pl-1 mb-4">Package Contents</h3>
                 <div className="space-y-3">
                    {order?.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-[var(--bg-main)] transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-[var(--bg-main)] border border-[var(--border-light)] flex items-center justify-center overflow-hidden">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name} 
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'contain', 
                                    borderRadius: '8px' 
                                  }} 
                                />
                              ) : (
                                <Package size={16} className="text-[var(--text-muted)]" />
                              )}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-[var(--text-main)]">{item.name}</span>
                             <span className="text-[10px] text-[var(--text-muted)] font-bold">Qty: {item.qty}</span>
                           </div>
                        </div>
                        <span className="text-sm font-extrabold text-[var(--text-main)]">GH¢ {parseFloat(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-[var(--bg-main)] border-t border-[var(--border-light)] flex justify-between items-center">
           <div className="flex flex-col">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black text-[var(--primary-blue)]">GH¢ {parseFloat(order?.total_amount || 0).toFixed(2)}</span>
           </div>
           <button 
            className="px-6 py-3 bg-[var(--primary-blue)] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform flex items-center gap-2"
            onClick={onClose}
          >
            Done Tracking
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
