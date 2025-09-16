
import React from 'react';

const TuneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 10 20" {...props}>
    <path fill="#000" d="M0 0h10v20H0z"/>
    <path fill="#fff" d="M4 1h2v2H4zm0 3h2v2H4zm0 6h2v2H4zm0 2h2v2H4zm0 2h2v2H4zM1 10h2v2H1zm6 0h2v2H7zM4 7h2v2H4z"/>
  </svg>
);

export default TuneIcon;
