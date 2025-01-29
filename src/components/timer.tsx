import { TimerModel, TimerState } from "../types"
import { cn } from "../utils"

const formatMinutes = (time: number) => {
    return `${Math.floor(time / 60).toString().padStart(2, '0')}`
}

const formatSeconds = (time: number) => {
    return `${Math.floor(time % 60).toString().padStart(2, '0')}`
}

type TimerProps = {
    className?: string,
    mobile?: boolean
    state: TimerState,
    setState: React.Dispatch<React.SetStateAction<TimerState>>,
    saveTimer: (timer: TimerModel) => void,
    getNewTimer: () => TimerModel,
    workerRef: React.MutableRefObject<Worker | null>
}

export const Timer = ({ className, mobile = false, state, setState, saveTimer, getNewTimer, workerRef }: TimerProps) => {

    const selectTime = (duration: number) => {
        setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, duration, remaining_time: duration, status: 'PAUSED' } }))
    }

    const addTag = (key: React.KeyboardEvent<HTMLInputElement>) => {
        if (key.code === 'Enter' && state.currentTimer.tags.indexOf(state.currentTimer.newTag) === -1) {
            setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: [...prev.currentTimer.tags, prev.currentTimer.newTag], newTag: '' } }));
        } else {
            console.error('tag already exists')
        }
    }

    const removeTag = (name: string) => {
        setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: prev.currentTimer.tags.filter(t => t !== name) } }))
    }

    const addTask = (key: React.KeyboardEvent<HTMLInputElement>) => {
        if (key.code === 'Enter') {
            setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, task: prev.currentTimer.newTask, newTask: '' } }));
        }
    }

    const toggleTimer = () => {
        setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, status: prev.currentTimer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } }));
        workerRef.current?.postMessage({
            type: state.currentTimer.status === 'ACTIVE' ? 'STOP_TIMER' : 'START_TIMER',
            payload: { id: state.currentTimer.id, remaining_time: state.currentTimer.remaining_time },
        });
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

    return <div className={cn(
        className && className,
        mobile && "h-screen flex items-center justify-center sm:hidden border-b",
        !mobile && "hidden sm:flex items-center justify-center w-full",
    )}>
        <div className="flex flex-col gap-2 md:gap-3 w-full max-w-sm px-4 md:px-0">
            {/* add time */}
            <div className="flex w-full justify-between gap-2 md:gap-3">
                <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(1)} className="btn btn-outline text-lg md:text-2xl">+10</button>
                <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(1200)} className="btn btn-outline text-lg md:text-2xl">+20</button>
                <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(1800)} className="btn btn-outline text-lg md:text-2xl">+30</button>
                <button disabled={state.currentTimer.status === 'ACTIVE'} onClick={() => selectTime(3600)} className="btn btn-outline text-lg md:text-2xl">+60</button>
            </div>
            <h1 className="text-8xl countdown font-mono justify-center">
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
                        <span onClick={() => removeTag(tag)} className="sm:hidden group-hover:block badge badge-xs absolute -top-2 -right-3 bg-red-500 text-white">x</span>
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
}
