import React from 'react';
import './footer.css';

const Footer: React.FC = () => {
    return (
        <div className="footer-container">
            <div className="footer-logo-section">
                <img src="/Satofin full frame - enhanced.png" alt="Satofin Logo" className="footer-logo" />
    
            </div>
            <div className="footer-links-section">
                <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
                <a href="/aml" className="footer-link">AML</a>
                <a href="/terms-and-conditions" className="footer-link">Terms and Conditions</a>
                <a href="/data-protection" className="footer-link">Data Protection</a>
            </div>
            <div className="footer-copyright-section">
                <p>&copy; 2023 Satofin. All rights reserved.</p>
            </div>
        </div>
    );
}

export default Footer;
