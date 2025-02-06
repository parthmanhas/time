import { TimerModel, TimerState, TimerStatus } from "../types"
import { cn } from "../utils"
import { formatTime } from "../lib"
import { useState } from "react"
import { CheckCircle2, PauseCircle } from "lucide-react"

type CompletedTimersProps = {
    id?: string,
    className?: string,
    mobile?: boolean,
    state: TimerState,
    setState: React.Dispatch<React.SetStateAction<TimerState>>,
    workerRef: React.MutableRefObject<Worker | null>,
    removeTimer: (id: string) => void
}

export const CompletedAndPausedTimers = ({ id, className, mobile = false, state, setState, workerRef, removeTimer }: CompletedTimersProps) => {
    const [filterBy, setFilterBy] = useState<Omit<TimerStatus, 'ACTIVE' | 'PAUSED'>>('QUEUED');

    const filteredTimers = state.timers.filter(timer => timer.status === filterBy);


    const resumeTimer = (timer: TimerModel) => {
        setState(prev => ({ ...prev, currentTimer: { ...timer, status: 'ACTIVE' } }));
        workerRef.current?.postMessage({
            type: 'START_TIMER',
            payload: { id: state.currentTimer.id, remaining_time: state.currentTimer.remaining_time }
        });
    }
    return (
        <div id={id} className={cn(
            className && className,
            mobile && "h-screen sm:hidden flex flex-col items-center",
            !mobile && "hidden sm:h-full w-full sm:flex sm:flex-col justify-start opacity-20 hover:opacity-100",
            !mobile && state.currentTimer.status === 'ACTIVE' && "border-white/10 text-white/30"
        )}>
            <div className="flex justify-center gap-2 p-2">
                <button
                    onClick={() => setFilterBy('QUEUED')}
                    className={cn(
                        "btn btn-sm btn-ghost gap-2",
                        filterBy === 'QUEUED' && "btn-active"
                    )}
                >
                    <PauseCircle size={18} />
                </button>
                <button
                    onClick={() => setFilterBy('COMPLETED')}
                    className={cn(
                        "btn btn-sm btn-ghost gap-2",
                        filterBy === 'COMPLETED' && "btn-active"
                    )}
                >
                    <CheckCircle2 size={18} />
                </button>
            </div>
            {filteredTimers.length === 0
                ?
                <div className="w-full h-[50vh] flex items-center justify-center">
                    <p className="text-center">no {filterBy.toLowerCase()} yet</p>
                </div> :
                <div className="w-full justify-center h-[85vh] sm:h-[70vh] overflow-scroll py-2 md:py-5">
                    {filteredTimers.map(timer => (
                        <div key={timer.id}
                            onClick={() => timer.status === 'QUEUED' && resumeTimer(timer)}
                            className={cn(
                                timer.status === 'QUEUED' && "border-l-amber-500 cursor-pointer",
                                timer.status === 'COMPLETED' && "border-l-green-500",
                                "relative border-l-2 border-b-white/20 border-b-[1px] mb-1 p-2 group text-sm md:text-base"
                            )}>
                            <button onClick={(e) => { e.stopPropagation(); removeTimer(timer.id) }} className="cursor-pointer sm:hidden group-hover:block badge badge-xs absolute -top-2 -right-0 bg-red-500 text-white">x</button>

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
                </div>}

        </div>
    )
}