import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, ArrowLeft, ChevronRight, CheckCircle, Smartphone, Wallet as WalletIcon } from 'lucide-react';
import { createOrder } from '../services/api';

import { usePaystackPayment } from 'react-paystack';

export default function Checkout() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { addNotification } = useNotifications();
  const { balance, deductBalance, addTransaction } = useWallet();
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    momoNumber: '',
    momoProvider: 'MTN'
  });

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // Paystack Configuration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: formData.email,
    amount: Math.ceil(total * 100), // Amount in lowest currency unit (e.g., kobo/pesewas)
    publicKey: 'pk_test_85123d385802319ef58661644155554626155555', // REPLACE WITH YOUR ACTUAL PUBLIC KEY
    currency: 'GHS',
    channels: paymentMethod === 'momo' ? ['mobile_money'] : ['card', 'mobile_money'],
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference) => {
      // Payment was successful, create order
      try {
        const orderData = {
            user_id: user ? user.id : 1,
            total_amount: total,
            items: cartItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: parseFloat(item.price)
            })),
            shipping_address: `${formData.address}, ${formData.city} ${formData.zip}`,
            payment_method: `${paymentMethod === 'momo' ? 'Mobile Money' : 'Card'}`,
            payment_reference: reference.reference // Secure reference
        };

        const response = await createOrder(orderData);

        if (response.success) {
            addNotification('Payment successful! Order placed.', 'success');
            clearCart();
            navigate('/');
        } else {
            throw new Error(response.error || 'Order creation failed after payment');
        }
      } catch (error) {
          console.error(error);
          addNotification(error.message || 'Failed to place order', 'error');
      } finally {
          setLoading(false);
      }
  };

  const onClose = () => {
      setLoading(false);
      addNotification('Payment cancelled', 'info');
  };

  const GHANA_REGIONS = [
    { code: 'GA-', city: 'Accra', label: 'Greater Accra (GA)' },
    { code: 'AK-', city: 'Kumasi', label: 'Ashanti (AK)' },
    { code: 'CR-', city: 'Cape Coast', label: 'Central (CR)' },
    { code: 'WR-', city: 'Takoradi', label: 'Western (WR)' },
    { code: 'ER-', city: 'Koforidua', label: 'Eastern (ER)' },
    { code: 'VR-', city: 'Ho', label: 'Volta (VR)' },
    { code: 'NR-', city: 'Tamale', label: 'Northern (NR)' },
    { code: 'UE-', city: 'Bolgatanga', label: 'Upper East (UE)' },
    { code: 'UW-', city: 'Wa', label: 'Upper West (UW)' },
    { code: 'BA-', city: 'Sunyani', label: 'Brong Ahafo (BA)' },
    { code: 'WN-', city: 'Sefwi Wiawso', label: 'Western North (WN)' },
    { code: 'AH-', city: 'Goaso', label: 'Ahafo (AH)' },
    { code: 'BE-', city: 'Techiman', label: 'Bono East (BE)' },
    { code: 'OR-', city: 'Dambai', label: 'Oti (OR)' },
    { code: 'NE-', city: 'Nalerigu', label: 'North East (NE)' },
    { code: 'SR-', city: 'Damongo', label: 'Savannah (SR)' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'zip') {
        const uppercaseValue = value.toUpperCase();
        // Check if the input matches any prefix roughly
        const regionMatch = GHANA_REGIONS.find(r => uppercaseValue.startsWith(r.code));
        
        setFormData(prev => ({
            ...prev,
            zip: uppercaseValue, // Force uppercase for digital address
            // Only auto-fill city if it's currently empty or previously auto-filled (simple check: if empty)
            city: (regionMatch && !prev.city) ? regionMatch.city : prev.city
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCompletePurchase = async () => {
    setLoading(true);

    if (paymentMethod === 'card' || paymentMethod === 'momo') {
        // Trigger Paystack
        initializePayment(onSuccess, onClose);
    } else {
        addNotification('Payment method not supported yet', 'info');
        setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }


  const [errors, setErrors] = useState({});

  const validateShipping = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors = {};
    // For Paystack, we largely rely on their modal, but we can validate basic contact info again
    if (paymentMethod === 'momo') {
        // Optional: Validate if we want to capture it in our DB even if Paystack asks for it
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (nextStep) => {
    if (step === 1 && !validateShipping()) return;
    if (step === 2 && nextStep === 3 && !validatePayment()) return;
    setStep(nextStep);
  };

  return (
    <div className="card glass animate-fade-in" style={{ height: '100%', overflowY: 'auto', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link to="/cart" className="sidebar-icon" style={{ margin: 0 }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Checkout</h1>
      </div>

      <div className="checkout-steps" style={{ display: 'flex', gap: '24px', marginBottom: '40px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        {[
          { icon: <Truck size={18} />, label: 'Shipping' },
          { icon: <CreditCard size={18} />, label: 'Payment' },
          { icon: <CheckCircle size={18} />, label: 'Review' }
        ].map((s, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: step === i + 1 ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: step === i + 1 ? 700 : 500,
            transition: 'all 0.3s'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: step === i + 1 ? 'var(--primary-blue)' : 'var(--bg-main)',
              color: step === i + 1 ? 'white' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              {i + 1}
            </div>
            <span>{s.label}</span>
            {i < 2 && <ChevronRight size={16} color="var(--border-light)" />}
          </div>
        ))}
      </div>

      <div className="checkout-content" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '40px' }}>
        <div className="form-section">
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Shipping Information</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={`input-premium ${errors.name ? 'error' : ''}`} placeholder="John Doe" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input-premium ${errors.email ? 'error' : ''}`} placeholder="john@example.com" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Street Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={`input-premium ${errors.address ? 'error' : ''}`} placeholder="123 Main Street" />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={`input-premium ${errors.city ? 'error' : ''}`} placeholder="Accra" />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Zip / Digital Address (GPS)</label>
                    <input 
                      type="text" 
                      name="zip" 
                      value={formData.zip} 
                      onChange={handleChange} 
                      className={`input-premium ${errors.zip ? 'error' : ''}`} 
                      placeholder="GA-123-4567" 
                      list="ghana-zip-codes"
                    />
                    <datalist id="ghana-zip-codes">
                      {GHANA_REGIONS.map(r => (
                        <option key={r.code} value={r.code}>{r.label}</option>
                      ))}
                    </datalist>
                    {errors.zip && <span className="form-error">{errors.zip}</span>}
                  </div>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Country</label>
                    <input type="text" value="Ghana" disabled className="input-premium" style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-main)' }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>* Shipping currently available only in Ghana</div>
                </div>

              </div>
              <button className="btn-primary" style={{ marginTop: '32px', width: '100%' }} onClick={() => handleNextStep(2)}>
                Continue to Payment
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Payment Method</h3>
              <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                <div 
                  onClick={() => setPaymentMethod('card')}
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    background: paymentMethod === 'card' ? 'var(--bg-surface)' : 'var(--bg-main)', 
                    border: paymentMethod === 'card' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <CreditCard size={24} color={paymentMethod === 'card' ? 'var(--primary-blue)' : 'var(--text-muted)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Credit or Debit Card</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pay securely with your Visa, Mastercard, or Amex</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentMethod === 'card' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-blue)' }}></div>}
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('paypal')}
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    background: paymentMethod === 'paypal' ? 'var(--bg-surface)' : 'var(--bg-main)', 
                    border: paymentMethod === 'paypal' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" style={{ height: '18px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>PayPal</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You will be redirected to PayPal to complete your purchase</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentMethod === 'paypal' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-blue)' }}></div>}
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('apple')}
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    background: paymentMethod === 'apple' ? 'var(--bg-surface)' : 'var(--bg-main)', 
                    border: paymentMethod === 'apple' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Apple Pay</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fast and secure checkout with Apple Pay</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentMethod === 'apple' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-blue)' }}></div>}
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod('momo')}
                  style={{ 
                    padding: '20px', 
                    borderRadius: '16px', 
                    background: paymentMethod === 'momo' ? 'var(--bg-surface)' : 'var(--bg-main)', 
                    border: paymentMethod === 'momo' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Smartphone size={24} color={paymentMethod === 'momo' ? 'var(--primary-blue)' : 'var(--text-muted)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Mobile Money</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pay with M-Pesa, MTN, or Airtel Money</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentMethod === 'momo' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-blue)' }}></div>}
                  </div>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="animate-fade-in" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CreditCard size={24} />
                    <div>
                        <strong>Secure Credit/Debit Card Payment</strong>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>You will be redirected to Paystack's secure checkout to enter your card details.</div>
                    </div>
                </div>
              )}

              {paymentMethod === 'momo' && (
                <div className="animate-fade-in" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Smartphone size={24} />
                    <div>
                        <strong>Mobile Money Payment</strong>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>You will be redirected to Paystack to complete your payment via M-Pesa, MTN, or Airtel Money.</div>
                    </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={() => setStep(3)}>
                  Review Order
                  <ShieldCheck size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>Final Review</h3>
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700 }}>Shipping to:</span>
                    <button className="btn-outline" onClick={() => setStep(1)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', borderWeight: '1px' }}>Edit</button>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {formData.name}<br />
                    {formData.address}, {formData.city} {formData.zip}<br />
                    {formData.email}
                  </div>
                </div>
                <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700 }}>Payment Method:</span>
                    <button className="btn-outline" onClick={() => setStep(2)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', borderWeight: '1px' }}>Edit</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    {paymentMethod === 'card' ? (
                      <>
                        <CreditCard size={16} />
                        <span>Credit/Debit Card (via Paystack)</span>
                      </>
                    ) : paymentMethod === 'paypal' ? (
                      <span>PayPal</span>
                    ) : paymentMethod === 'apple' ? (
                      <span>Apple Pay</span>
                    ) : (
                      <>
                        <Smartphone size={16} />
                        <span>Mobile Money (via Paystack)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={handleCompletePurchase}>
                  <CheckCircle size={18} />
                  Complete Purchase
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="summary-section">
          <div style={{ padding: '24px', borderRadius: '24px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', position: 'sticky', top: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.map(item => (
                <div key={`${item.id}-${item.selectedColor}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ height: '1px', background: 'var(--border-light)', margin: '12px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, marginTop: '12px' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary-blue)' }}>${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} />
              <span>Secure checkout enabled</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .input-premium {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-light);
          background: var(--bg-surface);
          color: var(--text-main);
          outline: none;
          transition: border-color 0.2s;
        }
        .input-premium:focus {
          border-color: var(--primary-blue);
        }
        @media (max-width: 1024px) {
          .checkout-content {
            grid-template-columns: 1fr !important;
          }
          .summary-section {
            order: -1;
          }
        }
      `}} />
    </div>
  );
}
