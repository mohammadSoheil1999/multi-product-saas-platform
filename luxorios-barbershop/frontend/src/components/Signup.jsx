import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser } from "../api/api";
import '../pages/VIP.css';
import { useSite } from "../context/SiteContext";

const SignUp = () => {
  const { t } = useSite();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!phoneNumber || !name || !password) {
      setMessage(t("allFields"));
      return;
    }

    try {
      await signUpUser({
        name,
        phonenumber: phoneNumber,
        password
      });

      setMessage(t("signupSuccess"));

      // redirect after success
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch {
      setMessage(t("signupFailed"));
    }
  };

  return (
    <div className="main-container">
      <span className="form-eyebrow">{t("join")}</span>
      <h2 className="vip-title">{t("signup")}</h2>
      <p className="form-intro">{t("signupIntro")}</p>

      <input
        className="input"
        type="text"
        autoComplete="name"
        placeholder={t("name")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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
        autoComplete="new-password"
        placeholder={t("password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="vip-button" onClick={handleSignUp}>
        {t("signup")}
      </button>

      {message && <p className="form-message" role="alert">{message}</p>}

      <p className="auth-switch">
        {t("haveAccount")}{" "}
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          {t("login")}
        </span>
      </p>
    </div>
  );
};

export default SignUp;
