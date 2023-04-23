import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

export const useQueryState = (queryKey: string) => {
  const router = useRouter();
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const queryValue = router.query[queryKey] as string | undefined;
    setValue(queryValue || null);
  }, [router.query, queryKey]);

  const setQuery = useCallback(
    (newValue: string | null) => {
      const newQuery = { ...router.query, [queryKey]: newValue };
      if (!newValue) {
        delete newQuery[queryKey];
      }
      router.push({ pathname: router.pathname, query: newQuery });
    },
    [router, queryKey]
  );

  return [value, setQuery] as const;
};