import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-gray-100 text-gray-700 border-gray-200';

  if (['ACTIVE', 'CONNECTED', 'APPROVED', 'SENT', 'DELIVERED', 'SUCCESS', 'OPTED_IN', 'PAID', 'COMPLETED'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PENDING', 'PENDING_CONFIGURATION', 'SCHEDULED', 'IN_PROGRESS', 'DRAFT', 'UNKNOWN'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['FAILED', 'REJECTED', 'INACTIVE', 'SUSPENDED', 'BLOCKED', 'CANCELLED', 'RESTRICTED'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['READ'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
        styles.includes('emerald') ? 'bg-emerald-500' :
        styles.includes('amber') ? 'bg-amber-500' :
        styles.includes('rose') ? 'bg-rose-500' :
        styles.includes('blue') ? 'bg-blue-500' : 'bg-gray-400'
      }`} />
      {status ? status.replace(/_/g, ' ') : 'N/A'}
    </span>
  );
};
