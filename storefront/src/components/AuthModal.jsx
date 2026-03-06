import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Lock, Mail, LogIn, UserPlus, Phone, Loader, Globe, Eye, EyeOff, Facebook, Linkedin, Chrome, Github, ArrowLeft } from 'lucide-react';
import { loginUser, registerUser, verifyUser, forgotPassword } from '../services/api';
import { useUser } from '../context/UserContext';


export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setStep(1);
    } else {
      // cleanup camera and photo when modal closes
      stopCapture();
      setIdPhoto('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setHasCamera(true);
    }
  }, []);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const { updateUser } = useUser();
  
  // process social login callback parameters if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('social_token');
    const err = params.get('social_error');
    const encodedUser = params.get('social_user');
    if (token) {
      localStorage.setItem('ehub_token', token);
      if (encodedUser) {
        try {
          const userObj = JSON.parse(atob(encodedUser));
          updateUser(userObj);
        } catch (e) {
          console.warn('Failed to parse social user', e);
        }
      }
      // clean up query string to avoid reprocessing
      window.history.replaceState(null, '', window.location.pathname);
      onClose && onClose();
    }
    if (err) {
      setError(err);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Ghana',
    password: '',
    confirmPassword: '',
    verification_method: 'email',
    id_number: '',
    id_photo: '' // base64 from camera scan
  });
  const [capturing, setCapturing] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [idPhoto, setIdPhoto] = useState('');
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCapturing(true);
    } catch (err) {
      console.error('Camera error', err);
      setError('Unable to access camera');
    }
  };

  const stopCapture = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setCapturing(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const data = canvas.toDataURL('image/png');
      setIdPhoto(data);
      setFormData(prev => ({ ...prev, id_photo: data }));
      stopCapture();
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMethod, setForgotPasswordMethod] = useState('email'); // 'email' or 'sms'
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNextStep = () => {
      setError('');
      if (step === 1) {
          if (!formData.name || !formData.email) {
              setError('Please enter both name and email.');
              return;
          }
          setStep(2);
      } else if (step === 2) {
          if (formData.country !== 'Ghana') {
              setError("Our products and services do not extend to your location yet. We are working hard to reach you soon!");
              return;
          }
          if (!formData.phone) {
              setError('Please enter your phone number.');
              return;
          }
          setStep(3);
      } else if (step === 3) {
          if (!formData.id_number) {
              setError('Please enter your ID number or click "Skip for now"');
              return;
          }
          if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(formData.id_number)) {
              setError('Ghana card number format seems incorrect. Do not include spaces.');
              return;
          }
          if (!formData.id_photo) {
              setError('Please scan the face on your Ghana card or click "Skip for now"');
              return;
          }
          setStep(4);
      }
  };

  const handleSkipVerification = () => {
    setFormData(prev => ({ ...prev, id_number: '', id_photo: '' }));
    setIdPhoto('');
    setError('');
    setStep(4);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp && step === 1) {
      handleNextStep();
      return;
    }

    if (isSignUp && step < 4) {
      return; // Only submit on step 4 (password step)
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
          onClose(response.data.user);
          setFormData({ name: '', email: '', phone: '', country: 'Ghana', password: '', confirmPassword: '', verification_method: 'email', id_number: '', id_photo: '' });
        }
      } else if (response.needs_verification) {
          setTempUser(response.user);
          setVerificationStep(true);
          setError(response.message);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) return;
    setLoading(true);
    setForgotPasswordStatus({ type: '', message: '' });
    try {
        const response = await forgotPassword(forgotPasswordEmail, forgotPasswordMethod);
        if (response.success) {
            setForgotPasswordStatus({ type: 'success', message: response.message });
        } else {
            setForgotPasswordStatus({ type: 'error', message: response.message || 'Failed to send reset link.' });
        }
    } catch (err) {
        setForgotPasswordStatus({ type: 'error', message: 'Connection error. Please try again.' });
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
        setFormData({ name: '', email: '', phone: '', country: 'Ghana', password: '', confirmPassword: '', verification_method: 'email', id_number: '', id_photo: '' });
        setVerificationStep(false);
        setTempUser(null);
        navigate('/profile');
      } else {
        setError(response.message || "Invalid verification code.");
      }
    } catch (err) {
      console.error(err);
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
            {!verificationStep && isSignUp && (
              <div className="step-dots">
                {[1,2,3,4].map(n => (
                  <span key={n} className={`dot${step===n ? ' active' : ''}`} />
                ))}
              </div>
            )}

            <div className="auth-form-scroll">
              {error && <div className="auth-error">{error}</div>}

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
                      <button type="button" className="btn-primary" onClick={handleNextStep} style={{ width: '100%', marginTop: '10px' }}>Next Step</button>
                    </div>
                  ) : step === 2 ? (
                    <div className="animate-slide-down">
                      <div className="form-group">
                        <label><Phone size={14} /> Phone</label>
                        <div className="input-wrapper">
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" required autoFocus />
                        </div>
                      </div>
                      <div className="form-group">
                        <label><Globe size={14} /> Country</label>
                        <div className="input-wrapper">
                          <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" required />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                        <button type="button" className="btn-primary" onClick={handleNextStep} style={{ flex: 2 }}>Next Step</button>
                      </div>
                    </div>
                  ) : step === 3 ? (
                    <div className="animate-slide-down compact">
                      
                      <div className="form-group">
                        <label>ID Number</label>
                        <div className="input-wrapper">
                          <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} placeholder="Enter Ghana card number (e.g. GHA-1234-5678)" required autoComplete="off" spellCheck="false" />
                        </div>
                      </div>

                      {/* face scan for Ghana card */}
                        <div className="form-group">
                          <label>Scan Face on Card</label>
                          {idPhoto ? (
                            <img src={idPhoto} alt="ID scan" style={{ width: '100%', borderRadius: '12px', marginBottom: '10px' }} />
                          ) : hasCamera ? (
                            <button type="button" className="btn-secondary" onClick={startCapture} style={{ marginBottom: '10px' }}>
                              {capturing ? 'Capturing...' : 'Start Face Scan'}
                            </button>
                          ) : (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const data = reader.result;
                                      setIdPhoto(data);
                                      setFormData(prev => ({ ...prev, id_photo: data }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)' }}>
                                No camera detected; upload a photo of the card face.
                              </small>
                            </div>
                          )}
                          {capturing && (
                            <>
                              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', marginBottom: '10px' }} />
                              <button type="button" className="btn-primary" onClick={takePhoto} style={{ marginBottom: '10px' }}>
                                Capture
                              </button>
                              <button type="button" className="btn-secondary" onClick={stopCapture}>
                                Cancel
                              </button>
                            </>
                          )}
                          <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="button" className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Back</button>
                          <button type="button" className="btn-primary" onClick={handleNextStep} style={{ flex: 2 }}>Next Step</button>
                        </div>
                        <button type="button" className="btn-outline" onClick={handleSkipVerification} style={{ width: '100%', border: 'none', color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'underline' }}>
                          Skip verification for now (Restricted access)
                        </button>
                      </div>
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
                        <button type="button" className="btn-secondary" onClick={() => setStep(3)} style={{ flex: 1 }}>Back</button>
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
          {!isForgotPassword ? (
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <h1>Sign In</h1>
              <div className="social-container">
                <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/social_auth.php?provider=facebook`} className="social" title="Sign in with Facebook"><Facebook size={20} /></a>
                <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/social_auth.php?provider=google`} className="social" title="Sign in with Google"><Chrome size={20} /></a>
                <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/social_auth.php?provider=github`} className="social" title="Sign in with GitHub" style={{ color: '#333' }}><Github size={20} /></a>
                <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/social_auth.php?provider=linkedin`} className="social" title="Sign in with LinkedIn"><Linkedin size={20} /></a>
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
                  <button type="button" className="forgot-link" onClick={() => {
                    setIsForgotPassword(true);
                    setForgotPasswordEmail(formData.email);
                    setForgotPasswordStatus({ type: '', message: '' });
                  }} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--accent-blue)', cursor: 'pointer', textDecoration: 'underline' }}>Forgot?</button>
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
              
              <p className="mobile-only-text">
                Don't have an account? <button type="button" className="toggle-auth-btn" onClick={() => setIsSignUp(true)}>Sign Up</button>
              </p>
            </form>
          ) : (
            <div className="forgot-password-view animate-fade-in" style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '10px 0'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ marginBottom: '8px' }}>Reset Password</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your email to receive a password reset link.</p>
              </div>

              {forgotPasswordStatus.message && (
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  background: forgotPasswordStatus.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: forgotPasswordStatus.type === 'success' ? 'var(--success)' : 'var(--error)',
                  border: '1px solid currentColor',
                  textAlign: 'center'
                }}>
                  {forgotPasswordStatus.message}
                </div>
              )}

              <div className="reset-method-selection" style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                background: 'var(--bg-surface-secondary)',
                padding: '4px',
                borderRadius: '12px'
              }}>
                <button 
                  type="button" 
                  onClick={() => setForgotPasswordMethod('email')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: forgotPasswordMethod === 'email' ? 'var(--bg-card)' : 'transparent',
                    color: forgotPasswordMethod === 'email' ? 'var(--primary-blue)' : 'var(--text-muted)',
                    boxShadow: forgotPasswordMethod === 'email' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Email
                </button>
                <button 
                  type="button" 
                  onClick={() => setForgotPasswordMethod('sms')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: forgotPasswordMethod === 'sms' ? 'var(--bg-card)' : 'transparent',
                    color: forgotPasswordMethod === 'sms' ? 'var(--primary-blue)' : 'var(--text-muted)',
                    boxShadow: forgotPasswordMethod === 'sms' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  SMS
                </button>
              </div>

              <form onSubmit={handleForgotPassword}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><Mail size={14} /> Registered Email</label>
                  <div className="input-wrapper">
                    <input 
                      type="email" 
                      value={forgotPasswordEmail} 
                      onChange={(e) => setForgotPasswordEmail(e.target.value)} 
                      placeholder="Enter your account email" 
                      required 
                      autoFocus
                    />
                  </div>
                  {forgotPasswordMethod === 'sms' && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      We'll send the reset link to the phone number linked to this email.
                    </p>
                  )}
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? <Loader className="animate-spin" size={18} /> : 'Send Reset Link'}
                </button>
                
                <button 
                  type="button" 
                  className="btn-ghost" 
                  onClick={() => setIsForgotPassword(false)}
                  style={{ 
                    width: '100%', 
                    marginTop: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              </form>
            </div>
          )}
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
