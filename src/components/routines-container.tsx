import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { TimerState } from '../types'
import { Button } from './ui/button'
import { Routines } from './routines'

type RoutinesProps = {
    state: TimerState,
    setState: React.Dispatch<React.SetStateAction<TimerState>>,
    dbReady: boolean,
    addRoutine: (e: React.KeyboardEvent<HTMLInputElement>) => void
    addRoutineButtonClick: () => void
    clearRoutine: (routine: string) => void
}

export function RoutinesContainer({ state, dbReady, setState, addRoutine, addRoutineButtonClick, clearRoutine }: RoutinesProps) {

    return (
        <div className='h-[500px]'>
            <div className="flex justify-center gap-2 mt-5">
                <input
                    value={state.newRoutine}
                    onKeyDown={addRoutine}
                    onChange={e => setState(prev => ({ ...prev, newRoutine: e.target.value }))}
                    type="text"
                    className="p-2 rounded border w-full"
                    placeholder="add routine name"
                />
                <Button size="icon" className="cursor-pointer" onClick={() => addRoutineButtonClick()}><Plus /></Button>
            </div>
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
                        </ul>
                    </div>
                    {state.selectedRoutine
                        ?
                        <Routines name={state.selectedRoutine} dbReady={dbReady} />
                        :
                        <p className="text-center pt-10">Select a routine to display</p>
                    }
                </> :
                <div className="flex justify-center pt-16">No routines yet</div>
            }
        </div>
    )
}
