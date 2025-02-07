import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import { AppState } from '../types'
import { Button } from './ui/button'
import { Routines } from './routines'
import { motion } from 'framer-motion';
import { createRoutine, deleteRoutine } from '../db'
import { useAuth } from '../contexts/AuthContext'


type RoutinesProps = {
    state: AppState,
    setState: React.Dispatch<React.SetStateAction<AppState>>,
    addRoutineButtonClick: () => void
}

export function RoutinesContainer({ state, setState }: RoutinesProps) {

    const { user } = useAuth();

    const _createRoutine = () => {
        const newRoutine = { name: state.newRoutine, completions: [] };
        setState(prev => ({ ...prev, routines: [...prev.routines, newRoutine], newRoutine: '', selectedRoutine: prev.selectedRoutine === '' ? newRoutine.name : prev.selectedRoutine }));
        if (!user) return;
        createRoutine(state.newRoutine, user.uid);
    }

    return (
        <div className='h-[500px] w-full max-w-sm'>
            <div className="flex justify-center gap-2 w-full">
                <input
                    value={state.newRoutine}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            _createRoutine();
                        }
                    }}
                    onChange={e => setState(prev => ({ ...prev, newRoutine: e.target.value }))}
                    type="text"
                    className="p-2 rounded border w-full"
                    placeholder="add routine name"
                />
                <Button size="icon" className="cursor-pointer" onClick={_createRoutine}><Plus /></Button>
            </div>
            {state.routines.length > 0 ?
                <>
                    <div className="flex justify-center mb-5">
                        <ul className="menu menu-horizontal shadow-md py-5 px-3 overflow-x-auto whitespace-nowrap flex-nowrap flex justify-start gap-3">
                            {state.routines.map(routine => (
                                <li
                                    key={routine.name}
                                    onTouchStart={() => {
                                        const timer = setTimeout(async () => {
                                            if (!user) return;
                                            deleteRoutine(routine.name, user.uid)
                                        }, 500);

                                        const cleanup = () => clearTimeout(timer);
                                        window.addEventListener('touchend', cleanup, { once: true });
                                        window.addEventListener('touchcancel', cleanup, { once: true });
                                    }}
                                    className={cn(
                                        "border border-transparent rounded block hover:border-slate-700",
                                        // "hover:border border-slate-700 rounded",
                                        state.selectedRoutine === routine.name && "border-white hover:border-white",
                                    )}
                                    onClick={() => setState(prev => ({ ...prev, selectedRoutine: routine.name }))}>
                                    <a className="group relative">
                                        {routine.name}
                                        <span onClick={() => {
                                            setState(prev => ({ ...prev, selectedRoutine: '', routines: prev.routines.filter(r => r.name !== routine.name) }));
                                            if (!user) return;
                                            deleteRoutine(routine.name, user.uid);
                                        }} className="hidden group-hover:block badge badge-xs absolute -top-2 -right-3  bg-red-500 text-white">x</span>
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
                            <Routines name={state.selectedRoutine} state={state} />
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
