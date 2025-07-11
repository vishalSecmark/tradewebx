// utils/indexedDB.ts
export const getDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ekycDB', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('ekycData')) {
        db.createObjectStore('ekycData');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFromDB = async (key: string): Promise<any> => {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('ekycData', 'readonly');
    const store = transaction.objectStore('ekycData');
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

export const setToDB = async (key: string, value: any): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('ekycData', 'readwrite');
    const store = transaction.objectStore('ekycData');
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};