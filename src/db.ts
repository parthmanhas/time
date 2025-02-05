import dayjs from "dayjs";
import { TimerModel } from "./types";

const VERSION = 1;

const TIMERS_DB = 'time-db';
const TIMERS_STORE = 'timers';
const ROUTINES_COMPLETION_STORE = 'routines-completion';
const ROUTINES_STORE = 'routines';

export const initializeDB = (): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);
        console.log('Opening database version:', version);

        request.onupgradeneeded = () => {
            console.log('onupgradeneeded triggered');

            // if (request.readyState === 'pending') return;
            db = request.result;
            console.log('Upgrading database to version:', version);
            if (!db.objectStoreNames.contains(TIMERS_STORE)) {
                console.log('creating timer store');
                db.createObjectStore(TIMERS_STORE, { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains(ROUTINES_COMPLETION_STORE)) {
                console.log('creating routines completion store');
                db.createObjectStore(ROUTINES_COMPLETION_STORE)
            }
            if (!db.objectStoreNames.contains(ROUTINES_STORE)) {
                console.log('creating routines store');
                db.createObjectStore(ROUTINES_STORE)
            }

        }

        request.onsuccess = () => {
            db = request.result;
            console.log('request.onsuccess - initDB', db.version);
            resolve(true);
        }

        request.onerror = (event) => {
            console.error('Error opening database:', (event.target as IDBRequest).error);
            resolve(false);
        }
    })
}

export const insertAllToIndexedDB = async (data: Record<string, Array<{key: IDBValidKey, value: any}>>) => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;

    return new Promise<boolean>((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);
        console.log('Opening database version:', version);

        request.onsuccess = async () => {
            db = request.result;
            console.log('request.onsuccess - insertAllToIndexedDB', db.version);
            
            try {
                // Process each store's data sequentially
                for (const [storeName, items] of Object.entries(data)) {
                    const tx = db.transaction(storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    const hasKeyPath = store.keyPath !== null;

                    // Wait for all items in current store to be added
                    await Promise.all(items.map(item => 
                        new Promise<void>((resolveItem, rejectItem) => {
                            let request;
                            if (hasKeyPath) {
                                // For stores with keyPath (like timers store), only pass the value
                                request = store.put(item.value);
                            } else {
                                // For stores without keyPath, pass both key and value
                                request = store.put(item.value, item.key);
                            }
                            
                            request.onsuccess = () => resolveItem();
                            request.onerror = () => {
                                console.error(`Error adding item to ${storeName}:`, request.error);
                                rejectItem(request.error);
                            };
                        })
                    ));
                }
                resolve(true);
            } catch (error) {
                console.error('Error inserting data:', error);
                resolve(false);
            }
        };

        request.onerror = (event) => {
            console.error('Error opening database:', (event.target as IDBRequest).error);
            resolve(false);
        };
    });
};

export const getAllFromIndexedDB = async () => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    type CombinedData = {
        [x: string]: any;
    }
    return new Promise<CombinedData>((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);
        console.log('Opening database version:', version);

        request.onsuccess = async () => {
            db = request.result;
            console.log('request.onsuccess - getAllFromIndexedDB', db.version);
            
            const tx = db.transaction(db.objectStoreNames, 'readonly');
            const stores = Array.from(db.objectStoreNames).map((storeName) => tx.objectStore(storeName));
            
            type StoreResult = { 
                storeName: string; 
                data: Array<{
                    key: IDBValidKey;
                    value: any;
                }> 
            };

            const dataPromises = stores.map((store) =>
                new Promise<StoreResult>((resolveStore) => {
                    const request = store.openCursor();
                    const storeData: Array<{key: IDBValidKey; value: any}> = [];

                    request.onsuccess = (event) => {
                        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
                        if (cursor) {
                            storeData.push({
                                key: cursor.key,
                                value: cursor.value
                            });
                            cursor.advance(1); // Using advance(1) instead of continue()
                        } else {
                            resolveStore({
                                storeName: store.name,
                                data: storeData
                            });
                        }
                    };
                    
                    request.onerror = () => {
                        console.error('Error getting data from store:', store.name);
                        resolveStore({
                            storeName: store.name,
                            data: []
                        });
                    }
                })
            );

            const results = await Promise.all(dataPromises);
            const combinedData = results.reduce((acc: Record<string, any>, curr) => ({
                ...acc,
                [curr.storeName]: curr.data
            }), {});

            resolve(combinedData);
        }

        request.onerror = (event) => {
            console.error('Error opening database:', (event.target as IDBRequest).error);
            resolve({});
        }
    });
};

export const addTimer = (timer: Omit<TimerModel, 'newTask' | 'newTag'>): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(TIMERS_STORE, 'readwrite');
            const timerStore = tx.objectStore(TIMERS_STORE);
            timerStore.delete(timer.id);
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
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

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
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        // again open the connection
        request = indexedDB.open(TIMERS_DB, version);

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

export const completeRoutine = (name: string, date: string): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_COMPLETION_STORE, 'readwrite');
            const store = tx.objectStore(ROUTINES_COMPLETION_STORE);
            const res = store.add(date, name);

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
}

export const deleteRoutineCompletion = (name: string): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_COMPLETION_STORE, 'readwrite');
            const store = tx.objectStore(ROUTINES_COMPLETION_STORE);
            const res = store.delete(name);

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
}

export const updateCompletions = (name: string, completions: string[]): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_COMPLETION_STORE, 'readwrite');
            const store = tx.objectStore(ROUTINES_COMPLETION_STORE);
            const res = store.put(completions, name);

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
}

export const commitRoutineCompletion = async (name: string, date: Date): Promise<string[]> => {
    const completions = (await getRoutineCompletions<string>(name) || []).flatMap((c) => c);
    let updatedCompletions: string[] = [];
    updatedCompletions = [...completions, date.toISOString()];
    await updateCompletions(name, updatedCompletions)
    // return updated completions
    return new Promise((resolve) => {
        resolve(updatedCompletions);
    });
}

export const getRoutineCompletions = <T>(name: string): Promise<T[]> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_COMPLETION_STORE, 'readonly');
            const store = tx.objectStore(ROUTINES_COMPLETION_STORE);
            const res = store.get(name);
            res.onsuccess = () => {
                resolve(res.result);
            };
        };

        request.onerror = (event) => {
            if (request.readyState === 'pending') return;
            console.error('Error getRoutineCompletions:', (event.target as IDBRequest).error);
            resolve([]);
        }
    });
}

export const saveRoutine = (name: string): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_STORE, 'readwrite');
            const store = tx.objectStore(ROUTINES_STORE);
            const res = store.add(name, name);

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
}

export const getRoutines = <T>(): Promise<T[]> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_STORE, 'readonly');
            const store = tx.objectStore(ROUTINES_STORE);
            const res = store.getAll();
            res.onsuccess = () => {
                resolve(res.result);
            };
        };
    });
}

export const deleteRoutine = (name: string): Promise<boolean> => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_STORE, 'readwrite');
            const store = tx.objectStore(ROUTINES_STORE);
            const res = store.delete(name);


            console.log('deleteRoutine', name);


            res.onsuccess = () => {
                if (request.readyState === 'pending') return;
                const tx2 = db.transaction(ROUTINES_COMPLETION_STORE, 'readwrite');
                const store2 = tx2.objectStore(ROUTINES_COMPLETION_STORE);
                const res2 = store2.delete(name);

                res2.onsuccess = () => {
                    if (request.readyState === 'pending') return;
                    resolve(true);
                };
                res2.onerror = (event) => {
                    if (request.readyState === 'pending') return;
                    console.error('Error deleting routine completions:', (event.target as IDBRequest).error);
                    resolve(false);
                }
            };
            res.onerror = (event) => {
                if (request.readyState === 'pending') return;
                console.error('Error deleting routine:', (event.target as IDBRequest).error);
                resolve(false);
            }


        };
    });
}

export const deleteOneRoutineCompletion = async (name: string, date: Date) => {
    let request: IDBOpenDBRequest;
    let db: IDBDatabase;
    const version = VERSION;
    return new Promise((resolve) => {
        request = indexedDB.open(TIMERS_DB, version);

        request.onsuccess = () => {
            if (request.readyState === 'pending') return;
            db = request.result;
            const tx = db.transaction(ROUTINES_COMPLETION_STORE, 'readwrite');
            const store = tx.objectStore(ROUTINES_COMPLETION_STORE);
            const res = store.getAll(name);

            res.onsuccess = () => {
                if (request.readyState === 'pending') return;
                console.log('deleteOneRoutineCompletion', name);
                const completions = res.result.flat() as string[];
                const updatedCompletions = completions.filter((d) => dayjs(d).isSame(date, 'day') === false);
                store.put(updatedCompletions, name);
                resolve(updatedCompletions);
            }

            res.onerror = (event) => {
                if (request.readyState === 'pending') return;
                console.error('Error deleting routine completion:', (event.target as IDBRequest).error);
                resolve(false);
            }
        };
    });
};

export const exportData = async (dbName: string, storeName: string) => {
    const version = VERSION;
    const request = indexedDB.open(dbName, version);
    request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const data = getAllRequest.result;
            console.log('Exported Data:', data);

            // Convert to JSON and download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${storeName}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };

        getAllRequest.onerror = () => {
            console.error('Error retrieving data:', getAllRequest.error);
        };
    };

    request.onerror = () => {
        console.error('Error opening database:', request.error);
    };
};

