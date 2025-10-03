import React from 'react';

const Team = () => {
  return (
    <div>
      {' '}
      <div className="mt-16 border-t border-white/40 pt-8">
        <p className="text-center text-slate-300">
          Built by the{' '}
          <span className="text-white font-medium">Latitude AI 2A</span> team as
          part of the Fall 2025 Break Through Tech AI Studio challenge.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {[
            ['Gagan Charagondla', 'https://github.com/gagan12334'],
            ['Husnain Khaliq', 'https://github.com/huscse'],
            [
              'Keerthana Venkatesan',
              'https://github.com/keerthanavenkatesan415',
            ],
            ['Lissette Solano', 'https://github.com/Lissette31'],
            ['Manasvi', 'https://github.com/ManuPer4'],
            ['Yesun Ang', 'https://github.com/yesun-ang'],
            ['Erica Li', 'https://github.com/erica-1i'],
          ].map(([name, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition text-sm"
            >
              {name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
