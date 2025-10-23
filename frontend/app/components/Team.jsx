const Team = () => {
  const teamMembers = [
    {
      name: 'Gagan Charagondla',
      github: 'gagan12334',
      role: 'VLM / Backend',
    },
    {
      name: 'Husnain Khaliq',
      github: 'huscse',
      role: 'UI / Backend - Model Integration',
    },
    {
      name: 'Keerthana Venkatesan',
      github: 'keerthanavenkatesan415',
      role: 'VLM / Data Processing',
    },
    {
      name: 'Lissette Solano',
      github: 'Lissette31',
      role: 'Data Processing / Exploration',
    },
    {
      name: 'Manasvi Perisetty',
      github: 'ManuPer4',
      role: 'Data Processing / Exploration',
    },
    { name: 'Yesun Ang', github: 'yesun-ang', role: 'VLM / Data Processing' },
    { name: 'Erica Li', github: 'erica-1i', role: 'UI/UX - Frontend' },
  ];

  return (
    <div className="mt-24">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold mb-3">
          Meet the Team - Latitude AI 2A{' '}
        </h3>
        <p className="text-slate-100 text-md mt-5">
          Fall 2025 Break Through Tech AI Studio Challenge
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teamMembers.map((member) => (
          <a
            key={member.name}
            href={`https://github.com/${member.github}`}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              {/* GitHub Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-white/20 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <img
                  src={`https://github.com/${member.github}.png`}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name */}
              <div>
                <h4 className="text-white font-medium group-hover:text-slate-100 transition-colors">
                  {member.name}
                </h4>
                <p className="text-slate-300 text-sm mt-1">{member.role}</p>
              </div>

              {/* GitHub Icon */}
              <div className="flex items-center gap-1 text-slate-200 text-xs group-hover:text-slate-400 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>@{member.github}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Team;
