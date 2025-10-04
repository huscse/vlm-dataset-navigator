'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function SearchResults({ results, loading, error }) {
  // Loading state
  if (loading) {
    return (
      <div className="mt-8 max-w-5xl mx-auto text-center">
        <p className="text-gray-300">Searching…</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state (no results yet)
  if (!results || results.length === 0) {
    return (
      <div className="mt-8 max-w-5xl mx-auto text-center">
        <p className="text-gray-400">
          No results yet. Try searching for "pedestrian" or "red light".
        </p>
      </div>
    );
  }

  // Results grid
  return (
    <div className="mt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-4 text-gray-400 text-sm">
        Found {results.length} result{results.length !== 1 ? 's' : ''}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <li
            key={result.id || `${result.title}-${index}`}
            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
          >
            {/* Thumbnail */}
            <div className="h-40 bg-gray-900 overflow-hidden flex items-center justify-center">
              {result.thumbnailUrl ? (
                <img
                  src={result.thumbnailUrl}
                  alt={result.title || 'Scene preview'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <span className="text-gray-500 text-sm">No preview</span>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">
                {result.title || 'Untitled'}
              </h3>

              {result.snippet && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                  {result.snippet}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="truncate">
                  {result.dataset || 'Unknown dataset'}
                </span>
                {typeof result.timestampSec !== 'undefined' && (
                  <span className="ml-2 flex-shrink-0">
                    {Math.round(result.timestampSec)}s
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
