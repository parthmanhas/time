import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { TimerState } from '../types'
import { Button } from './ui/button'
import { Routines } from './routines'
import { motion } from 'framer-motion';


type RoutinesProps = {
    state: TimerState,
    setState: React.Dispatch<React.SetStateAction<TimerState>>,
    dbReady: boolean,
    addRoutine: (e: React.KeyboardEvent<HTMLInputElement>) => void
    addRoutineButtonClick: () => void
    clearRoutine: (routine: string) => void
}

export function RoutinesContainer({ state, dbReady, setState, addRoutine, addRoutineButtonClick, clearRoutine }: RoutinesProps) {

    if (!state.selectedRoutine) {
        setState(prev => ({ ...prev, selectedRoutine: state.routines[0] }))
    }
    return (
        <div className='h-[500px] w-full p-5 sm:p-0 max-w-sm'>
            <div className="flex justify-center gap-2">
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
                        <ul className="menu menu-horizontal shadow-md py-5 px-3 overflow-x-auto whitespace-nowrap flex-nowrap flex justify-start gap-3">
                            {state.routines.map(routine => (
                                <li
                                    key={routine}
                                    onTouchStart={() => {
                                        const timer = setTimeout(async () => {
                                            clearRoutine(routine)
                                        }, 500);

                                        const cleanup = () => clearTimeout(timer);
                                        window.addEventListener('touchend', cleanup, { once: true });
                                        window.addEventListener('touchcancel', cleanup, { once: true });
                                    }}
                                    className={cn(
                                        "border border-transparent rounded block hover:border-slate-700",
                                        // "hover:border border-slate-700 rounded",
                                        state.selectedRoutine === routine && "border-white hover:border-white",
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
                        <motion.div
                            key={state.selectedRoutine}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Routines name={state.selectedRoutine} dbReady={dbReady} />
                        </motion.div>
                        :
                        <p className="text-center pt-10">Select a routine to display</p>
                    }
                </> :
                <div className="flex justify-center pt-16">No routines yet</div>
            }
        </div>
    )
}
