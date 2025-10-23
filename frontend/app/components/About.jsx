import React from 'react';
import Link from 'next/link';
import Team from './Team';

const About = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111827_0%,#000000_45%,#1F2937_95%)] text-white">
      {/* Back Button */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <Link href="/land">
          <button className="group relative inline-flex items-center gap-1 px-5 py-2.5 overflow-hidden rounded-full bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-white transition-all duration-500 cursor-pointer hover:shadow-lg hover:shadow-slate-900/50">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-slate-600/0 to-blue-600/0 group-hover:from-blue-600/20 group-hover:via-slate-600/20 group-hover:to-gray-800/20 transition-all duration-500"></div>
            <svg
              className="relative w-5 h-5 transform group-hover:-translate-x-1.5 transition-transform duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="relative font-semibold text-sm tracking-wide">
              BACK
            </span>
          </button>
        </Link>
      </div>

      <section id="about" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              About the Project
            </h2>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto space-y-8 text-lg text-slate-300 leading-relaxed">
            <p className="text-xl">
              <span className="text-white font-semibold">Navis</span> is
              developed to make large-scale open-source autonomous driving
              datasets, such as KITTI, nuScenes, Argoverse, and Waymo -
              effortless to explore. Instead of manually searching through
              thousands of frames, you can simply describe what you want to
              find, like
              <em className="text-white"> “pedestrians at night” </em> or{' '}
              <em className="text-white"> “cars at an intersection” </em> and
              instantly retrieve the most relevant matches. The goal is to turn
              tedious data discovery into a seamless, natural-language-driven
              experience for researchers and engineers working with vision data.
            </p>

            <p className="text-xl">
              Under the hood, this system combines multiple state-of-the-art AI
              components.
              <span className="text-white font-semibold"> CLIP </span> encodes
              both visual frames and textual queries into a shared embedding
              space, allowing the model to understand semantic relationships
              between what’s seen and what’s described.
              <span className="text-white font-semibold"> BLIP </span> generates
              concise, descriptive captions for each frame, enriching metadata
              with human-readable summaries. These embeddings are then indexed
              using
              <span className="text-white font-semibold"> FAISS </span>{' '}
              (Facebook AI Similarity Search) to enable high-speed similarity
              search across millions of vectors.
            </p>

            <p className="text-xl">
              By unifying these components, the navigator dramatically reduces
              the manual overhead that researchers typically face when studying
              open-source driving datasets. Whether you’re investigating rare
              edge cases like night-time jaywalking or curating balanced test
              sets for perception models, the system helps you pinpoint exactly
              what you need within seconds. It bridges the gap between raw
              visual data and human intent, creating a more intuitive,
              language-driven interface for exploring complex multimodal
              datasets.
            </p>
          </div>

          {/* Team Section */}
          <Team />
        </div>
      </section>
    </div>
  );
};

export default About;
