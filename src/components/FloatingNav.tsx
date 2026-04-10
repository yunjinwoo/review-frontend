import React from 'react';

/**
 * FloatingNav Component
 * Provides a premium, glassmorphic navigation menu at the top left.
 */
const FloatingNav: React.FC = () => {
  const navItems = [
    {
      label: '홈',
      href: '/',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      label: '업비트',
      href: '/upbit',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"></line>
          <line x1="18" y1="20" x2="18" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="16"></line>
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed top-6 left-6 z-[100] flex flex-col gap-4">
      <div className="flex flex-col gap-2 p-2 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="group relative flex items-center justify-center w-12 h-12 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 transition-all duration-300"
            title={item.label}
          >
            {item.icon}
            
            {/* Tooltip */}
            <span className="absolute left-16 px-3 py-1.5 bg-slate-800 text-slate-100 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap border border-slate-700 shadow-xl">
              {item.label}
            </span>

            {/* Active Indicator (optional, but adds premium feel) */}
            <div className="absolute -left-1 w-1 h-0 bg-blue-500 rounded-full group-hover:h-6 transition-all duration-300" />
          </a>
        ))}
      </div>
    </nav>
  );
};

export default FloatingNav;
