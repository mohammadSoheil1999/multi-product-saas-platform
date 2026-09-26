// SignIn.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";
import { useSite } from "../context/SiteContext";

const SignIn = () => {
  const { t } = useSite();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (!phoneNumber || !password) {
      setMessage(t("allFields"));
      return;
    }

    try {
      const res = await loginUser({
        phonenumber: phoneNumber,
        password: password
      });

      localStorage.setItem("token", res.data.token);

      navigate("/appointments");
    } catch {
      setMessage(t("loginFailed"));
    }
  };

  return (
    <div className="main-container">
      <span className="form-eyebrow">{t("welcome")}</span>
      <h2 className="vip-title">{t("login")}</h2>
      <p className="form-intro">{t("loginIntro")}</p>

      <input
        className="input"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={t("phone")}
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />

      <input
        className="input"
        type="password"
        autoComplete="current-password"
        placeholder={t("password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="vip-button" onClick={handleSignIn}>
        {t("login")}
      </button>

      {message && <p className="form-message" role="alert">{message}</p>}
    </div>
  );
};

export default SignIn;
