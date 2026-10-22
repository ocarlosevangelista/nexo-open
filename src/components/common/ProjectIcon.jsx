import React from 'react';
import { Folder, Rocket, Megaphone, Code, Palette, Target, Briefcase, Lightbulb } from 'lucide-react';

export const PROJECT_ICONS = { folder: Folder, rocket: Rocket, megaphone: Megaphone, code: Code, palette: Palette, target: Target, briefcase: Briefcase, lightbulb: Lightbulb };

export default function ProjectIcon({ project, size = 28 }) {
  const Icon = PROJECT_ICONS[project?.icon] || Folder;
  return (
    <span className="inline-flex items-center justify-center rounded-lg shrink-0 text-white" style={{ width: size, height: size, background: project?.color || '#6366f1' }}>
      <Icon style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
}