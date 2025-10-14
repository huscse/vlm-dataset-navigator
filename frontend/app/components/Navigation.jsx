import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const Navigation = () => {
  const Router = useRouter();
  return (
    <div>
      {' '}
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center w-40 h-16 mt-5">
              <Link href="/">
                <Image
                  src="/images/navislogodraft.png"
                  alt="Navis Logo"
                  className="object-contain cursor-pointer"
                  width={100}
                  height={40}
                  priority
                />
              </Link>
            </div>

            <div className="hidden md:flex space-x-4 mt-5">
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
                Sign up
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
