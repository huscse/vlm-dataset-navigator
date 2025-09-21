import React from 'react';

const Header = () => {
  return (
    <div
      className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#111827_0%,#000000_45%,#1F2937_95%)]
"
    >
      <div className="px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          VLM-Driven{' '}
          <span className="relative text-gray-500 inline-block">
            Open Dataset
          </span>{' '}
          Navigator
        </h1>

        <p className="mt-2 md:mt-2 text-gray-300 text-base sm:text-lg max-w-xl mx-auto px-1">
          Search driving datasets with natural language
        </p>
      </div>
    </div>
  );
};

export default Header;
