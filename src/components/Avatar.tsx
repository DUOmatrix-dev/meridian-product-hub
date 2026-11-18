import { useState } from 'react';
import { TEAM_LEADS } from '../types/product';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const matchedLead = TEAM_LEADS.find(
    (lead) => lead.name.toLowerCase() === name.trim().toLowerCase()
  );

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PM';

  const dimensions = size === 'md' ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[11px]';

  if (matchedLead && !imgError) {
    return (
      <img
        src={matchedLead.avatarUrl}
        alt={`${matchedLead.name}, ${matchedLead.role}`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${dimensions} rounded-md object-cover border border-slate-200 shrink-0 bg-slate-100`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} inline-flex items-center justify-center rounded-md bg-slate-100 border border-slate-200 font-medium text-slate-700 shrink-0 select-none`}
    >
      {initials}
    </span>
  );
}
