import Last30DaysChart from "../Last30DaysChart"
import { TimerState } from "../types"
import { cn } from "../utils"
import { Routines } from "./routines"

type ChartsRoutinesProps = {
    className?: string,
    mobile?: boolean,
    state: TimerState,
    setState: React.Dispatch<React.SetStateAction<TimerState>>,
    dbReady: boolean,
    addRoutine: (e: React.KeyboardEvent<HTMLInputElement>) => void
    clearRoutine: (routine: string) => void
}

export const ChartsRoutines = ({ className, mobile = false, state, dbReady, setState, addRoutine, clearRoutine }: ChartsRoutinesProps) => {
    return (
        <div role="tablist" className={
            cn(
                className && className,
                mobile && "h-screen sm:hidden border-b",
                !mobile && "hidden sm:h-full sm:flex items-center justify-center tabs tabs-border opacity-20 hover:opacity-100",
            )
        }>
            <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="30 Days" defaultChecked />
            <div className="tab-content h-full md:!h-3/4 bg-black">
                {state.timers.length === 0
                    ?
                    <div className="flex justify-center pt-4 md:pt-16">No data. Start a timer !</div>
                    :
                    <Last30DaysChart timers={state.timers} />
                }
            </div>

            <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="30 Days Tags" />
            <div className="tab-content h-full md:!h-3/4 bg-black">
                {state.timers.length === 0
                    ?
                    <div className="flex justify-center pt-4 md:pt-16">No data. Start a timer !</div>
                    :
                    <Last30DaysChart showTags={true} timers={state.timers} />
                }
            </div>

            <input type="radio" name="my_tabs_2" role="tab" className="tab" aria-label="Routines" />
            <div className="tab-content h-full md:!h-3/4 bg-black overflow-y-auto">
                {state.routines.length === 0 && <div className="flex justify-center m-5">
                    <input
                        value={state.newRoutine}
                        onKeyDown={addRoutine}
                        onChange={e => setState(prev => ({ ...prev, newRoutine: e.target.value }))}
                        type="text"
                        className="p-2 rounded"
                        placeholder="add a routine, press enter to add"
                    />
                </div>}
                {state.routines.length > 0 ?
                    <>
                        <div className="flex justify-center mb-5">
                            <ul className="menu menu-horizontal shadow-md max-w-3/4 overflow-x-auto whitespace-nowrap flex-nowrap flex gap-3">
                                {state.routines.map(routine => (
                                    <li
                                        key={routine}
                                        className={cn(
                                            state.selectedRoutine === routine && "border rounded block",
                                        )}
                                        onClick={() => setState(prev => ({ ...prev, selectedRoutine: routine }))}>
                                        <a className="group relative">
                                            {routine}
                                            <span onClick={() => clearRoutine(routine)} className="hidden group-hover:block badge badge-xs absolute -top-2 -right-3  bg-red-500 text-white">x</span>

                                        </a>
                                    </li>
                                ))}
                                <li>
                                    <input
                                        value={state.newRoutine}
                                        onKeyDown={addRoutine}
                                        onChange={e => setState(prev => ({ ...prev, newRoutine: e.target.value }))}
                                        type="text"
                                        className="rounded"
                                        placeholder="add a routine, press enter to add"
                                    />
                                </li>
                            </ul>
                        </div>
                        {state.selectedRoutine
                            ?
                            <Routines name={state.selectedRoutine} dbReady={dbReady} />
                            :
                            <p className="text-center pt-10">Select a routine</p>
                        }
                    </> :
                    <div className="flex justify-center pt-16">No routines yet</div>
                }
            </div>
        </div>
    )
}