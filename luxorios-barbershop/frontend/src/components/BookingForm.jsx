import React, { useState } from 'react';
import { useSite } from '../context/SiteContext';

const BookingForm = () => {
  const { t } = useSite();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log the booking
    console.log({ name, phone, service, date, time });
    alert(t('bookingSubmitted'));
    setName('');
    setPhone('');
    setService('');
    setDate('');
    setTime('');
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-xl rounded-xl p-6 mt-8">
      <h2 className="text-2xl font-serif text-navy mb-4">{t('bookAppointment')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder={t('fullName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          required
        />
        <input
          type="tel"
          placeholder={t('phone')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          required
        />
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          required
        >
          <option value="">{t('selectService')}</option>
          <option value="Haircut">{t('haircut')}</option>
          <option value="Beard Trim">{t('beardTrim')}</option>
          <option value="Shave">{t('shave')}</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          required
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
          required
        />
        <button
          type="submit"
          className="w-full bg-gold text-white font-semibold py-3 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          {t('bookNow')}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
