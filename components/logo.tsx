export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap');
          
          .pg-logo {
            --logo-base-color: #14216a;
          }
          
          :is(.dark) .pg-logo {
            --logo-base-color: #ffffff;
          }

          .pg-text-base { 
            font-family: 'Poppins', sans-serif; 
            font-weight: 700; 
            fill: var(--logo-base-color); 
            font-size: 80px; 
            letter-spacing: -1.5px; 
            transition: fill 0.3s ease;
          }
          
          .pg-text-grad { 
            font-family: 'Poppins', sans-serif; 
            font-weight: 600; 
            fill: url(#guru-gradient); 
            font-size: 80px; 
            letter-spacing: -1px; 
          }

          .pg-icon-fill { fill: var(--logo-base-color); transition: fill 0.3s ease; }
          .pg-icon-stroke { stroke: var(--logo-base-color); transition: stroke 0.3s ease; }
        `}} />

        <linearGradient id="guru-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4e73df" />
          <stop offset="50%" stopColor="#8a3ffc" />
          <stop offset="100%" stopColor="#24d2f5" />
        </linearGradient>

        <mask id="arrow-cutout">
          <rect width="100%" height="100%" fill="white" />
          <line x1="75" y1="105" x2="160" y2="10" stroke="black" strokeWidth="16" strokeLinecap="round" />
        </mask>
      </defs>

      <g className="pg-logo">
        <text x="10" y="90" className="pg-text-base">P</text>

        <g>
          <circle cx="115" cy="62" r="23" fill="none" className="pg-icon-stroke" strokeWidth="13" mask="url(#arrow-cutout)" />
          
          <text x="115" y="74" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="24" className="pg-icon-fill" textAnchor="middle">G</text>

          <circle cx="78" cy="42" r="4.5" className="pg-icon-fill" />
          <line x1="78" y1="42" x2="98" y2="22" className="pg-icon-stroke" strokeWidth="4" strokeLinecap="round" />
          <circle cx="98" cy="22" r="4.5" className="pg-icon-fill" />
          <line x1="98" y1="22" x2="110" y2="34" className="pg-icon-stroke" strokeWidth="4" strokeLinecap="round" />

          <line x1="90" y1="92" x2="150" y2="22" className="pg-icon-stroke" strokeWidth="6" strokeLinecap="round" />
          <polygon points="135,17 155,12 148,32" className="pg-icon-fill" />
        </g>

        <text x="162" y="90" className="pg-text-base">st</text>

        <text x="255" y="90" className="pg-text-grad">Guru</text>
      </g>
    </svg>
  );
}
