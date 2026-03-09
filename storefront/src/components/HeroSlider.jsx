import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSlides } from '../services/api';

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const loadSlides = async () => {
      try {
          const data = await fetchSlides();
          // Only update if data actually changed to avoid resetting the slider position unnecessarily
          setSlides(prev => {
              const isDifferent = JSON.stringify(prev) !== JSON.stringify(data);
              return isDifferent ? data : prev;
          });
      } catch (err) {
          // Silent error handling to avoid console clutter
      }
  };

  useEffect(() => {
    loadSlides();

    const interval = setInterval(loadSlides, 20000); // Check every 20 seconds
    
    const handleFocus = () => {
        loadSlides();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000); // Increased to 8 seconds
    return () => clearInterval(timer);
  }, [slides]);

  const [sliderHeight, setSliderHeight] = useState(() =>
    window.innerWidth <= 768 ? 312 : 480
  );

  useEffect(() => {
    const handleResize = () => {
      setSliderHeight(window.innerWidth <= 768 ? 312 : 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (slides.length === 0) return null;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const getSidePadding = () => {
    const width = window.innerWidth;
    if (width <= 768) return '20px'; // Mobile
    if (width <= 1200) return '40px'; // Tablet/Medium
    return '80px'; // Desktop
  };

  const getPositionStyles = (pos) => {
    const sidePadding = getSidePadding();
    const config = {
        left: { justifyContent: 'flex-start', alignItems: 'center', textAlign: 'left', padding: `0 ${sidePadding}`, gradient: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' },
        right: { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'right', padding: `0 ${sidePadding}`, gradient: 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' },
        center: { justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 20px', gradient: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 80%)' },
        top: { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'center', padding: '60px 20px', gradient: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' },
        bottom: { justifyContent: 'center', alignItems: 'flex-end', textAlign: 'center', padding: '60px 20px', gradient: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' }
    };
    return config[pos] || config.left;
  };



  return (
    <div className="hero-slider" style={{ position: 'relative', height: `${sliderHeight}px`, overflow: 'hidden', borderRadius: '16px' }}>
      <div 
        className="slides-wrapper" 
        style={{ 
          display: 'flex', 
          width: '100%', 
          height: '100%', 
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translateX(-${currentSlide * 100}%)`
        }}
      >
        {slides.map((slide, index) => {
          const styles = getPositionStyles(slide.text_position);
          return (
            <div
              key={slide.id}
              style={{
                flex: "0 0 100%",
                height: '100%',
                backgroundImage: `url(${slide.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: styles.gradient,
                display: 'flex',
                justifyContent: styles.justifyContent,
                alignItems: styles.alignItems,
                padding: styles.padding,
                boxSizing: 'border-box'
              }}>
                <div className="slide-content animate-fade-in" style={{ maxWidth: '600px', color: 'white', textAlign: styles.textAlign }}>
                  {slide.title && <h2 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>{slide.title}</h2>}
                  {slide.subtitle && <p style={{ fontSize: '18px', marginBottom: '24px', opacity: 0.9 }}>{slide.subtitle}</p>}
                  
                  <Link to={slide.button_link} className="btn-primary" style={{ padding: '12px 32px', fontSize: '16px', marginTop: '16px', display: 'inline-block' }}>
                    {slide.button_text}
                  </Link>
                </div>
  
                {/* Individual Text Blocks with Custom Positions */}
                {(() => {
                    let blocks = [];
                    try {
                        blocks = typeof slide.content_blocks === 'string' ? JSON.parse(slide.content_blocks) : (slide.content_blocks || []);
                    } catch(e) { blocks = []; }
                    
                    if (!Array.isArray(blocks)) return null;
  
                    return blocks.map((block, i) => {
                        const blockStyle = {
                            position: 'absolute',
                            top: `${block.top}%`,
                            left: `${block.left}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: block.fontSize || '16px',
                            color: block.color || '#ffffff',
                            textAlign: block.textAlign || 'center',
                            opacity: block.type === 'paragraph' ? 0.8 : 1,
                            fontWeight: block.type === 'heading' ? 700 : (block.type === 'subheading' ? 600 : 400),
                            lineHeight: 1.4,
                            maxWidth: '90%',
                            zIndex: 5,
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                        };
  
                        if (block.type === 'heading') return <h3 key={i} className="animate-fade-in" style={{ ...blockStyle, fontSize: block.fontSize || '32px' }}>{block.text}</h3>;
                        if (block.type === 'subheading') return <h4 key={i} className="animate-fade-in" style={blockStyle}>{block.text}</h4>;
                        return <p key={i} className="animate-fade-in" style={blockStyle}>{block.text}</p>;
                    });
                })()}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={prevSlide} style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={24} />
      </button>

      <button onClick={nextSlide} style={{ position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRight size={24} />
      </button>

      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
}
