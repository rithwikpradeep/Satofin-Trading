import React from 'react';
import './header.css';

const Header: React.FC = () => {
    return (
        <header className="header-container">
            <img src="/Satofin full frame - enhanceds.png" alt="Satofin" className="header-logo"/>
            <nav className="header-nav">
                <a href="/" className="nav-link">Home</a>
                <a href="/about" className="nav-link">About Us</a>
                <a href="/education" className="nav-link">Education</a>
                <a href="/contact" className="nav-link">Contact Us</a>
            </nav>
        </header>
    );
};

export default Header;
