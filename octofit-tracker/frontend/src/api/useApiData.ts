import { useEffect, useState } from 'react';
import { getJson } from './client.js';

type ApiDataState<T> = {
  data: T | null;
  loading: boolean;
  error: boolean;
};

export function useApiData<T>(path: string): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, loading: true, error: false });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: false });
    getJson<T>(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: false });
      })
      .catch(() => {
        if (active) setState({ data: null, loading: false, error: true });
      });
    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
