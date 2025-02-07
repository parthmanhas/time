import { RoutineWithCompletions, TimerModel } from "./types";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';

export const createUpdateTimer = async (timer: TimerModel, userId: string) => {
    const {newTask, newTag, ...rest} = timer;
    const timerRef = doc(db, `users/${userId}/timers/${timer.id}`);
    await setDoc(timerRef, rest);
};

export const getTimers = async (userId: string): Promise<TimerModel[]> => {
    const timersRef = collection(db, `users/${userId}/timers`);
    const snapshot = await getDocs(timersRef);
    return snapshot.docs.map(doc => doc.data() as TimerModel);
};

export const deleteTimer = async (timerId: string, userId: string) => {
    const timerRef = doc(db, `users/${userId}/timers/${timerId}`);
    await deleteDoc(timerRef);
};


export const getRoutines = async (userId: string): Promise<RoutineWithCompletions[]> => {
    const routinesRef = collection(db, `users/${userId}/routines`);
    const snapshot = await getDocs(routinesRef);
    
    // Get all routines and their completions in parallel
    const routinesWithCompletions = await Promise.all(
        snapshot.docs.map(async (doc) => {
            const routineName = doc.data().name;
            const completionsRef = collection(db, `users/${userId}/routines/${routineName}/completions`);
            const completionsSnapshot = await getDocs(completionsRef);
            
            return {
                name: routineName,
                completions: completionsSnapshot.docs.map(doc => doc.data().date.toDate())
            };
        })
    );

    return routinesWithCompletions;
};

export const createRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `users/${userId}/routines/${routine}`);
    await setDoc(routineRef, { name: routine });
};

export const readRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `users/${userId}/routines/${routine}`);
    const docSnap = await getDoc(routineRef);
    if (docSnap.exists()) {
        return docSnap.data().name;
    }
    return null;
}

export const deleteRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `users/${userId}/routines/${routine}`);
    await deleteDoc(routineRef);
};

export const commitRoutine = async (routine: string, date: Date, userId: string) => {
    const completionRef = doc(db, `users/${userId}/routines/${routine}/completions/${date.toISOString()}`);
    await setDoc(completionRef, { date });
}

export const deleteOneRoutineCompletion = async (routine: string, date: Date, userId: string) => {
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
};

