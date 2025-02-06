import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';
import { addTimer, deleteRoutine, deleteTimer, getAllFromIndexedDB, getRoutines, getTimers, initializeDB, insertAllToIndexedDB, saveRoutine } from "./db";
import { TimerModel, TimerState, TimerStatus } from "./types";
import { formatTime } from "./lib";
import { CompletedAndPausedTimers } from "./components/completed-paused-timers";
import { Charts } from "./components/charts";
import { TimerRoutinesContainer } from "./components/timer-routines-container";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { collection, setDoc, doc, getDocs, getDoc } from "firebase/firestore";
import { db } from "./config/firebase";

function App() {
  const { user, logout } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const [timerSelected, setTimerSelected] = useState(true);

  const handleInitDB = async () => {
    await initializeDB();
    setDbReady(true);
    await syncFromFirebase();
    await refreshTimers();
    await refreshRoutines();
  };

  // static id because id getting cached
  const getNewTimer = () => {
    return {
      id: uuidv4(),
      duration: 600,
      remaining_time: 600,
      status: 'PAUSED' as TimerStatus,
      created_at: new Date().toISOString(),
      completed_at: '',
      tags: [] as string[],
      task: '',
      newTask: '',
      newTag: ''
    } as TimerModel
  }

  const [state, setState] = useState<TimerState>({
    currentTimer: getNewTimer(),
    timers: [],
    selectedRoutine: '',
    newRoutine: '',
    routines: []
  });

  const workerRef = useRef<Worker | null>(null);

  const saveTimer = async (timer: TimerModel) => {
    // assign an id during save
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { newTask, newTag, ...rest } = timer;
    const newTimer: Omit<TimerModel, 'newTask' | 'newTag'> = {
      ...rest,
      completed_at: new Date().toISOString(),
      task: timer.newTask || timer.task,
      tags: timer.tags
    }
    await addTimer(newTimer);
    await refreshTimers();
  }

  const refreshTimers = async () => {
    const timers: TimerModel[] = await getTimers();
    setState(prev => ({ ...prev, timers }));
  }

  const refreshRoutines = async () => {
    const routines: string[] = await getRoutines();
    setState(prev => ({ ...prev, routines }));
  }

  const removeTimer = async (timerId: string) => {
    await deleteTimer(timerId);
    setState(prev => ({ ...prev, timers: prev.timers.filter(timer => timer.id !== timerId) }))
  }

  const addRoutine = async (key: React.KeyboardEvent<HTMLInputElement>) => {
    if (key.code === 'Enter') {
      setState(prev => ({ ...prev, newRoutine: '' }));
      await saveRoutine(state.newRoutine);
      await refreshRoutines();
    }
  }

  const addRoutineButtonClick = async () => {
    if (state.newRoutine === '') {
      console.error('empty routine name');
      return;
    };
    setState(prev => ({ ...prev, newRoutine: '' }));
    await saveRoutine(state.newRoutine);
    await refreshRoutines();
  }

  const clearRoutine = async (routine: string) => {
    await deleteRoutine(routine);
    await refreshRoutines();
  }

  useEffect(() => {
    handleInitDB()
    if (!workerRef.current) {
      const workerUrl = new URL('../public/worker.js', import.meta.url);
      const worker = new Worker(workerUrl);
      workerRef.current = worker;
      workerRef.current.onmessage = event => {
        const { type, remaining_time } = event.data;
        switch (type) {
          case "TIMER_STARTED":
            console.log('timer started')
            break;
          case "TIMER_UPDATE":
            if (state.currentTimer == null) {
              console.error('current timer is null');
              return;
            }
            setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, remaining_time } }))
            document.title = `${formatTime(remaining_time)} - Timers`;
            break;
          case "TIMER_COMPLETED":
            // soundManager.playTimerComplete();
            setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, status: 'COMPLETED' } }))
            workerRef?.current?.postMessage({
              type: 'STOP_TIMER'
            });
            if (state.currentTimer == null) {
              console.error('timer completed but current timer null');
              return;
            }
            saveTimer(state.currentTimer);
            document.title = `Completed !`;
            setTimeout(() => {
              document.title = 'Time'
            }, 5000)
            break;
          default:
            document.title = `Time`;
            console.error('Unknown message type:', type);
        }
      }

      return () => {
        workerRef.current?.terminate();
        workerRef.current = null;
      };
    }
  }, []);

  const syncToFirebase = async () => {
    if (!user) {
      console.error('user not logged in');
      return;
    }

    const indexedDBData = await getAllFromIndexedDB();
    const ref = collection(db, "users");

    await setDoc(doc(ref, user.uid), indexedDBData)

    console.log("Synced IndexedDB to Firebase ✅");
  }

   const syncFromFirebase = async () => {
      if (!user) {
          console.error('user not logged in');
          return;
      }
  
      try {
          const docRef = doc(db, "users", user.uid);
          const snapshot = await getDoc(docRef);
          
          if (!snapshot.exists()) {
              console.log("No data found in Firebase");
              return;
          }
  
          const data = snapshot.data() as Record<string, Array<{ key: IDBValidKey; value: any }>>;
          await insertAllToIndexedDB(data);
          await refreshTimers();
          await refreshRoutines();
          console.log("Synced Firebase to IndexedDB ✅");
      } catch (error) {
          console.error("Error syncing from Firebase:", error);
      }
  };

  const syncData = async () => {
    await syncToFirebase();
    await syncFromFirebase();
  }

  return (
    <div className="w-screen h-screen grid grid-cols-3 bg-black text-white overflow-hidden">
      {/* Add logout button */}
      <nav className="w-full h-[3rem] col-span-3 flex justify-end items-center px-2">
        {!user && <Login />}
        {user &&
          <div className="flex gap-2">
            <button onClick={syncData} className="btn btn-sm btn-outline">Sync Data</button>
            <button onClick={logout} className="btn btn-sm btn-outline">Logout</button>
          </div>
        }
      </nav>


      <div className="col-span-3 relative h-[calc(100vh-4rem)] sm:hidden">
        <div className="carousel w-full h-full snap-x snap-mandatory overflow-x-auto">
          <div id="timer-container" className="carousel-item w-full flex-shrink-0 snap-center" tabIndex={0}>
            <TimerRoutinesContainer
              mobile={true}
              className="w-full h-full flex flex-col items-center justify-center"
              addRoutine={addRoutine}
              addRoutineButtonClick={addRoutineButtonClick}
              clearRoutine={clearRoutine}
              dbReady={dbReady}
              getNewTimer={getNewTimer}
              saveTimer={saveTimer}
              setTimerSelected={setTimerSelected}
              state={state}
              setState={setState}
              timerSelected={timerSelected}
              workerRef={workerRef}
            />
          </div>

          <div id="charts" className="carousel-item w-full flex-shrink-0 snap-center">
            <Charts
              className="w-full h-full"
              state={state}
              mobile={true}
            />
          </div>

          <div id="timers-list" className="carousel-item w-full flex-shrink-0 snap-center">
            <CompletedAndPausedTimers
              className="w-full h-full px-5"
              state={state}
              removeTimer={removeTimer}
              setState={setState}
              workerRef={workerRef}
              mobile={true}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 py-2 bg-black">
          <a href="#timer-container" className="btn btn-md">timer</a>
          <a href="#charts" className="btn btn-md">charts</a>
          <a href="#timers-list" className="btn btn-md">history</a>
        </div>
      </div>

      {/* above mobile */}
      {/* chart */}
      <Charts
        className="h-[500px] pt-[10vh]"
        state={state}
      />
      {/* timer */}
      <TimerRoutinesContainer
        className="hidden sm:flex flex-col items-center h-[500px] pt-[10vh]"
        addRoutine={addRoutine}
        addRoutineButtonClick={addRoutineButtonClick}
        clearRoutine={clearRoutine}
        dbReady={dbReady}
        getNewTimer={getNewTimer}
        saveTimer={saveTimer}
        setTimerSelected={setTimerSelected}
        state={state}
        setState={setState}
        timerSelected={timerSelected}
        workerRef={workerRef}
      />
      {/* completed timers */}
      <CompletedAndPausedTimers
        className="h-[500px] pt-[10vh]"
        state={state}
        removeTimer={removeTimer}
        setState={setState}
        workerRef={workerRef}
      />
    </div>
  )
}

export default App
