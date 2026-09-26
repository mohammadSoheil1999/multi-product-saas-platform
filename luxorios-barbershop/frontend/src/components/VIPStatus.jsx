import React from 'react';
import { useSite } from '../context/SiteContext';

const VIPStatus = ({ isVIP }) => {
  const { t } = useSite();
  return (
    <div className="max-w-md mx-auto bg-navy text-white rounded-xl shadow-xl p-6 mt-8">
      <h2 className="text-2xl font-serif mb-4">{t('vipMembership')}</h2>
      {isVIP ? (
        <div className="space-y-2">
          <p className="text-gold font-semibold">{t('vipMember')}</p>
          <ul className="list-disc list-inside text-gray-200">
            <li>{t('priorityBookings')}</li>
            <li>{t('exclusiveDiscounts')}</li>
            <li>{t('specialOffers')}</li>
          </ul>
        </div>
      ) : (
        <p className="text-gray-300">
          {t('notVip')}
        </p>
      )}
    </div>
  );
};

export default VIPStatus;
