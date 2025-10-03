import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Hero = () => {
  const router = useRouter();
  const changeRoute = () => {
    router.push('/signup');
  };
  return (
    <div>
      {' '}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-5xl lg:text-5xl font-bold mb-6 leading-tight">
              VLM-Driven Open Dataset
              <br />
              <span className="text-slate-400">Navigator</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Explore and analyze large-scale driving datasets with the power of
              Vision-Language Models. Search, summarize, and extract insights
              effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={changeRoute}
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-lg font-medium transition-colors"
              >
                Get Started
              </button>
              <button
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-lg font-medium transition-colors"
                onClick={() => {
                  router.push('/about');
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
