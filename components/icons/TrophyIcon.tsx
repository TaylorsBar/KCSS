import React from 'react';

// FIX: Replaced multiple and conflicting icon declarations with a single, valid TrophyIcon component.
// This resolves the "Cannot redeclare block-scoped variable" errors.
// Added a default export to satisfy the import in RacePack.tsx.
const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M17 3v4m2-2h-4M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
);

export default TrophyIcon;
