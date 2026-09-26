import React from 'react';
import './Footer.css';
import { useSite } from '../context/SiteContext';

export default function Footer() {
  const { settings, t } = useSite();
  return (
    <footer className="footer">
      <span>{settings.shop_name}</span>
      <span aria-hidden="true"> · </span>
      <span>&copy; 2026 {t("rights")}</span>
    </footer>
  );
}
