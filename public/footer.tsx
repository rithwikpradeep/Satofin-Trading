import React from 'react';
import './footer.css';

const Footer: React.FC = () => {
    return (
        <div className="footer-container">
            <div className="footer-logo-section">
                <img src="/Satofin full frame - enhanced.png" alt="Satofin Logo" className="footer-logo" />
            </div>
            <div className="footer-links-section">
                <a href="/privacy-policy.html" className="footer-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                <a href="/aml.html" className="footer-link" target="_blank" rel="noopener noreferrer">AML</a>
                <a href="/terms-and-conditions.html" className="footer-link" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
                <a href="/data-protection.html" className="footer-link" target="_blank" rel="noopener noreferrer">Data Protection</a>
            </div>
            <div className="footer-copyright-section">
                <p>&copy; 2023 Satofin. All rights reserved.</p>
            </div>
        </div>
    );
}

export default Footer;