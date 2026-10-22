import React from 'react';
import { cn } from '@/lib/utils';

const COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500'];

export default function MemberAvatar({ name = '', url, size = 24, className }) {
  const initials = name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  return (
    <span
      title={name}
      className={cn('inline-flex items-center justify-center rounded-full overflow-hidden text-white font-medium shrink-0', !url && color, className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : initials}
    </span>
  );
}