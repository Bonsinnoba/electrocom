import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Lock, Mail, LogIn, UserPlus, Phone, Loader, Globe, Eye, EyeOff, Facebook, Linkedin, Chrome } from 'lucide-react';
import { loginUser, registerUser, verifyUser } from '../services/api';
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
    confirmPassword: '',
    verification_method: 'email'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUser, setTempUser] = useState(null);

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
        if (isSignUp) {
          // Move to verification step
          setTempUser(response.data.user);
          setVerificationStep(true);
        } else {
          // Direct login
          updateUser(response.data.user);
          localStorage.setItem('ehub_user', JSON.stringify(response.data.user));
          onClose(response.data.user);
          setFormData({ name: '', email: '', phone: '', country: 'Ghana', password: '', confirmPassword: '', verification_method: 'email' });
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

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationCode) return;
    
    setLoading(true);
    try {
      const response = await verifyUser(tempUser.id, verificationCode);
      if (response.success) {
        updateUser(tempUser);
        localStorage.setItem('ehub_user', JSON.stringify(tempUser));
        onClose(tempUser);
        setFormData({ name: '', email: '', phone: '', country: 'Ghana', password: '', confirmPassword: '', verification_method: 'email' });
        setVerificationStep(false);
        setTempUser(null);
        navigate('/profile');
      } else {
        setError(response.message || "Invalid verification code.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-backdrop active`} onClick={onClose}>
      <div className={`auth-modal modal glass animate-scale-in ${isSignUp ? 'right-panel-active' : ''}`} onClick={(e) => e.stopPropagation()} style={{ position: 'relative', overflow: 'hidden' }}>
        <button 
          className="btn-secondary modal-close-btn" 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            width: '36px', 
            height: '36px', 
            padding: 0, 
            borderRadius: '50%',
            zIndex: 1000
          }}
        >
          <X size={20} />
        </button>

        {/* --- SIGN UP CONTAINER --- */}
        <div className="form-container sign-up-container">
          <form onSubmit={verificationStep ? handleVerify : handleSubmit}>
            <h1>{verificationStep ? 'Verify' : 'Create Account'}</h1>
            {!verificationStep && (
              <div className="social-container">
                <a href="#" className="social" title="Facebook"><Facebook size={20} /></a>
                <a href="#" className="social" title="Google"><Chrome size={20} /></a>
                <a href="#" className="social" title="LinkedIn"><Linkedin size={20} /></a>
              </div>
            )}
            {!verificationStep && <span>or use your email for registration</span>}
            
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-form-scroll">
              {verificationStep ? (
                <div className="animate-fade-in">
                  <div className="form-group">
                    <label>Verification Code</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        value={verificationCode} 
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code" 
                        required 
                        autoFocus 
                        style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? <Loader className="animate-spin" size={18} /> : 'Verify Account'}
                  </button>
                </div>
              ) : (
                <>
                  {step === 1 ? (
                    <div className="animate-slide-down">
                      <div className="form-group">
                        <label><User size={14} /> Full Name</label>
                        <div className="input-wrapper">
                          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required autoFocus />
                        </div>
                      </div>
                      <div className="form-group">
                        <label><Mail size={14} /> Email</label>
                        <div className="input-wrapper">
                          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label><Phone size={14} /> Phone</label>
                        <div className="input-wrapper">
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required />
                        </div>
                      </div>
                      <button type="button" className="btn-primary" onClick={handleNextStep} style={{ width: '100%', marginTop: '10px' }}>Next Step</button>
                    </div>
                  ) : (
                    <div className="animate-slide-down">
                      <div className="form-group">
                        <label><Lock size={14} /> Password</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                          <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" required autoFocus />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label><Lock size={14} /> Confirm</label>
                        <div className="input-wrapper">
                          <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" required />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                        <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                          {loading ? <Loader className="animate-spin" size={18} /> : 'Sign Up'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Mobile Toggle */}
            <p className="mobile-only-text">
              Already have an account? <button type="button" className="toggle-auth-btn" onClick={() => setIsSignUp(false)}>Sign In</button>
            </p>
          </form>
        </div>

        {/* --- SIGN IN CONTAINER --- */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSubmit}>
            <h1>Sign In</h1>
            <div className="social-container">
              <a href="#" className="social" title="Facebook"><Facebook size={20} /></a>
              <a href="#" className="social" title="Google"><Chrome size={20} /></a>
              <a href="#" className="social" title="LinkedIn"><Linkedin size={20} /></a>
            </div>
            <span>or use your account</span>
            
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label><Mail size={14} /> Email</label>
              <div className="input-wrapper">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
              </div>
            </div>
            <div className="form-group">
              <div className="label-row">
                <label><Lock size={14} /> Password</label>
                <a href="#" className="forgot-link">Forgot?</a>
              </div>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <Loader className="animate-spin" size={18} /> : 'Sign In'}
            </button>
            
            {/* Mobile Toggle */}
            <p className="mobile-only-text">
              Don't have an account? <button type="button" className="toggle-auth-btn" onClick={() => setIsSignUp(true)}>Sign Up</button>
            </p>
          </form>
        </div>

        {/* --- OVERLAY CONTAINER --- */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost-btn" id="signIn" onClick={() => setIsSignUp(false)}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost-btn" id="signUp" onClick={() => setIsSignUp(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
