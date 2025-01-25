import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';

type TimerStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

type Timer = {
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
  // without id because id getting cached
  const getNewTimer = () => {
    return {
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
    currentTimer: { ...getNewTimer(), id: uuidv4() },
    timers: JSON.parse(localStorage.getItem('timers') || '[]')
  });

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60) + '';
    const seconds = time % 60 + '';
    return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
  }

  const workerRef = useRef<Worker | null>(null);

  const toggleTimer = () => {
    setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, status: prev.currentTimer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } }));
    workerRef.current?.postMessage({
      type: state.currentTimer.status === 'ACTIVE' ? 'STOP_TIMER' : 'START_TIMER',
      payload: { id: state.currentTimer.id, remaining_time: state.currentTimer.remaining_time },
    });
  }

  const saveTimer = (completedTimer: Timer) => {
    // assign an id during save
    setState(prev => ({ ...prev, timers: [...prev.timers, { ...completedTimer, id: uuidv4(), status: 'COMPLETED', completed_at: new Date().toISOString() }] }))
  }

  const addTag = (key) => {
    if (key.code === 'Enter' && state.currentTimer.tags.indexOf(state.currentTimer.newTag) === -1) {
      setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: [...prev.currentTimer.tags, prev.currentTimer.newTag], newTag: '' } }));
    } else {
      console.error('tag already exists')
    }
  }

  const addTask = (key) => {
    if (key.code === 'Enter') {
      setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, task: prev.currentTimer.newTask, newTask: '' } }));
    }
  }

  const removeTag = (name: string) => {
    setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: prev.currentTimer.tags.filter(t => t !== name) } }))
  }

  const removeTimer = (timerId: string) => {
    setState(prev => ({ ...prev, timers: prev.timers.filter(timer => timer.id !== timerId) }))
  }

  useEffect(() => {
    localStorage.setItem('timers', JSON.stringify(state.timers));
  }, [state.timers])

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

  const selectTime = (duration: number) => {
    setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, duration, remaining_time: duration, status: 'PAUSED' } }))
  }

  return (
    <div className="w-screen h-screen grid grid-cols-3 bg-black text-white">
      <div className="w-full h-full p-10 flex flex-col gap-4 justify-center">
        {state.timers.map(timer => (
          <div key={timer.id} className="relative border-white/20 border-b-[1px] p-2 group">
            <button
              className="cursor-pointer sm:hidden absolute sm:group-hover:block block -top-1 -right-2 bg-red-500 text-white rounded-full text-xs px-1 hover:bg-red-600"
              onClick={() => removeTimer(timer.id)}>
              x
            </button>
            <div className="flex w-full justify-between">
              <p>{timer.task || 'task'}</p>
              <p>{formatTime(timer.duration)}</p>
            </div>
            <div className="flex w-full justify-between">
              <p>{timer.status.toLowerCase()}</p>
              <p>{new Date(timer.completed_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <button onClick={() => selectTime(1)} className="p-2 text-3xl bg-white/50 hover:bg-white/30 cursor-pointer rounded-full">+10</button>
            <button onClick={() => selectTime(1200)} className="p-2 text-3xl bg-white/50 hover:bg-white/30 cursor-pointer rounded-full">+20</button>
            <button onClick={() => selectTime(1800)} className="p-2 text-3xl bg-white/50 hover:bg-white/30 cursor-pointer rounded-full">+30</button>
            <button onClick={() => selectTime(2400)} className="p-2 text-3xl bg-white/50 hover:bg-white/30 cursor-pointer rounded-full">+40</button>
          </div>
          <h1 className="text-9xl">{formatTime(state.currentTimer.remaining_time || 0)}</h1>
          <p className="text-center">{state.currentTimer.task}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {state.currentTimer.tags.map((tag, index) =>
              <span key={index} className="relative cursor-pointer group px-2 py-1 bg-white/20 rounded-sm">
                {tag}
                <button
                  className="cursor-pointer absolute block sm:hidden sm:group-hover:block -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1 hover:bg-red-600"
                  onClick={() => removeTag(tag)}>
                  x
                </button>
              </span>
            )}
          </div>
          <input value={state.currentTimer.newTask} onChange={e => setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, newTask: e.target.value } }))} onKeyDown={addTask} className="p-2 w-full" placeholder="add task, press enter to add" />
          <input value={state.currentTimer.newTag} onChange={e => setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, newTag: e.target.value } }))} onKeyDown={addTag} className="p-2 w-full" placeholder="add tag, press enter to add" />
          <button onClick={toggleTimer} className={`w-full p-4 text-4xl bg-white/50 cursor-pointer hover:bg-white/30 rounded`}>
            {state?.currentTimer?.status === 'ACTIVE' ? 'pause' : 'start'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
