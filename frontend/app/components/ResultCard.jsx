// frontend/app/components/ResultCard.jsx
'use client';

import React from 'react';
import { Clock, Database, Image as ImageIcon } from 'lucide-react';

export default function ResultCard({ result, index }) {
  return (
    <article className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl overflow-hidden hover:from-white/10 hover:to-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 group cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-950 overflow-hidden">
        {result.thumbnailUrl ? (
          <>
            <img
              src={result.thumbnailUrl}
              alt={result.title || 'Scene preview'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Overlay gradient for better text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
            <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
            <span className="text-sm">No preview available</span>
          </div>
        )}
        
        {/* Timestamp badge */} // will add later if needed
        {/* {typeof result.timestampSec !== 'undefined' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white font-medium">
            <Clock className="w-3 h-3" />
            {Math.round(result.timestampSec)}s
          </div>
        )} */}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-gray-300 transition-colors">
          {result.title || 'Untitled Scene'}
        </h3>

        {/* Snippet */}
        {result.snippet && (
          <p className="text-s text-gray-200 mb-4 line-clamp-3 leading-relaxed">
            {result.snippet}
          </p>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <Database className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-s text-white font-bold truncate">
            {result.dataset || 'Unknown dataset'}
          </span>
        </div>
      </div>
    </article>
  );
}
