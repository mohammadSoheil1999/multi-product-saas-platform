import React, { useState } from 'react';
import './Booking.css';
import { useSite } from '../context/SiteContext';

export default function Booking() {
  const { t } = useSite();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Booking confirmed for ${name} on ${date}`);
  };

  return (
    <div className="booking-container">
      <div className="vip-card">
        <h2 className="booking-title">{t('booking')}</h2>
        <form className="booking-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="booking-input"
            placeholder={t('yourName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="tel"
            className="booking-input"
            placeholder={t('yourPhone')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="date"
            className="booking-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button type="submit" className="vip-button">
            {t('confirmBooking')}
          </button>
        </form>
      </div>
    </div>
  );
}
