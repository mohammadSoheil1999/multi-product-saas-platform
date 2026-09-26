import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useSite } from "../context/SiteContext";

export default function Navbar() {
  const { language, setLanguage, settings, t } = useSite();
  const [menuActive, setMenuActive] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // ================= ROLE =================
  const getRole = () => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  };

  const role = getRole();
  const isAdmin = role === "admin";

  const toggleMenu = () => setMenuActive((prev) => !prev);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuActive(false);
      }
    };

    if (menuActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [menuActive]);

  return (
    <nav className="navbar" ref={navRef}>
      <button
        className="logo-button"
        onClick={toggleMenu}
        aria-label={t("language")}
        aria-expanded={menuActive}
      >
        <span className="nav-mark" aria-hidden="true">AR</span>
        <span>{settings.shop_name}</span>
        <span className={`menu-chevron ${menuActive ? "open" : ""}`} aria-hidden="true">⌄</span>
      </button>

      <div className={`nav-links ${menuActive ? "active" : ""}`}>
        {token ? (
          <>
            <Link to="/appointments" onClick={() => setMenuActive(false)}>
              {t("appointments")}
            </Link>

            {/* 🔥 ADMIN ONLY LINK */}
            {isAdmin && (
              <Link to="/users" onClick={() => setMenuActive(false)}>
                {t("users")}
              </Link>
            )}

            {isAdmin && (
              <Link to="/settings" onClick={() => setMenuActive(false)}>{t("settings")}</Link>
            )}

            <button type="button" className="logout-btn" onClick={logout}>
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/" onClick={() => setMenuActive(false)}>
              {t("login")}
            </Link>

            <Link to="/SignUp" onClick={() => setMenuActive(false)}>
              {t("signup")}
            </Link>
          </>
        )}
        <div className="language-picker" aria-label={t("language")}>
          {[['ar','العربية'], ['en','English'], ['he','עברית']].map(([code, label]) => (
            <button type="button" key={code} className={language === code ? "active" : ""} onClick={() => setLanguage(code)}>{label}</button>
          ))}
        </div>
      </div>
    </nav>
  );
}
