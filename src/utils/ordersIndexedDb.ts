const DB_NAME = 'vpn-orders-db';
const DB_VERSION = 1;
const ORDERS_STORE = 'orders';
const isIndexedDbAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const openOrdersDb = async (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(ORDERS_STORE)) {
        database.createObjectStore(ORDERS_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB open failed'));
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest,
): Promise<T> => {
  const database = await openOrdersDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ORDERS_STORE, mode);
    const store = transaction.objectStore(ORDERS_STORE);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB request failed'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () =>
      reject(new Error(transaction.error?.message || 'IndexedDB transaction failed'));
  });
};

export const getAllOrders = async (): Promise<Array<VpnKey>> => {
  if (!isIndexedDbAvailable()) return [];

  const orders = await withStore<Array<VpnKey>>('readonly', (store) => store.getAll());

  return orders.sort((left, right) => Number(right.activated_at) - Number(left.activated_at));
};

export const upsertOrder = async (order: VpnKey): Promise<void> => {
  if (!isIndexedDbAvailable()) return;
  await withStore<IDBValidKey>('readwrite', (store) => store.put(order));
};

export const removeOrderByKey = async (orderKey: string): Promise<void> => {
  if (!isIndexedDbAvailable()) return;
  await withStore<undefined>('readwrite', (store) => store.delete(orderKey));
};

export const clearOrders = async (): Promise<void> => {
  if (!isIndexedDbAvailable()) return;
  await withStore<undefined>('readwrite', (store) => store.clear());
};
