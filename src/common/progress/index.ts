import { useEffect, useState } from 'react';

// Number of requests running, shown as the bar at the top of the page
let pending = 0;
const listeners = new Set<(count: number) => void>();

const emit = () => listeners.forEach((listener) => listener(pending));

export const progress = {
  start: () => {
    pending += 1;
    emit();
  },
  done: () => {
    pending = Math.max(0, pending - 1);
    emit();
  },
};

export const usePendingRequests = () => {
  const [count, setCount] = useState(pending);
  useEffect(() => {
    listeners.add(setCount);
    return () => {
      listeners.delete(setCount);
    };
  }, []);
  return count;
};
