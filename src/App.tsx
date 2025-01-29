import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';
import { addTimer, deleteRoutine, deleteTimer, getRoutines, getTimers, initializeDB, saveRoutine } from "./db";
import { TimerModel, TimerState, TimerStatus } from "./types";
import { Timer } from "./components/timer";
import { formatTime } from "./lib";
import { CompletedTimers } from "./components/completed-timers";
import { ChartsRoutines } from "./components/charts-routines";

function App() {

  const [dbReady, setDbReady] = useState(false);

  const handleInitDB = async () => {
    await initializeDB();
    setDbReady(true);
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
    }
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
      status: 'COMPLETED' as TimerStatus,
      completed_at: new Date().toISOString(),
      task: timer.newTask,
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

  return (
    <div className="w-screen sm:h-screen flex flex-col sm:grid sm:grid-cols-3 bg-black text-white overflow-hidden">
      {/* mobile */}
      {/* timer */}
      <Timer
        mobile={true}
        state={state}
        setState={setState}
        getNewTimer={getNewTimer}
        saveTimer={saveTimer}
        workerRef={workerRef}
      />
      {/* chart */}
      <ChartsRoutines
        mobile={true}
        state={state}
        dbReady={dbReady}
        setState={setState}
        addRoutine={addRoutine}
        clearRoutine={clearRoutine}
        addRoutineButtonClick={addRoutineButtonClick}
      />
      {/* completed timers */}
      <CompletedTimers
        mobile={true}
        state={state}
        removeTimer={removeTimer}
      />

      {/* above mobile */}
      {/* chart */}
      <ChartsRoutines
        state={state}
        dbReady={dbReady}
        setState={setState}
        addRoutine={addRoutine}
        clearRoutine={clearRoutine}
        addRoutineButtonClick={addRoutineButtonClick}
      />
      {/* timer */}
      <Timer
        state={state}
        setState={setState}
        getNewTimer={getNewTimer}
        saveTimer={saveTimer}
        workerRef={workerRef}
      />
      {/* completed timers */}
      <CompletedTimers
        state={state}
        removeTimer={removeTimer}
      />


    </div>
  )
}

export default App
