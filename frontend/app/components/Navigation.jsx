import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Navigation = () => {
  const Router = useRouter();
  return (
    <div>
      {' '}
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold">Navis</h2>
            </div>

            <div className="hidden md:flex space-x-4">
              <Link
                href="/signin"
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>

              <button
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                onClick={() => {
                  Router.push('/signup');
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
