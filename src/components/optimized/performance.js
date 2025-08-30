// Performance optimization utilities

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit the rate of function calls
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to limit
 * @returns {Function} - The throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoization function for expensive calculations
 * @param {Function} fn - The function to memoize
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} - The memoized function
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Batch multiple state updates to reduce re-renders
 * @param {Function} callback - The callback containing state updates
 */
export const batchUpdates = (callback) => {
  // In React 18+, updates are automatically batched
  // This is a compatibility function for older versions
  if (typeof window !== 'undefined' && window.React && window.React.unstable_batchedUpdates) {
    window.React.unstable_batchedUpdates(callback);
  } else {
    callback();
  }
};

/**
 * Create a stable reference for objects to prevent unnecessary re-renders
 * @param {Object} obj - The object to stabilize
 * @param {Array} deps - Dependencies to watch for changes
 * @returns {Object} - The stable object reference
 */
export const useStableObject = (obj, deps) => {
  const [stableObj, setStableObj] = React.useState(obj);
  
  React.useEffect(() => {
    setStableObj(obj);
  }, deps);
  
  return stableObj;
};

/**
 * Lazy load components to improve initial bundle size
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} fallback - Fallback component while loading
 * @returns {React.Component} - Lazy loaded component
 */
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);
  
  return React.forwardRef((props, ref) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
};

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  static measurements = new Map();
  
  static start(label) {
    this.measurements.set(label, performance.now());
  }
  
  static end(label) {
    const startTime = this.measurements.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      this.measurements.delete(label);
      return duration;
    }
    return null;
  }
  
  static measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  static async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}
