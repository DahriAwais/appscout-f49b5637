import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { dateLabel, type StoreReview } from '@appscout/core';
export function ReviewList({ reviews }: { reviews: StoreReview[] }) {
  const parent = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react/incompatible-library -- Vite uses no React Compiler; mutable virtualizer APIs stay local to this un-memoized component.
  const virtual = useVirtualizer({
    count: reviews.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 150,
    overscan: 5,
    getItemKey: (index) => reviews[index].id,
  });
  return (
    <div
      className="review-list"
      ref={parent}
      style={{ height: 480 }}
      aria-label="Recent dated reviews"
    >
      <div style={{ height: virtual.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtual.getVirtualItems().map((item) => {
          const review = reviews[item.index];
          return (
            <article
              ref={virtual.measureElement}
              data-index={item.index}
              key={item.key}
              className="review"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${item.start}px)`,
              }}
            >
              <header>
                <strong>{review.userName}</strong>
                <span>
                  {review.score}/5 · {dateLabel(review.date)}
                </span>
              </header>
              <p>{review.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
