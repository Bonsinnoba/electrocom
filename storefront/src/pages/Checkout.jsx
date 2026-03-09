import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, ArrowLeft, ChevronRight, CheckCircle, Smartphone, MapPin, Wallet as WalletIcon, Tag } from 'lucide-react';
import { createOrder, validateCoupon } from '../services/api';

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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name && user.name !== 'Guest User' ? user.name : '',
    email: user?.email || '',
    address: user?.address || '',
    city: '',
    region: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    momoNumber: user?.phone || '',
    momoProvider: 'MTN'
  });

  // GHANA_REGIONS Moved up to use in shipping calculation
  const GHANA_REGIONS = [
    { code: 'GA-', city: 'Accra', label: 'Greater Accra (GA)', shippingFee: 20 },
    { code: 'AK-', city: 'Kumasi', label: 'Ashanti (AK)', shippingFee: 20 },
    { code: 'CR-', city: 'Cape Coast', label: 'Central (CR)', shippingFee: 95 },
    { code: 'WR-', city: 'Takoradi', label: 'Western (WR)', shippingFee: 130 },
    { code: 'ER-', city: 'Koforidua', label: 'Eastern (ER)', shippingFee: 65 },
    { code: 'VR-', city: 'Ho', label: 'Volta (VR)', shippingFee: 105 },
    { code: 'NR-', city: 'Tamale', label: 'Northern (NR)', shippingFee: 170 },
    { code: 'UE-', city: 'Bolgatanga', label: 'Upper East (UE)', shippingFee: 180 },
    { code: 'UW-', city: 'Wa', label: 'Upper West (UW)', shippingFee: 20 },
    { code: 'BA-', city: 'Sunyani', label: 'Brong Ahafo (BA)', shippingFee: 85 },
    { code: 'WN-', city: 'Sefwi Wiawso', label: 'Western North (WN)', shippingFee: 145 },
    { code: 'AH-', city: 'Goaso', label: 'Ahafo (AH)', shippingFee: 90 },
    { code: 'BE-', city: 'Techiman', label: 'Bono East (BE)', shippingFee: 85 },
    { code: 'OR-', city: 'Dambai', label: 'Oti (OR)', shippingFee: 170 },
    { code: 'NE-', city: 'Nalerigu', label: 'North East (NE)', shippingFee: 190 },
    { code: 'SR-', city: 'Damongo', label: 'Savannah (SR)', shippingFee: 95 },
  ];

  const calculateShipping = () => {
    // Orders exceeding 1000 threshold get free shipping
    if (subtotal > 1000) return 0;
    
    // Base fee Calculation prioritizes explicit Region selection
    if (formData.region) {
       const exactRegion = GHANA_REGIONS.find(r => r.code === formData.region);
       if (exactRegion) {
         return exactRegion.shippingFee;
       }
    }

    // Check for ZIP input as fallback
    if (formData.zip) {
       const uZip = formData.zip.toUpperCase();
       const exactRegion = GHANA_REGIONS.find(r => uZip.startsWith(r.code));
       if (exactRegion) {
         return exactRegion.shippingFee;
       }
    }
    // Default base delivery fee if zip/region is missing
    return 20; 
  };

  const shippingFee = calculateShipping();
  const tax = subtotal * 0.1;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Math.max(0, subtotal - discount + tax + shippingFee);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
        const result = await validateCoupon(couponCode, subtotal);
        if (result.success) {
            setAppliedCoupon(result.coupon);
            addNotification('Coupon applied successfully', 'success');
            setCouponCode('');
        } else {
            setCouponError(result.error || 'Invalid coupon code');
        }
    } catch {
        setCouponError('Error validating coupon. Please try again.');
    } finally {
        setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

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
            shipping_address: `${formData.address}, ${formData.city}, ${GHANA_REGIONS.find(r => r.code === formData.region)?.label || ''} ${formData.zip}`,
            payment_method: `${paymentMethod === 'momo' ? 'Mobile Money' : 'Card'}`,
            payment_reference: reference.reference, // Secure reference
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            discount_amount: discount
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'zip') {
        const uppercaseValue = value.toUpperCase();
        // Check if the input matches any prefix roughly
        const regionMatch = GHANA_REGIONS.find(r => uppercaseValue.startsWith(r.code));
        
        setFormData(prev => ({
            ...prev,
            zip: uppercaseValue, // Force uppercase for digital address
            // Only auto-fill city/region if they are currently empty
            city: (regionMatch && !prev.city) ? regionMatch.city : prev.city,
            region: (regionMatch && !prev.region) ? regionMatch.code : prev.region
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
    if (!formData.address.trim()) newErrors.address = 'Address or Landmark is required';
    if (!formData.city.trim()) newErrors.city = 'City/Town is required';
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.zip.trim()) newErrors.zip = 'Digital Address (GPS) is required';
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

  // Check if user is verified before allowing checkout
  if (user && user.role === 'customer' && parseInt(user.id_verified) === 0) {
    return (
      <div className="card glass animate-fade-in" style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px' 
        }}>
          <ShieldCheck size={40} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>Verification Required</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 32px', lineHeight: '1.6' }}>
          To ensure the safety of our premium products and comply with regional regulations, we require all customers to verify their identity with a Ghana Card before making a purchase.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link to="/" className="btn-secondary">
            Return to Store
          </Link>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/verify-id')}
          >
            Complete Verification
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

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
              {user?.address && (
                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--info-bg)', borderRadius: '12px', fontSize: '14px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <MapPin size={20} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Using Saved Location</strong>
                    <span style={{ opacity: 0.9 }}>We've pre-filled your shipping details from your profile. You can edit them below or enter a new location for this specific order.</span>
                  </div>
                </div>
              )}
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Street Address / Landmark</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={`input-premium ${errors.address ? 'error' : ''}`} placeholder="e.g. 123 Main St OR Near the Shell Fuel Station" />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Town / City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={`input-premium ${errors.city ? 'error' : ''}`} placeholder="e.g. Accra" />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Region</label>
                    <select 
                      name="region" 
                      value={formData.region} 
                      onChange={handleChange} 
                      className={`input-premium ${errors.region ? 'error' : ''}`}
                      style={{ appearance: 'auto' }}
                    >
                      <option value="">Select Region</option>
                      {GHANA_REGIONS.map(r => (
                        <option key={r.code} value={r.code}>{r.label}</option>
                      ))}
                    </select>
                    {errors.region && <span className="form-error">{errors.region}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Country</label>
                      <input type="text" value="Ghana" disabled className="input-premium" style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-main)' }} />
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>* Shipping only available in Ghana</div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Ghana Post GPS / ZIP</label>
                    <input 
                      type="text" 
                      name="zip" 
                      value={formData.zip} 
                      onChange={handleChange} 
                      className={`input-premium ${errors.zip ? 'error' : ''}`} 
                      placeholder="e.g. GA-123-4567" 
                    />
                    {errors.zip && <span className="form-error">{errors.zip}</span>}
                    <div style={{ marginTop: '6px' }}>
                      <a 
                        href="https://ghanapostgps.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '12px', color: 'var(--primary-blue)', textDecoration: 'underline' }}
                      >
                        Don't know your digital address? Find it here.
                      </a>
                    </div>
                  </div>
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
              {appliedCoupon && (
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} />
                    <span>Discount ({appliedCoupon.code})</span>
                  </div>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                  <span style={{ fontSize: '10px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                    {subtotal > 1000 ? 'Free Shipping (Special Promo)' : (formData.region ? `Standard Rate (${GHANA_REGIONS.find(r => r.code === formData.region)?.label.split('(')[0].trim()})` : 'Base delivery rate')}
                  </span>
                </div>
                <span style={{ color: shippingFee === 0 ? '#22c55e' : 'var(--text-main)', fontWeight: shippingFee === 0 ? 700 : 500 }}>
                   {shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, marginTop: '12px' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary-blue)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            {!appliedCoupon ? (
              <div style={{ marginTop: '20px', paddingop: '20px', borderTop: '1px dashed var(--border-light)' }}>
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                  <input 
                    type="text" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)} 
                    placeholder="Enter Promo Code" 
                    className="input-premium" 
                    style={{ flex: 1, padding: '10px 14px' }} 
                  />
                  <button 
                    onClick={handleApplyCoupon} 
                    disabled={isApplyingCoupon || !couponCode.trim()} 
                    className="btn-secondary" 
                    style={{ padding: '10px 16px' }}
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{couponError}</div>}
              </div>
            ) : (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed var(--border-light)' }}>
                 <button onClick={handleRemoveCoupon} className="btn-outline" style={{ width: '100%', fontSize: '13px', padding: '10px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    Remove Coupon
                 </button>
              </div>
            )}
            
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
