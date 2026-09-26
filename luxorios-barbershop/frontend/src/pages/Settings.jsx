import { useEffect, useState } from "react";
import axios from "axios";
import { defaultSettings, useSite } from "../context/SiteContext";
import "./VIP.css";
import "./Settings.css";

export default function Settings() {
  const { settings, setSettings, t } = useSite();
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  let role = null;
  try { role = JSON.parse(atob(token.split(".")[1])).role; } catch { role = null; }

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (role !== "admin") return <main className="main-container"><h1 className="section-eyebrow">{t("unauthorized")}</h1></main>;

  const update = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setSettings(next);
  };

  const persist = async (next) => {
    setMessage("");
    try {
      const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/settings`, next, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(data);
      setForm(data);
      setMessage(t("saved"));
    } catch {
      setMessage(t("settingsSaveFailed"));
    }
  };

  const save = (event) => {
    event.preventDefault();
    persist(form);
  };

  const resetTheme = () => {
    const reset = {
      ...form,
      primary_color: defaultSettings.primary_color,
      accent_color: defaultSettings.accent_color,
      surface_color: defaultSettings.surface_color,
      background_style: defaultSettings.background_style,
    };
    setForm(reset);
    setSettings(reset);
    persist(reset);
  };

  const colors = [
    ["primary_color", "primaryColor"], ["accent_color", "accentColor"], ["surface_color", "surfaceColor"],
  ];

  return (
    <main className="main-container settings-page">
      <form className="vip-card settings-card" onSubmit={save}>
        <div className="section-heading">
          <h1 className="section-eyebrow">{t("settings")}</h1>
          <p>{t("settingsIntro")}</p>
        </div>

        <section className="settings-section">
          <label className="settings-field">
            <span>{t("shopName")}</span>
            <input className="input" value={form.shop_name} maxLength="80" onChange={(e) => update("shop_name", e.target.value)} />
          </label>
        </section>

        <section className="settings-section">
          <div className="color-grid">
            {colors.map(([key, label]) => (
              <label className="color-field" key={key}>
                <span>{t(label)}</span>
                <span className="color-control">
                  <input type="color" value={form[key]} onChange={(e) => update(key, e.target.value)} />
                  <code>{form[key]}</code>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <span className="settings-label">{t("background")}</span>
          <div className="background-options">
            {["sand", "sage", "charcoal", "classic"].map((option) => (
              <button type="button" key={option} className={`background-option bg-${option} ${form.background_style === option ? "active" : ""}`} onClick={() => update("background_style", option)}>
                <span className="background-swatch" />
                <span>{t(option)}</span>
              </button>
            ))}
          </div>
        </section>

        {message && <p className="settings-message" role="status">{message}</p>}
        <div className="settings-actions">
          <button className="vip-button button-secondary" type="button" onClick={resetTheme}>{t("resetTheme")}</button>
          <button className="vip-button settings-save" type="submit">{t("save")}</button>
        </div>
      </form>
    </main>
  );
}
