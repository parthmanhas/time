import dayjs from "dayjs"
import { TimerState } from "../types"
import { cn } from "../utils"
import { formatTime } from "../lib"

type CompletedTimersProps = {
    className?: string,
    mobile?: boolean,
    state: TimerState,
    removeTimer: (id: string) => void
}

export const CompletedTimers = ({ className, mobile = false, state, removeTimer }: CompletedTimersProps) => {
    return (
        <div className={cn(
            className && className,
            mobile && "h-screen sm:hidden flex items-center justify-center p-5 border-b",
            !mobile && "hidden sm:h-full w-full p-10 sm:flex items-center justify-center opacity-20 hover:opacity-100",
            !mobile && state.currentTimer.status === 'ACTIVE' && "border-white/10 text-white/30"
        )}>
            {state.timers.length === 0
                ?
                <p className="text-center">No timers completed yet</p>
                :
                <div className="w-full justify-center max-h-[500px] overflow-scroll py-2 md:py-5">
                    {state.timers.filter(timer => dayjs(timer.completed_at).isSame(new Date(), 'day')).map(timer => (
                        <div key={timer.id} 
                        className={cn(
                            timer.status === 'PAUSED' && "border-l-amber-500",
                            timer.status === 'COMPLETED' && "border-l-green-500",
                            "relative border-l-2 border-b-white/20 border-b-[1px] mb-1 p-2 group noto-sans-mono-400 text-sm md:text-base"
                        )}>
                            <button onClick={() => removeTimer(timer.id)} className="cursor-pointer sm:hidden group-hover:block badge badge-xs absolute -top-2 -right-0 bg-red-500 text-white">x</button>

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