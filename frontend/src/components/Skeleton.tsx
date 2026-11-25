import React, { useState, useEffect, useRef } from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 6, cols = 5 }) => {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center justify-between px-4 py-4 gap-4">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <div
              key={cIdx}
              className={`h-3.5 rounded-full bg-slate-200/80 ${
                cIdx === 0 ? 'w-1/4' : cIdx === cols - 1 ? 'w-24' : 'w-16'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const OverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header banner skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-6 w-52 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-80 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* 6 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-2.5">
              <div className="h-3 w-24 bg-slate-200 rounded-full" />
              <div className="h-7 w-16 bg-slate-200 rounded-lg" />
              <div className="h-2.5 w-28 bg-slate-100 rounded-full" />
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Bottom breakdown skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="h-4 w-56 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const InboxListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
              <div className="h-2.5 w-10 bg-slate-100 rounded-full" />
            </div>
            <div className="h-3 w-40 bg-slate-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChatMessagesSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex justify-start">
        <div className="h-12 w-56 bg-white/80 rounded-2xl border border-slate-200/60" />
      </div>
      <div className="flex justify-end">
        <div className="h-14 w-64 bg-emerald-100/70 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <div className="h-10 w-44 bg-white/80 rounded-2xl border border-slate-200/60" />
      </div>
      <div className="flex justify-end">
        <div className="h-12 w-52 bg-emerald-100/70 rounded-2xl" />
      </div>
    </div>
  );
};

/**
 * Progressive Infinite Scroll hook using IntersectionObserver.
 * Automatically reveals `step` more items whenever the sentinel enters viewport.
 */
export function useInfiniteScroll(totalItems: number, initialCount = 15, step = 15) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count if list shrinks or changes significantly
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [totalItems, initialCount]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= totalItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < totalItems && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + step, totalItems));
            setLoadingMore(false);
          }, 250);
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, totalItems, step, loadingMore]);

  return {
    visibleCount,
    hasMore: visibleCount < totalItems,
    loadingMore,
    sentinelRef,
  };
}

export const InfiniteScrollFooter: React.FC<{
  hasMore: boolean;
  loadingMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  shownCount: number;
  totalCount: number;
}> = ({ hasMore, loadingMore, sentinelRef, shownCount, totalCount }) => {
  if (totalCount === 0) return null;

  return (
    <div ref={sentinelRef} className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
      <span>
        Showing <strong className="text-slate-800">{shownCount}</strong> of <strong className="text-slate-800">{totalCount}</strong> records
      </span>
      {hasMore ? (
        <div className="flex items-center space-x-2 text-[#075E54] font-semibold">
          <div className="w-3.5 h-3.5 border-2 border-[#075E54] border-t-transparent rounded-full animate-spin" />
          <span>{loadingMore ? 'Loading more...' : 'Scroll down for more'}</span>
        </div>
      ) : (
        <span className="text-[11px] text-slate-400 font-medium">All records loaded</span>
      )}
    </div>
  );
};
