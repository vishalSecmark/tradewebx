import { useState, useEffect } from 'react';

export const useLocalStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      setValue(item ? item : initialValue);
    }
  }, [key, initialValue]);
  
  return [value, setValue];
};