import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';
import { createUpdateTimer, deleteTimer, getRoutines, getTimers } from "./db";
import { TimerModel, AppState, TimerStatus, RoutineWithCompletions } from "./types";
import { formatTime } from "./lib";
import { CompletedAndPausedTimers } from "./components/completed-paused-timers";
import { Charts } from "./components/charts";
import { TimerRoutinesContainer } from "./components/timer-routines-container";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { disableNetworkApp, enableNetworkApp } from "./config/firebase";
import dayjs from "dayjs";

export const getNewTimer = () => {
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

function App() {
  const { user, logout } = useAuth();
  const [timerSelected, setTimerSelected] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // 640px matches sm: breakpoint

  const [state, setState] = useState<AppState>({
    currentTimer: getNewTimer(),
    timers: [],
    selectedRoutine: '',
    newRoutine: '',
    routines: []
  });

  const workerRef = useRef<Worker | null>(null);


  const completeAndSaveTimer = async () => {
    const completedTimer = {
      ...state.currentTimer,
      id: uuidv4(),   // use because id is being cached by workerRef useEffect
      status: 'COMPLETED' as TimerStatus,
      completed_at: new Date().toISOString()
    }
    setState(prev => ({
      ...prev,
      currentTimer: getNewTimer(),
      timers: [...prev.timers, completedTimer]
    }))
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { newTask, newTag, ...rest } = completedTimer;
    await createUpdateTimer(rest, user.uid);
  }

  const refreshTimers = async () => {
    if (!user) return;
    const timers: TimerModel[] = await getTimers(user.uid);
    setState(prev => ({ ...prev, timers }));
  }

  const refreshRoutines = async () => {
    if (!user) return;
    const routines: RoutineWithCompletions[] = await getRoutines(user.uid);
    setState(prev => ({ ...prev, routines, selectedRoutine: routines[0]?.name || '' }));
  }

  const removeTimer = async (timerId: string) => {
    setState(prev => ({ ...prev, timers: prev.timers.filter(timer => timer.id !== timerId) }))
    if (!user) return;
    await deleteTimer(timerId, user.uid);
  }

  const addRoutine = async (key: React.KeyboardEvent<HTMLInputElement>) => {
    if (!user) return;
    if (key.code === 'Enter') {
      setState(prev => ({ ...prev, newRoutine: '' }));
      // await saveRoutine(state.newRoutine, user.uid);
      await refreshRoutines();
    }
  }

  const addRoutineButtonClick = async () => {
    if (!user) return;
    if (state.newRoutine === '') {
      console.error('empty routine name');
      return;
    };
    setState(prev => ({ ...prev, newRoutine: '' }));
    // await saveRoutine(state.newRoutine, user.uid);
    await refreshRoutines();
  }

  useEffect(() => {
    const initApp = async () => {
      if (user) {
        const lastOnline = localStorage.getItem('last-online');
        const daysSinceLastOnline = lastOnline ?
          dayjs().diff(dayjs(lastOnline), 'days') :
          Infinity;

        if (daysSinceLastOnline >= 1) {
          await enableNetworkApp();
          localStorage.setItem('last-online', dayjs().toISOString());
        } else {
          await disableNetworkApp();
        }
        await refreshTimers();
        await refreshRoutines();
      }
    };
    initApp();
  }, []);

  useEffect(() => {
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
            {
              workerRef?.current?.postMessage({
                type: 'STOP_TIMER'
              });
              if (state.currentTimer == null) {
                console.error('timer completed but current timer null');
                return;
              }
              completeAndSaveTimer();
              document.title = `Completed !`;
              setTimeout(() => {
                document.title = 'Time'
              }, 5000)
            }
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-screen h-screen grid grid-cols-3 bg-black text-white overflow-hidden">
      <nav className="w-full h-[3rem] col-span-3 flex justify-end items-center px-2">
        {!user && <Login />}
        {user &&
          <div className="flex gap-2">
            <button onClick={logout} className="btn btn-sm btn-outline">Logout</button>
          </div>
        }
      </nav>

      {isMobile && (
        <div className="col-span-3 relative h-[80vh] sm:hidden">
          <div className="carousel w-full h-full snap-x snap-mandatory overflow-x-auto">
            <div id="timer-container" className="carousel-item w-full flex-shrink-0 snap-center" tabIndex={0}>
              <TimerRoutinesContainer
                mobile={true}
                className="w-full h-full flex flex-col items-center justify-start pt-[10vh]"
                addRoutine={addRoutine}
                addRoutineButtonClick={addRoutineButtonClick}
                getNewTimer={getNewTimer}
                // saveTimer={saveTimer}
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
      )}

      <Charts
        className="h-[500px] pt-[10vh]"
        state={state}
      />
      <TimerRoutinesContainer
        className="hidden sm:flex flex-col items-center h-[500px] pt-[10vh]"
        addRoutine={addRoutine}
        addRoutineButtonClick={addRoutineButtonClick}
        getNewTimer={getNewTimer}
        setTimerSelected={setTimerSelected}
        state={state}
        setState={setState}
        timerSelected={timerSelected}
        workerRef={workerRef}
      />
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
