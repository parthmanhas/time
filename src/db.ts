import { TimerModel } from "./types";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';

const TIMERS_DB = 'time-db';
const TIMERS_STORE = 'timers';
const ROUTINES_COMPLETION_STORE = 'routines-completion';
const ROUTINES_STORE = 'routines';

export const createUpdateTimer = async (timer: TimerModel, userId: string) => {
    const timerRef = doc(db, `usersTest/${userId}/timers/${timer.id}`);
    await setDoc(timerRef, timer);
};

export const getTimers = async (userId: string): Promise<TimerModel[]> => {
    const timersRef = collection(db, `usersTest/${userId}/timers`);
    const snapshot = await getDocs(timersRef);
    return snapshot.docs.map(doc => doc.data() as TimerModel);
};

export const deleteTimer = async (timerId: string, userId: string) => {
    const timerRef = doc(db, `usersTest/${userId}/timers/${timerId}`);
    await deleteDoc(timerRef);
};


export const getRoutines = async (userId: string): Promise<string[]> => {
    const routinesRef = collection(db, `usersTest/${userId}/routines`);
    const snapshot = await getDocs(routinesRef);
    return snapshot.docs.map(doc => doc.data().name);
};

export const createRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `usersTest/${userId}/routines/${routine}`);
    await setDoc(routineRef, { name: routine });
};

export const readRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `usersTest/${userId}/routines/${routine}`);
    const docSnap = await getDoc(routineRef);
    if (docSnap.exists()) {
        return docSnap.data().name;
    }
    return null;
}

export const deleteRoutine = async (routine: string, userId: string) => {
    const routineRef = doc(db, `usersTest/${userId}/routines/${routine}`);
    await deleteDoc(routineRef);
};

export const addRoutineCompletion = async (routine: string, date: Date, userId: string) => {
    const completionRef = doc(db, `usersTest/${userId}/${routine}/${date.toISOString()}`);
    await setDoc(completionRef, { date });
}

export const deleteOneRoutineCompletion = async (routine: string, date: Date, userId: string) => {
    const completionRef = doc(db, `usersTest/${userId}/${routine}/${date.toISOString()}`);
    await deleteDoc(completionRef);
}

