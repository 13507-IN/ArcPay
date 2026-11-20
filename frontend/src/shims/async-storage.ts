const dummyStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};

export default dummyStorage;
export const getItem = dummyStorage.getItem;
export const setItem = dummyStorage.setItem;
export const removeItem = dummyStorage.removeItem;
export const clear = dummyStorage.clear;
