import { Timer } from "./App";

let request: IDBOpenDBRequest;
let db: IDBDatabase;

const TIMERS_DB = 'timers-db';
const TIMERS_STORE = 'timers-store';

export const initializeDB = (): Promise<boolean> => {
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB);

        request.onupgradeneeded = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            if (db.objectStoreNames.contains(TIMERS_STORE)) return;
            console.log('creating timer store');
            db.createObjectStore(TIMERS_STORE, { keyPath: 'id' })
        }

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            console.log('request.onsuccess - initDB', db.version);
            resolve(true);
        }

        request.onerror = () => {
            if (request.readyState === 'pending') return;
            resolve(false);
        }
    })
}

export const addTimer = (timer: Omit<Timer, 'newTask' | 'newTag'>): Promise<boolean> => {
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(TIMERS_STORE, 'readwrite');
            const timerStore = tx.objectStore(TIMERS_STORE);
            timerStore.add(timer);
            console.log('timer added');
            resolve(true);
        }

        request.onerror = () => {
            if (request.readyState === 'pending') return;
            const error = request.error?.message
            console.log(error);
            resolve(false);
        }
    })
}

export const getTimers = <T>(): Promise<T[]> => {
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(TIMERS_STORE, 'readonly');
            const store = tx.objectStore(TIMERS_STORE);
            const res = store.getAll();
            console.log('request.onsuccess - getTimers');
            res.onsuccess = () => {
                resolve(res.result);
            };
        };
    });
};

export const deleteTimer = (key: string): Promise<boolean> => {
    return new Promise((resolve) => {
        // again open the connection
        request = indexedDB.open(TIMERS_DB);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            console.log('request.onsuccess - deleteTimer', key);
            db = request.result;
            const tx = db.transaction(TIMERS_STORE, 'readwrite');
            const store = tx.objectStore(TIMERS_STORE);
            const res = store.delete(key);

            // add listeners that will resolve the Promise
            res.onsuccess = () => {
                if (request.readyState === 'pending') return;
                resolve(true);
            };
            res.onerror = () => {
                if (request.readyState === 'pending') return;
                resolve(false);
            }
        };
    });
};