import { useState, useEffect, useCallback } from 'react';

export const useFetch = (fetchFunction, dependencies = [], autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, refetch: execute };
};

export default useFetch;
