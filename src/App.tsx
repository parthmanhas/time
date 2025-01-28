import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';
import { cn } from "./utils";
import Last30DaysChart, { generateLast30DaysDataWithoutTags, generateLast30DaysDataWithTags } from "./Last30DaysChart";
import { addTimer, deleteTimer, getTimers, initializeDB } from "./db";

type TimerStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export type Timer = {
  id: string,
  duration: number;
  remaining_time: number;
  status: TimerStatus,
  created_at: string,
  completed_at: string,
  tags: string[],
  task: string,
  newTask: string,
  newTag: string
}

type TimerState = {
  currentTimer: Timer,
  timers: Timer[]
}

function App() {

  const [isDBReady, setIsDBReady] = useState<boolean>(false);

  const handleInitDB = async () => {
    const status = await initializeDB();
    setIsDBReady(status);
    await refreshTimers();
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
    timers: []
  });

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60) + '';
    const seconds = time % 60 + '';
    return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
  }

  const formatMinutes = (time: number) => {
    return `${Math.floor(time / 60).toString().padStart(2, '0')}`
  }

  const formatSeconds = (time: number) => {
    return `${Math.floor(time % 60).toString().padStart(2, '0')}`
  }

  const workerRef = useRef<Worker | null>(null);

  const toggleTimer = () => {
    
    setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, status: prev.currentTimer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } }));
    workerRef.current?.postMessage({
      type: state.currentTimer.status === 'ACTIVE' ? 'STOP_TIMER' : 'START_TIMER',
      payload: { id: state.currentTimer.id, remaining_time: state.currentTimer.remaining_time },
    });
  }
  
  const saveTimer = async (timer: Timer) => {
    // assign an id during save
    const { newTask, newTag, ...rest } = timer;
    const newTimer: Omit<Timer, 'newTask' | 'newTag'> = {
      ...rest,
      status: 'COMPLETED' as TimerStatus,
      completed_at: new Date().toISOString(),
      task: timer.newTask,
      tags: timer.tags
    }
    await addTimer(newTimer);
    await refreshTimers();
  }

  const addTag = (key: React.KeyboardEvent<HTMLInputElement>) => {
    if (key.code === 'Enter' && state.currentTimer.tags.indexOf(state.currentTimer.newTag) === -1) {
      setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: [...prev.currentTimer.tags, prev.currentTimer.newTag], newTag: '' } }));
    } else {
      console.error('tag already exists')
    }
  }

  const addTask = (key: React.KeyboardEvent<HTMLInputElement>) => {
    if (key.code === 'Enter') {
      setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, task: prev.currentTimer.newTask, newTask: '' } }));
    }
  }

  const removeTag = (name: string) => {
    setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: prev.currentTimer.tags.filter(t => t !== name) } }))
  }

  const refreshTimers = async () => {
    const timers: Timer[] = await getTimers();
    setState(prev => ({ ...prev, timers }));
  }

  const removeTimer = async (timerId: string) => {
    await deleteTimer(timerId);
    setState(prev => ({ ...prev, timers: prev.timers.filter(timer => timer.id !== timerId) }))
  }

  const selectTime = (duration: number) => {
    setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, duration, remaining_time: duration, status: 'PAUSED' } }))
  }

  const resetCurrentTimer = () => {
    setState(prev => ({ ...prev, currentTimer: getNewTimer() }))
  }

  const completeTimer = () => {
    saveTimer(state.currentTimer);
    resetCurrentTimer();
    workerRef.current?.postMessage({
      type: "STOP_TIMER"
    });
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
    <div className="w-screen h-screen grid grid-cols-3 bg-black text-white">
      {/* chart */}
      <div role="tablist" className="flex items-center justify-center h-full tabs tabs-border opacity-20 hover:opacity-100">
        <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="30 Days" defaultChecked />
        <div className="h-auto! tab-content bg-black">
          <Last30DaysChart timers={state.timers} />
        </div>

        <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="30 Days Tags" />
        <div className="h-auto! tab-content bg-black">
          <Last30DaysChart showTags={true} timers={state.timers} />
        </div>

        {/* <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="Daily" />
        <div className="h-auto! tab-content bg-black">Tab content 3</div> */}
      </div>
      {/* timer */}
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col gap-3">
          {/* add time */}
          <div className="flex w-full gap-3">
            <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(1)} className="btn btn-outline text-2xl">+10</button>
            <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(1200)} className="btn btn-outline text-2xl">+20</button>
            <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(1800)} className="btn btn-outline text-2xl">+30</button>
            <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(2400)} className="btn btn-outline text-2xl">+40</button>
          </div>
          <h1 className="text-9xl countdown font-mono">
            {/* {formatTime(state.currentTimer.remaining_time || 0)} */}
            <span style={{ "--value": formatMinutes(state.currentTimer.remaining_time || 0) } as React.CSSProperties}>{formatMinutes(state.currentTimer.remaining_time || 0)}</span>:
            <span style={{ "--value": formatSeconds(state.currentTimer.remaining_time || 0) } as React.CSSProperties}>{formatSeconds(state.currentTimer.remaining_time || 0)}</span>
          </h1>
          <p className={cn(
            "text-center",
            state.currentTimer.task ? "opacity-100" : "opacity-20"
          )}>{state.currentTimer.task || 'task title empty'}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {state.currentTimer.tags.length === 0 && <p className="text-center opacity-20">tags empty</p>}
            {state.currentTimer.tags.map((tag, index) =>
              <span key={index} className="badge badge-md relative cursor-pointer group bg-transparent text-white">
                {tag}
                <span onClick={() => removeTag(tag)} className="hidden group-hover:block badge badge-xs absolute -top-2 -right-3 bg-red-500 text-white">x</span>
              </span>
            )}
          </div>
          <input
            disabled={state.currentTimer.status === 'ACTIVE'}
            type="text"
            className={cn(
              "p-2 w-full rounded",
              state.currentTimer.status === 'ACTIVE' && "hidden"
            )}
            value={state.currentTimer.newTask}
            onChange={e => setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, newTask: e.target.value, task: e.target.value } }))}
            onKeyDown={addTask}
            placeholder="add task title" />
          <input
            disabled={state.currentTimer.status === 'ACTIVE'}
            type="text"
            className={cn(
              "p-2 w-full rounded",
              state.currentTimer.status === 'ACTIVE' && "hidden"
            )} value={state.currentTimer.newTag} onChange={e => setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, newTag: e.target.value } }))} onKeyDown={addTag} placeholder="add tag(s), press enter to add" />
          {/* <button onClick={toggleTimer} className={`w-full p-4 text-4xl bg-white/50 cursor-pointer hover:bg-white/30 rounded`}>
            {state?.currentTimer?.status === 'ACTIVE' ? 'pause' : 'start'}
          </button> */}
          <button onClick={toggleTimer} className="btn btn-outline">{state?.currentTimer?.status === 'ACTIVE' ? 'pause' : 'start'}</button>
          {state.currentTimer.status === 'ACTIVE' && <button onClick={completeTimer} className="btn btn-outline">complete</button>}
        </div>
      </div>
      {/* completed timers */}
      <div className={cn(
        "w-full h-full p-10 flex items-center opacity-20 hover:opacity-100",
        state.currentTimer.status === 'ACTIVE' && "border-white/10 text-white/30"
      )}>
        <div className="w-full justify-center max-h-[500px] overflow-scroll py-5">
          {state.timers.map(timer => (
            <div key={timer.id} className="relative border-white/20 border-b-[1px] p-2 group font-mono">
              <button onClick={() => removeTimer(timer.id)} className="cursor-pointer hidden group-hover:block badge badge-xs absolute -top-2 -right-0 bg-red-500 text-white">x</button>

              <div className="flex w-full justify-between">
                <p>{timer.task || 'some task'}</p>
                <p>{formatTime(timer.duration)}</p>
              </div>
              <div className="flex w-full justify-between">
                <p>[{timer.tags.join(',')}]</p>
                <p>{new Date(timer.completed_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

      </div>


    </div>
  )
}

export default App
