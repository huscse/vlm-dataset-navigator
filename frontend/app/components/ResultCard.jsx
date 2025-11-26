'use client';

import React, { useState, useEffect } from 'react';
import { Database, Image as ImageIcon } from 'lucide-react';

export default function ResultCard({ result, index }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Stagger image loading: load in batches of 3
  useEffect(() => {
    const delay = Math.floor(index / 3) * 500; // 0ms, 500ms, 1000ms, 1500ms...
    const timer = setTimeout(() => setShouldLoad(true), delay);
    return () => clearTimeout(timer);
  }, [index]);

  const rawSrc = result.imageUrl || result.thumbnailUrl;
  const imgSrc = rawSrc ? encodeURI(rawSrc) : null;
  const title = result.title || 'Untitled Scene';
  const datasetLabel =
    result.dataset ?? result.raw?.dataset ?? 'Unknown dataset';

  const handleImageError = (e) => {
    if (retryCount < 2) {
      // Retry up to 2 times with exponential backoff
      const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        // Force reload by changing src
        e.currentTarget.src = imgSrc + '?retry=' + (retryCount + 1);
      }, retryDelay);
    } else {
      setImgError(true);
      e.currentTarget.src = '';
    }
  };

  return (
    <article className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl overflow-hidden hover:from-white/10 hover:to-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 group cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-gray-900/50">
        {imgSrc && shouldLoad && !imgError ? (
          <>
            <img
              src={imgSrc}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {retryCount > 0 && (
              <div className="absolute top-2 right-2 bg-yellow-500/80 text-xs px-2 py-1 rounded">
                Retrying...
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
            {!shouldLoad ? (
              <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                <span className="text-sm">
                  {imgError ? 'Failed to load' : 'No preview available'}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-gray-300 transition-colors">
          {title}
        </h3>

        {result.snippet && (
          <p className="text-s text-gray-200 mb-4 line-clamp-3 leading-relaxed">
            {result.snippet}
          </p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <Database className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-s text-white font-bold truncate">
            {datasetLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
