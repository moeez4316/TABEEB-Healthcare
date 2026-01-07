import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

// Create a noop (no operation) storage for SSR
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(key: string, value: string) {
      void key;
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

// Use localStorage when available (browser), otherwise use noop storage (SSR)
const storage = typeof window !== 'undefined' 
  ? createWebStorage('local') 
  : createNoopStorage();

export default storage;
