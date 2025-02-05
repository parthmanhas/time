import { Plus } from "lucide-react"
import { TimerModel, TimerState, TimerStatus } from "../types"
import { cn } from "../utils"
import { Button } from "./ui/button"

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

    const addTime = (seconds: number) => {
        setState(prev => ({
            ...prev,
            currentTimer: {
                ...prev.currentTimer,
                duration: prev.currentTimer.duration + seconds,
                remaining_time: prev.currentTimer.duration + seconds,
                status: 'PAUSED'
            }
        }))
    }

    const addTag = (key: React.KeyboardEvent<HTMLInputElement>) => {
        if (key.code === 'Enter' && state.currentTimer.tags.indexOf(state.currentTimer.newTag) === -1) {
            setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: [...prev.currentTimer.tags, prev.currentTimer.newTag], newTag: '' } }));
        } else {
            console.error('tag already exists')
        }
    }

    const addTagButtonClick = () => {
        if (state.currentTimer.tags.indexOf(state.currentTimer.newTag) === -1 && state.currentTimer.newTag !== '') {
            setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, tags: [...prev.currentTimer.tags, prev.currentTimer.newTag], newTag: '' } }));
        } else {
            console.error('tag already exists or empty')
        }
    }

    const addTaskButtonClick = () => {
        setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, task: prev.currentTimer.newTask, newTask: '' } }));
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

    const pauseTimer = () => {
        setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, status: 'PAUSED' as TimerStatus } }));
        workerRef.current?.postMessage({
            type: 'STOP_TIMER',
            payload: { id: state.currentTimer.id, remaining_time: state.currentTimer.remaining_time },
        });
    }

    const resetCurrentTimer = () => {
        setState(prev => ({ ...prev, currentTimer: getNewTimer() }))
    }

    const completeTimer = () => {
        saveTimer({ ...state.currentTimer, status: 'COMPLETED' });
        resetCurrentTimer();
        workerRef.current?.postMessage({
            type: "STOP_TIMER"
        });
    }

    const queueTimer = () => {
        if (state.currentTimer.newTask === '' && state.currentTimer.task === '') {
            console.error('cannot queue an empty task');
            return;
        }

        saveTimer({ ...state.currentTimer, status: 'QUEUED' });
        resetCurrentTimer();
    }

    const resumeTimer = () => {
        setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, status: 'ACTIVE' } }));
        workerRef.current?.postMessage({
            type: 'START_TIMER',
            payload: { id: state.currentTimer.id, remaining_time: state.currentTimer.remaining_time }
        });
    }

    return <div className={cn(
        className && className,
        "flex items-center justify-center w-full",
        mobile && "h-screen flex items-center justify-center sm:hidden border-b",
    )}>
        <div className="flex flex-col gap-2 md:gap-3 w-full max-w-sm px-4 md:px-0">
            {/* add time */}
            <div className="flex w-full justify-between gap-2 md:gap-3">
                <button disabled={state.currentTimer.status === 'ACTIVE' || state.currentTimer.duration + 600 >= 6000} onClick={() => addTime(600)} className="btn btn-outline text-lg md:text-2xl">+10</button>
                <button disabled={state.currentTimer.status === 'ACTIVE' || state.currentTimer.duration + 1200 >= 6000} onClick={() => addTime(1200)} className="btn btn-outline text-lg md:text-2xl">+20</button>
                <button disabled={state.currentTimer.status === 'ACTIVE' || state.currentTimer.duration + 1800 >= 6000} onClick={() => addTime(1800)} className="btn btn-outline text-lg md:text-2xl">+30</button>
                <button disabled={state.currentTimer.status === 'ACTIVE' || state.currentTimer.duration + 3600 >= 6000} onClick={() => addTime(3600)} className="btn btn-outline text-lg md:text-2xl">+60</button>
            </div>
            <h1 className="text-[7rem] sm:text-[8rem] countdown noto-sans-mono-400 justify-center">
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
            <div className="flex gap-2">
                <input
                    disabled={state.currentTimer.status === 'ACTIVE'}
                    type="text"
                    className={cn(
                        "p-2 w-full rounded border",
                        state.currentTimer.status === 'ACTIVE' && "hidden"
                    )}
                    value={state.currentTimer.newTask}
                    onChange={e => setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, newTask: e.target.value, task: e.target.value } }))}
                    onKeyDown={addTask}
                    placeholder="add task title" />
                <Button size="icon" className={cn(
                    "cursor-pointer",
                    state.currentTimer.status === 'ACTIVE' && "hidden"
                )} onClick={() => addTaskButtonClick()}><Plus /></Button>
            </div>
            <div className="flex gap-2">
                <input
                    disabled={state.currentTimer.status === 'ACTIVE'}
                    list="existing-tags"
                    type="text"
                    className={cn(
                        "p-2 w-full rounded border",
                        state.currentTimer.status === 'ACTIVE' && "hidden"
                    )}
                    value={state.currentTimer.newTag}
                    onChange={e => setState(prev => ({ ...prev, currentTimer: { ...prev.currentTimer, newTag: e.target.value } }))}
                    onKeyDown={addTag}
                    placeholder="add tag(s), press enter to add" />
                <Button size="icon" className={cn(
                    "cursor-pointer",
                    state.currentTimer.status === 'ACTIVE' && "hidden"
                )} onClick={() => addTagButtonClick()}><Plus /></Button>
                <datalist id="existing-tags">
                    {Array.from(new Set(state.timers.map(timer => [...timer.tags]).flat())).map(tag => (
                        <option value={tag}>{tag}</option>
                    ))}
                </datalist>
            </div>
            <button onClick={toggleTimer} className="btn btn-outline">{state?.currentTimer?.status === 'ACTIVE' ? 'pause' : 'start'}</button>
            <button onClick={() => { pauseTimer(); resetCurrentTimer(); }} className="btn btn-outline">reset</button>
            {state.currentTimer.status === 'PAUSED' && <button onClick={queueTimer} className="btn btn-outline">do later</button>}
            {state.currentTimer.status === 'PAUSED' && state.currentTimer.remaining_time !== state.currentTimer.duration && <button onClick={resumeTimer} className="btn btn-outline">resume</button>}
            {state.currentTimer.status === 'ACTIVE' && <button onClick={completeTimer} className="btn btn-outline">complete</button>}
        </div>
    </div>
}
