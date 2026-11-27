import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './landing.css';

/* ============================================================
   1. NAVBAR COMPONENT
   ============================================================ */
const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
  };

  const dashboardUrl = user?.role === 'SUPERADMIN' ? '/admin/dashboard' : '/client/dashboard';

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar" role="banner">
      <div className="container navbar__inner">
        {/* Logo — crisp cropped 3D robot chatmark */}
        <Link to="/" className="navbar__logo" aria-label="Infisq Innovations Home">
          <div className="logo-mark" aria-hidden="true">
            <img src="/assets/Logo-Icon.png" alt="Infisq Innovations Logo" className="logo-img" />
          </div>
          <div className="logo-text">
            <span className="logo-name">Infisq Innovations</span>
            <span className="logo-tagline">COMMUNICATE • AUTOMATE • GROW</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav" role="navigation" aria-label="Main navigation">
          <a href="#" className="nav-link nav-link--active" aria-current="page">
            Home
          </a>
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#solutions" className="nav-link">
            Solutions
          </a>
          <a href="#pricing" className="nav-link">
            Pricing
          </a>

          {/* Resources Dropdown */}
          <div
            className={`nav-dropdown ${resourcesOpen ? 'open' : ''}`}
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              type="button"
              className="nav-link nav-link--dropdown"
              onClick={() => setResourcesOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={resourcesOpen}
            >
              Resources
              <svg className="chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="dropdown-menu" role="menu">
              <a href="#" className="dropdown-item" role="menuitem">Blog</a>
              <a href="#" className="dropdown-item" role="menuitem">Guides</a>
              <a href="#" className="dropdown-item" role="menuitem">Help Center</a>
              <a href="#" className="dropdown-item" role="menuitem">API Documentation</a>
              <a href="#" className="dropdown-item" role="menuitem">Status</a>
            </div>
          </div>

          {/* Company Dropdown */}
          <div
            className={`nav-dropdown ${companyOpen ? 'open' : ''}`}
            onMouseEnter={() => setCompanyOpen(true)}
            onMouseLeave={() => setCompanyOpen(false)}
          >
            <button
              type="button"
              className="nav-link nav-link--dropdown"
              onClick={() => setCompanyOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={companyOpen}
            >
              Company
              <svg className="chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="dropdown-menu" role="menu">
              <a href="#" className="dropdown-item" role="menuitem">About Us</a>
              <a href="#" className="dropdown-item" role="menuitem">Careers</a>
              <a href="#" className="dropdown-item" role="menuitem">Partnerships</a>
              <a href="#" className="dropdown-item" role="menuitem">Contact Us</a>
              <a href="#" className="dropdown-item" role="menuitem">Press</a>
            </div>
          </div>
        </nav>

        {/* Right Controls — Always show Login & Register & Get Notified */}
        <div className="navbar__actions">
          <Link to="/login" className="btn--ghost" id="navbar-login">
            Login
          </Link>
          <Link to="/register" className="btn--signup" id="navbar-register">
            Register
          </Link>
          <a href="#notify" className="btn btn--primary" id="navbar-cta">
            <span>Get Notified</span>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} role="dialog" aria-label="Mobile navigation">
        <nav className="mobile-nav">
          <a href="#" className="mobile-nav__link mobile-nav__link--active" onClick={closeMobileMenu}>
            Home
          </a>
          <a href="#features" className="mobile-nav__link" onClick={closeMobileMenu}>
            Features
          </a>
          <a href="#solutions" className="mobile-nav__link" onClick={closeMobileMenu}>
            Solutions
          </a>
          <a href="#pricing" className="mobile-nav__link" onClick={closeMobileMenu}>
            Pricing
          </a>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link to="/login" className="mobile-nav__link font-bold text-slate-800" onClick={closeMobileMenu}>
              Login
            </Link>
            <Link to="/register" className="mobile-nav__link font-bold text-emerald-700" onClick={closeMobileMenu}>
              Register
            </Link>
            <a href="#notify" className="btn btn--primary mobile-cta" onClick={closeMobileMenu}>
              Get Notified →
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

/* ============================================================
   2. HERO SECTION COMPONENT (With Enhanced 3D Presentation)
   ============================================================ */
const HeroSection: React.FC = () => {
  const [targetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    d.setHours(d.getHours() + 4);
    d.setMinutes(d.getMinutes() + 17);
    d.setSeconds(d.getSeconds() + 17);
    return d;
  });

  const [timeLeft, setTimeLeft] = useState({ days: '28', hours: '04', minutes: '17', seconds: '17' });
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setStatus('error');
      return;
    }

    setStatus('success');
    setEmail('');
  };

  return (
    <section className="hero" id="hero">
      {/* Background layer with 3D crane illustration & ambient lighting */}
      <div className="hero__bg" aria-hidden="true">
        <img
          src="/assets/Hero-Bg.png"
          alt="WhatsApp Business Platform Blueprint Background"
          className="hero__bg-img"
        />
      </div>

      {/* Floating 3D Enhancer Glassmorphism Cards on Desktop */}
      <div className="hidden lg:flex hero__floating-card hero__floating-card--top">
        <div className="hero__card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="hero__card-content">
          <span className="hero__card-title">Official Meta Cloud API</span>
          <span className="hero__card-sub">Enterprise Tech Provider v21.0</span>
        </div>
      </div>

      <div className="hidden lg:flex hero__floating-card hero__floating-card--bottom">
        <div className="hero__card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div className="hero__card-content">
          <span className="hero__card-title">Real-Time Automation</span>
          <span className="hero__card-sub">&lt; 1s Response & Broadcast Speed</span>
        </div>
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          {/* Eyebrow badge */}
          <div className="eyebrow">
            <span className="eyebrow__line" aria-hidden="true"></span>
            <span className="eyebrow__text">LAUNCHING VERY SOON</span>
          </div>

          {/* Headline matching screenshot */}
          <h1 className="hero__headline">
            <span className="headline-dark">The Next</span>
            <span className="headline-dark">Chapter in</span>
            <span className="headline-dark">Automation</span>
          </h1>

          {/* Subtitle */}
          <p className="hero__description">
            Empowering businesses with smarter conversations, seamless automation, and limitless growth on WhatsApp Business API.
          </p>

          {/* Countdown timer */}
          <div className="countdown" id="countdown" aria-label="Time remaining until launch">
            <div className="countdown__block">
              <span className="countdown__number">{timeLeft.days}</span>
              <span className="countdown__unit">DAYS</span>
            </div>
            <span className="countdown__sep" aria-hidden="true">:</span>
            <div className="countdown__block">
              <span className="countdown__number">{timeLeft.hours}</span>
              <span className="countdown__unit">HOURS</span>
            </div>
            <span className="countdown__sep" aria-hidden="true">:</span>
            <div className="countdown__block">
              <span className="countdown__number">{timeLeft.minutes}</span>
              <span className="countdown__unit">MINUTES</span>
            </div>
            <span className="countdown__sep" aria-hidden="true">:</span>
            <div className="countdown__block">
              <span className="countdown__number">{timeLeft.seconds}</span>
              <span className="countdown__unit">SECONDS</span>
            </div>
          </div>

          {/* Form block */}
          <div className="notify-form" id="notify">
            <form className="notify-form__control" onSubmit={handleSubmit} noValidate>
              <label htmlFor="email-input" className="sr-only">
                Your email address
              </label>
              <div className="notify-form__input-wrap">
                <svg className="notify-form__icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="1.5" y="4" width="15" height="10.5" rx="2" stroke="#66736D" strokeWidth="1.3" />
                  <path d="M1.5 6.5L9 11L16.5 6.5" stroke="#66736D" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <input
                  type="email"
                  id="email-input"
                  className="notify-form__input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary notify-form__btn" id="notify-btn">
                <span>Notify Me</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>

            <p className="notify-form__hint" id="email-hint">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <rect x="0.5" y="0.5" width="12" height="12" rx="6" stroke="#66736D" strokeWidth="1" />
                <path d="M4 6.5L5.8 8.5L9 4.5" stroke="#66736D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              No spam. Just important updates.
            </p>

            {status === 'error' && (
              <p className="notify-form__error" id="email-error" role="alert">
                Please enter a valid email address.
              </p>
            )}

            {status === 'success' && (
              <p className="notify-form__success" id="email-success" role="status">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" fill="#007A4D" />
                  <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                You're on the list! We'll notify you at launch.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   3. TRUST STRIP COMPONENT
   ============================================================ */
const TrustStrip: React.FC = () => {
  return (
    <section className="trust-strip" aria-label="Trusted by visionary businesses">
      <div className="container trust-strip__inner">
        <div className="trust-strip__label">
          <span>TRUSTED BY VISIONARY BUSINESSES</span>
        </div>

        <div className="trust-strip__divider" aria-hidden="true"></div>

        <div className="trust-strip__logos" role="list">
          {/* Google */}
          <div className="trust-logo" role="listitem" aria-label="Google">
            <svg height="20" viewBox="0 0 75 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <text y="20" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#B5BDB9" letterSpacing="-0.5">
                Google
              </text>
            </svg>
          </div>

          {/* Meta */}
          <div className="trust-logo" role="listitem" aria-label="Meta">
            <svg height="20" viewBox="0 0 52 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <text y="20" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#B5BDB9" letterSpacing="-0.5">
                Meta
              </text>
            </svg>
          </div>

          {/* Microsoft */}
          <div className="trust-logo" role="listitem" aria-label="Microsoft">
            <svg height="20" viewBox="0 0 115 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <text y="20" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#B5BDB9" letterSpacing="-0.5">
                Microsoft
              </text>
            </svg>
          </div>

          {/* AWS */}
          <div className="trust-logo" role="listitem" aria-label="Amazon Web Services">
            <svg height="20" viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <text y="20" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#B5BDB9" letterSpacing="-0.5">
                AWS
              </text>
            </svg>
          </div>

          {/* Stripe */}
          <div className="trust-logo" role="listitem" aria-label="Stripe">
            <svg height="20" viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <text y="20" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="#B5BDB9" letterSpacing="-0.5">
                Stripe
              </text>
            </svg>
          </div>
        </div>

        <div className="trust-strip__divider" aria-hidden="true"></div>

        <div className="trust-strip__right">
          <span>SAME PLATFORM. BIGGER POSSIBILITIES.</span>
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   4. FOOTER COMPONENT
   ============================================================ */
const Footer: React.FC = () => {
  const [footerEmail, setFooterEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!footerEmail || !emailRegex.test(footerEmail.trim())) {
      setSubscribeStatus('error');
      return;
    }

    setSubscribeStatus('success');
    setFooterEmail('');
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer__inner">
        {/* Brand Column */}
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label="Infisq Innovations Home">
            <div className="footer__logo-mark" aria-hidden="true">
              <img src="/assets/Logo-Icon.png" alt="Infisq Innovations Logo" className="footer__logo-img" />
            </div>
            <div className="footer__logo-text">
              <span className="footer__logo-name">Infisq Innovations</span>
              <span className="footer__logo-tagline">COMMUNICATE • AUTOMATE • GROW</span>
            </div>
          </Link>
          <p className="footer__desc">
            Empowering businesses with smarter conversations, seamless automation, and limitless growth.
          </p>
          <div className="footer__socials" aria-label="Social media links">
            <a href="#" className="social-icon" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3.5 5.5V13M3.5 3.5C3.5 4.05228 3.05228 4.5 2.5 4.5C1.94772 4.5 1.5 4.05228 1.5 3.5C1.5 2.94772 1.94772 2.5 2.5 2.5C3.05228 2.5 3.5 2.94772 3.5 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M7 13V8.5C7 7.11929 8.11929 6 9.5 6C10.8807 6 12 7.11929 12 8.5V13"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path d="M1.5 5.5H3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="1.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
                <circle cx="11.5" cy="4.5" r="0.8" fill="currentColor" />
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.5 6L10.5 8L6.5 10V6Z" fill="currentColor" />
              </svg>
            </a>
            <a href="#" className="social-icon" aria-label="X (Twitter)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* Product Column */}
        <div className="footer__col">
          <h3 className="footer__col-title">PRODUCT</h3>
          <ul className="footer__links" role="list">
            <li>
              <a href="#features" className="footer__link">
                Features
              </a>
            </li>
            <li>
              <a href="#solutions" className="footer__link">
                Solutions
              </a>
            </li>
            <li>
              <a href="#pricing" className="footer__link">
                Pricing
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Integrations
              </a>
            </li>
            <li>
              <a href="#" className="footer__link footer__link--badge">
                Coming Soon <span className="badge">NEW</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="footer__col">
          <h3 className="footer__col-title">RESOURCES</h3>
          <ul className="footer__links" role="list">
            <li>
              <a href="#" className="footer__link">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Guides
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                API Documentation
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Status
              </a>
            </li>
          </ul>
        </div>

        {/* Company Column */}
        <div className="footer__col">
          <h3 className="footer__col-title">COMPANY</h3>
          <ul className="footer__links" role="list">
            <li>
              <a href="#" className="footer__link">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Partnerships
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#" className="footer__link">
                Press
              </a>
            </li>
          </ul>
        </div>

        {/* Subscribe Column */}
        <div className="footer__subscribe">
          <h3 className="footer__col-title">SUBSCRIBE FOR UPDATES</h3>
          <p className="footer__subscribe-desc">Be the first to know when we launch.</p>
          <form className="footer__form" onSubmit={handleSubscribe} noValidate>
            <label htmlFor="footer-email" className="sr-only">
              Your email address
            </label>
            <div className="footer__input-wrap">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#9BA8A3" strokeWidth="1.2" />
                <path d="M1.5 6L8 9.5L14.5 6" stroke="#9BA8A3" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                type="email"
                id="footer-email"
                className="footer__input"
                placeholder="Your email address"
                value={footerEmail}
                onChange={(e) => {
                  setFooterEmail(e.target.value);
                  if (subscribeStatus === 'error') setSubscribeStatus('idle');
                }}
                autoComplete="email"
                required
              />
              <button type="submit" className="footer__submit-btn" aria-label="Subscribe">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {subscribeStatus === 'success' && (
              <p style={{ color: '#19A974', fontSize: '0.8rem', marginTop: '4px' }}>
                ✓ You're on the list!
              </p>
            )}
            {subscribeStatus === 'error' && (
              <p style={{ color: '#ff8c8c', fontSize: '0.8rem', marginTop: '4px' }}>
                Please enter a valid email address.
              </p>
            )}
          </form>
          <p className="footer__hint">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="12" height="12" rx="6" stroke="#9BA8A3" strokeWidth="1" />
              <path d="M4 6.5L5.8 8.5L9 4.5" stroke="#9BA8A3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            No spam. Just important updates.
          </p>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p className="footer__copy">© 2026 Infisq Innovations. All rights reserved.</p>
          <div className="footer__legal">
            <a href="#" className="footer__legal-link">Privacy Policy</a>
            <a href="#" className="footer__legal-link">Terms of Service</a>
            <a href="#" className="footer__legal-link">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ============================================================
   MAIN EXPORT: LANDING VIEW
   ============================================================ */
export const LandingView: React.FC = () => {
  return (
    <div className="landing-page-root" style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <TrustStrip />
      </main>
      <Footer />
    </div>
  );
};
