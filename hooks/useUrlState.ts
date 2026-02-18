import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for managing state in URL query parameters
 * Enables deep linking, shareable URLs, and browser history navigation
 */
export const useUrlState = <T extends string>(
  key: string,
  defaultValue: T,
  storageKey?: string
): [T, (value: T) => void] => {
  // Initialize from URL params or localStorage fallback
  const [state, setState] = useState<T>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get(key);
    
    if (urlValue) {
      return urlValue as T;
    }
    
    // Fallback to localStorage if available
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) return stored as T;
    }
    
    return defaultValue;
  });

  // Update URL when state changes
  const updateState = useCallback((value: T) => {
    setState(value);
    
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (value === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    window.history.pushState({}, '', newUrl);
    
    // Also update localStorage if key provided
    if (storageKey) {
      localStorage.setItem(storageKey, value);
    }
  }, [key, defaultValue, storageKey]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlValue = params.get(key);
      if (urlValue) {
        setState(urlValue as T);
        if (storageKey) {
          localStorage.setItem(storageKey, urlValue);
        }
      } else {
        setState(defaultValue);
        if (storageKey) {
          localStorage.setItem(storageKey, defaultValue);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [key, defaultValue, storageKey]);

  return [state, updateState];
};

/**
 * Hook for managing multiple URL parameters at once
 */
export const useUrlParams = () => {
  const getParam = (key: string): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  const setParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  const deleteParam = (key: string) => {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  return { getParam, setParam, setParams, deleteParam };
};
