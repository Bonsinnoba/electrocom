import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-grid">
          {/* Company Info */}
          <div className="footer-column">
            <h3 className="footer-title">EssentialsHub</h3>
            <p className="footer-description">Your trusted destination for premium electronics and cutting-edge technology.</p>
            <div className="footer-social">
              <a href="#" className="social-link" data-tooltip="Facebook" data-tooltip-pos="top">
                <Facebook size={20} />
              </a>
              <a href="#" className="social-link" data-tooltip="Twitter" data-tooltip-pos="top">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link" data-tooltip="Instagram" data-tooltip-pos="top">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link" data-tooltip="LinkedIn" data-tooltip-pos="top">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/favorites">Favorites</Link></li>
              <li><Link to="/transactions">Transactions</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-column">
            <h4 className="footer-heading">Customer Service</h4>
            <ul className="footer-links">
              <li><Link to="/support">Support</Link></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-column">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-contact">
              <li>
                <Mail size={16} />
                <span>support@essentialshub.com</span>
              </li>
              <li>
                <Phone size={16} />
                <span>0536683393 / 0506408074</span>
              </li>
              <li>
                <MapPin size={16} />
                <span>Accra, Kumasi & Wa, Ghana</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; 2026 EssentialsHub. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms-of-service">Terms of Service</Link>
            <span>•</span>
            <Link to="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
