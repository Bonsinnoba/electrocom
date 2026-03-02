import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Camera, Upload, CheckCircle, ArrowLeft, Loader, Smartphone } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';

export default function Verification() {
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { addNotification } = useNotifications();

  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Camera state
  const [capturing, setCapturing] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setHasCamera(true);
    }
  }, []);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCapturing(true);
      setError('');
    } catch (err) {
      console.error('Camera error', err);
      setError('Unable to access camera. Please upload a photo instead.');
      setHasCamera(false);
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
      stopCapture();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setIdPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idNumber) return setError('ID number is required');
    if (!idPhoto) return setError('ID photo is required');

    setLoading(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('ehub_token');
      
      const res = await fetch(`${API_BASE}/upload_id.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_number: idNumber, id_photo: idPhoto })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        addNotification('Identity verified successfully!', 'success');
        // Update global user context
        const updatedUser = { ...user, id_verified: 1, id_number: idNumber };
        updateUser(updatedUser);
        localStorage.setItem('ehub_user', JSON.stringify(updatedUser));
        
        // Wait 2 seconds then redirect to checkout or profile
        setTimeout(() => {
          navigate('/checkout');
        }, 2000);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card glass animate-fade-in" style={{ padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'rgba(34, 197, 94, 0.1)', 
          color: '#22c55e', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px' 
        }}>
          <CheckCircle size={40} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>Verification Complete</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Your identity has been verified. Redirecting you to complete your purchase...
        </p>
        <Loader className="animate-spin" style={{ margin: '24px auto', color: 'var(--primary-blue)' }} />
      </div>
    );
  }

  return (
    <div className="card glass animate-fade-in" style={{ padding: '32px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '24px' }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>Verify Identity</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
          Upload your Ghana Card to unlock full access to EssentialsHub, including checkout and premium support.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Ghana Card Number</label>
            <input 
              type="text" 
              value={idNumber} 
              onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
              className="input-premium" 
              placeholder="e.g. GHA-123456789-0"
              required 
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>ID Photo (Card Face)</label>
            
            {!idPhoto && !capturing && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {hasCamera && (
                  <button type="button" onClick={startCapture} className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'auto', padding: '24px' }}>
                    <Camera size={24} />
                    Take Photo
                  </button>
                )}
                <label className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: 'auto', padding: '24px', cursor: 'pointer', textAlign: 'center' }}>
                  <Upload size={24} />
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}

            {capturing && (
              <div style={{ position: 'relative' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '16px', background: '#000' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button type="button" onClick={takePhoto} className="btn-primary" style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0 }}>
                    <Camera size={24} />
                  </button>
                  <button type="button" onClick={stopCapture} className="btn-secondary" style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0 }}>
                    <ArrowLeft size={24} />
                  </button>
                </div>
              </div>
            )}

            {idPhoto && (
              <div style={{ position: 'relative' }}>
                <img src={idPhoto} alt="ID preview" style={{ width: '100%', borderRadius: '16px', border: '2px solid var(--primary-blue)' }} />
                <button 
                  type="button" 
                  onClick={() => setIdPhoto('')} 
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px', height: '56px', fontSize: '18px' }} disabled={loading}>
            {loading ? <Loader className="animate-spin" size={24} /> : 'Complete Verification'}
          </button>
        </form>
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
      `}} />
    </div>
  );
}
