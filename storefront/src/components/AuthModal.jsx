import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Lock, Mail, LogIn, UserPlus, Phone, Loader, Globe, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';
import { useUser } from '../context/UserContext';

export default function AuthModal({ isOpen, onClose, loginMessage }) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const { updateUser } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Ghana',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNextStep = () => {
      if (formData.country !== 'Ghana') {
          setError("Our products and services do not extend to your location yet. We are working hard to reach you soon!");
          return;
      }
      if (!formData.name || !formData.email || !formData.phone) {
          setError("Please fill in all fields.");
          return;
      }
      setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp && step === 1) {
      handleNextStep();
      return;
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isSignUp) {
        response = await registerUser(formData);
      } else {
        response = await loginUser({ email: formData.email, password: formData.password });
      }

      if (response.success && response.data && response.data.user) {
        updateUser(response.data.user);
        // Store user in localstorage for persistence
        localStorage.setItem('ehub_user', JSON.stringify(response.data.user));
        
        // Pass the user object to onClose if needed, or rely on App.jsx state change
        onClose(response.data.user); 
        
        // Reset form
        setFormData({ name: '', email: '', phone: '', country: 'Ghana', password: '', confirmPassword: '' });
        
        // Redirect to profile if it was a new account creation
        if (isSignUp) {
          navigate('/profile');
        }
      } else {
          setError(response.message || "Authentication failed. Please check your credentials.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-backdrop active`} onClick={onClose}>
      <div className="auth-modal modal glass animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <button 
          className="btn-secondary" 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            width: '36px', 
            height: '36px', 
            padding: 0, 
            borderRadius: '50%',
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>
        
        <div className="modal-header">
          <h2>
            {loginMessage || (isSignUp ? 'Create Account' : 'Welcome Back')}
            {isSignUp && <span style={{fontSize: '0.6em', opacity: 0.6, marginLeft: '10px'}}>Step {step} of 2</span>}
          </h2>
          <p>{isSignUp ? (step === 1 ? 'Let\'s start with your details' : 'Secure your account') : (loginMessage ? 'Please sign in to continue' : 'Enter your credentials to access your dashboard')}</p>
        </div>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '13px', background: 'var(--danger-bg)', padding: '12px', borderRadius: '8px', lineHeight: '1.4', flexShrink: 0 }}>{error}</div>}

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {(isSignUp && step === 1) && (
            <div className="animate-slide-down">
                <div className="form-group">
                <label><User size={14} /> Full Name</label>
                <div className="input-wrapper">
                    <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="John Doe" 
                    required 
                    autoFocus 
                    />
                </div>
                </div>

                <div className="form-group">
                <label><Mail size={14} /> Email Address</label>
                <div className="input-wrapper">
                    <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="john.doe@example.com" 
                    required 
                    />
                </div>
                </div>

                <div className="form-group">
                <label><Phone size={14} /> Phone Number</label>
                <div className="input-wrapper">
                    <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="(+233) 567-891-234" 
                    required
                    />
                </div>
                </div>

                <div className="form-group">
                <label><Globe size={14} /> Country</label>
                <div className="input-wrapper">
                    <select 
                        name="country" 
                        value={formData.country} 
                        onChange={handleChange}
                        className="input-premium"
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-main)', outline: 'none' }}
                    >
                        <option value="Ghana">Ghana</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Togo">Togo</option>
                        <option value="Ivory Coast">Ivory Coast</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                </div>
            </div>
          )}

          {/* Email: Visible in Sign In ONLY (since it's now inside Step 1 block for SignUp) */}
          {(!isSignUp) && (
            <div className="form-group">
              <label><Mail size={14} /> Email Address</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="john.doe@example.com" 
                  required 
                />
              </div>
            </div>
          )}

          {/* Password: Visible in Sign In AND Sign Up Step 2 */}
          {(!isSignUp || (isSignUp && step === 2)) && (
            <div className="form-group animate-slide-down">
              <div className="label-row">
                <label><Lock size={14} /> Password</label>
                {!isSignUp && <a href="#" className="forgot-link">Forgot?</a>}
              </div>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="••••••••" 
                  required 
                  autoFocus={isSignUp && step === 2} 
                  style={{ paddingRight: '45px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm Password */}
          {(isSignUp && step === 2) && (
            <div className="form-group animate-slide-down">
              <label><Lock size={14} /> Confirm Password</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="••••••••" 
                  required 
                  style={{ paddingRight: '45px' }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isSignUp ? (
             // Sign In Button
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : <><LogIn size={18} /> Sign In</>}
            </button>
          ) : (
            // Sign Up Buttons
            <div style={{ display: 'flex', gap: '12px' }}>
              {step === 2 && (
                <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{flex: 1}} disabled={loading}>
                  Back
                </button>
              )}
              {step === 1 ? (
                <button type="button" className="btn-primary" onClick={handleNextStep} style={{ width: '100%' }}>
                  Next Step
                </button>
              ) : (
                 <button type="submit" className="btn-primary" style={{flex: 2}} disabled={loading}>
                  {loading ? <Loader className="animate-spin" size={18} /> : <><UserPlus size={18} /> Create Account</>}
                </button>
              )}
            </div>
          )}
        </form>
        </div>

        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
            <button 
              className="toggle-auth-btn" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStep(1);
                setError('');
              }}
            >
              {isSignUp ? 'Sign In' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
