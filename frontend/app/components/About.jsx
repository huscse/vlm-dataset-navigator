import Link from 'next/link';
import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111827_0%,#000000_45%,#1F2937_95%)] text-white">
      {/* Back Button */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/land"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      <section id="about" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              About the Project
            </h2>
          </div>
          <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
            <p>
              This VLM-Driven Open Dataset Navigator is built to make large
              driving datasets like KITTI, nuScenes, Argoverse, and Waymo easier
              to explore. Instead of digging through thousands of frames, you
              can simply describe what you’re looking for -
              <em> “pedestrians at night”</em> or{' '}
              <em>“cars at an intersection”</em> - and instantly see the most
              relevant results.
            </p>

            <p>
              Behind the scenes, a Vision-Language Model (VLM) encodes both the
              datasets and your query into embeddings. These embeddings are
              stored in a high-speed vector index, while a metadata database
              tracks each item’s captions, timestamps, and dataset location.
              Together, they power fast, natural-language search across massive
              collections.
            </p>

            <p>
              This project reduces the manual effort researchers and engineers
              usually face when working with open driving datasets. Whether
              you’re analyzing rare traffic scenarios or curating examples for
              testing, the navigator brings you directly to the right data,
              quickly and intuitively.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
