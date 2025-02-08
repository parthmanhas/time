import { RoutineWithCompletions, TimerModel } from "./types";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc, updateDoc } from 'firebase/firestore';
import { db, disableNetworkApp, enableNetworkApp } from './config/firebase';

const withNetwork = async <T>(operation: () => Promise<T>) => {
    await enableNetworkApp();
    await operation()
    await disableNetworkApp();
}

export const createUpdateTimer = async (timer: TimerModel, userId: string) => {
    return withNetwork(async () => {
        const { newTask, newTag, ...rest } = timer;
        const timerRef = doc(db, `users/${userId}/timers/${timer.id}`);
        await setDoc(timerRef, rest);
    })
};

export const getTimers = async (userId: string): Promise<TimerModel[]> => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const timersRef = collection(db, `users/${userId}/timers`);

    // Get completed timers from last 30 days
    const completedTimersQuery = query(
        timersRef,
        where('status', '==', 'COMPLETED'),
        where('completed_at', '>=', thirtyDaysAgo.toISOString())
    );

    // Get queued and paused timers from last 30 days
    const otherThanCompletedTimersQuery = query(
        timersRef,
        where('status', 'in', ['QUEUED', 'PAUSED']),
        where('created_at', '>=', thirtyDaysAgo.toISOString())
    );

    // Execute both queries in parallel
    const [completedSnapshot, activeSnapshot] = await Promise.all([
        getDocs(completedTimersQuery),
        getDocs(otherThanCompletedTimersQuery)
    ]);

    const source = completedSnapshot.metadata.fromCache ? "local cache" : "server";
    console.log("getTimers - Data came from " + source);

    // Combine and return results
    return [
        ...completedSnapshot.docs.map(doc => doc.data() as TimerModel),
        ...activeSnapshot.docs.map(doc => doc.data() as TimerModel)
    ];
};

export const deleteTimer = async (timerId: string, userId: string) => {
    return withNetwork(async () => {
        const timerRef = doc(db, `users/${userId}/timers/${timerId}`);
        await deleteDoc(timerRef);
    })
};

export const getRoutines = async (userId: string): Promise<RoutineWithCompletions[]> => {
    const routinesRef = collection(db, `users/${userId}/routines`);
    const snapshot = await getDocs(routinesRef);

    const source = snapshot.metadata.fromCache ? "local cache" : "server";
    console.log("getRoutines - Data came from " + source);

    // Get all routines and their completions in parallel
    const routinesWithCompletions = await Promise.all(
        snapshot.docs.map(async (doc) => {
            const routineName = doc.data().name;
            const duration = doc.data().duration;
            const completionsRef = collection(db, `users/${userId}/routines/${routineName}/completions`);
            const completionsSnapshot = await getDocs(completionsRef);

            return {
                name: routineName,
                duration,
                completions: completionsSnapshot.docs.map(doc => doc.data().date.toDate())
            };
        })
    );

    return routinesWithCompletions;
};

export const createRoutine = async (routine: string, userId: string) => {
    return withNetwork(async () => {
        const routineRef = doc(db, `users/${userId}/routines/${routine}`);
        await setDoc(routineRef, { name: routine });
    })
};

export const readRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `users/${userId}/routines/${routine}`);
    const docSnap = await getDoc(routineRef);
    if (docSnap.exists()) {
        return docSnap.data().name;
    }
    return null;
}

export const updateRoutineInDB = async (name: string, updates: Partial<RoutineWithCompletions>, userId: string) => {
  return withNetwork(async () => {
    const routineRef = doc(db, `users/${userId}/routines/${name}`);
    await updateDoc(routineRef, updates);
  });
};

export const deleteRoutine = async (routine: string, userId: string) => {
    return withNetwork(async () => {
        const routineRef = doc(db, `users/${userId}/routines/${routine}`);
        await deleteDoc(routineRef);
    })
};

export const commitRoutine = async (routine: string, date: Date, userId: string) => {
    return withNetwork(async () => {
        const completionRef = doc(db, `users/${userId}/routines/${routine}/completions/${date.toISOString()}`);
        await setDoc(completionRef, { date });
    })
}

export const deleteOneRoutineCompletion = async (routine: string, date: Date, userId: string) => {
    return withNetwork(async () => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const completionsRef = collection(db, `users/${userId}/routines/${routine}/completions`);
        const q = query(
            completionsRef,
            where('date', '>=', startOfDay),
            where('date', '<=', endOfDay)
        );

        const snapshot = await getDocs(q);

        // Delete all completions within the same day in parallel
        await Promise.all(
            snapshot.docs.map(doc =>
                deleteDoc(doc.ref)
            )
        );
    })
};

