import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SignIn from "./SignIn";
import SignUp from "../components/Signup";
import "./Home.css";
import "./VIP.css";
import "../styles/shine.css"
import { useSite } from "../context/SiteContext";

export default function Home() {
  const { settings, t } = useSite();
  const location = useLocation();
  const isSignup = location.pathname === "/SignUp";

  // ✅ PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setShowInstall(false);
    }
  };

  return (
    <div className="main-content">
      <div className="auth-shell">
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-visual-content">
            <span className="brand-monogram">LX</span>
            <p className="auth-kicker">{settings.shop_name} · EST. 2026</p>
            <h1>{t("heroTitle")}</h1>
            <span className="auth-rule" />
            <p>{t("heroText")}</p>
          </div>
        </div>

        <div className="auth-panel">
          {isSignup ? <SignUp /> : <SignIn />}
        </div>
      </div>

      {/* ✅ Install Button */}
      {showInstall && (
        <div className="install-prompt">
          <button className="vip-button" onClick={handleInstall}>
            {t("installApp")}
          </button>
        </div>
      )}
    </div>
  );
}
