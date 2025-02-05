import { AnimatePresence, motion } from "framer-motion";
import { TimerModel, TimerState } from "../types";
import { Timer } from "./timer";
import { RoutinesContainer } from "./routines-container";
import { cn } from "../utils";

type TimerRoutinesContainerProps = {
    id?: string;
    className?: string;
    state: TimerState;
    setState: React.Dispatch<React.SetStateAction<TimerState>>;
    getNewTimer: () => TimerModel;
    saveTimer: (timer: TimerModel) => Promise<void>;
    workerRef: React.MutableRefObject<Worker | null>;
    dbReady: boolean;
    addRoutine: (key: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
    addRoutineButtonClick: () => Promise<void>;
    clearRoutine: (routine: string) => Promise<void>;
    timerSelected: boolean;
    setTimerSelected: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TimerRoutinesContainer({ 
    id,
    className,
    state,
    setState,
    getNewTimer,
    saveTimer,
    workerRef,
    dbReady,
    addRoutine,
    addRoutineButtonClick,
    clearRoutine,
    timerSelected,
    setTimerSelected
 }: TimerRoutinesContainerProps) {

    return (
        <div id={id} className={cn(
            className && className,
        )}>
            <div className="flex gap-2 mb-5">
                <p className="text-lg">track time</p>
                <input type="checkbox" onChange={e => setTimerSelected(!e.currentTarget.checked)} className="toggle text-black bg-white" />
                <p className="text-lg">track routines</p>
            </div>
            <AnimatePresence mode="wait">
                {timerSelected ? (
                    <motion.div
                        key="timer"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Timer
                            state={state}
                            setState={setState}
                            getNewTimer={getNewTimer}
                            saveTimer={saveTimer}
                            workerRef={workerRef}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="routines"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <RoutinesContainer
                            state={state}
                            setState={setState}
                            dbReady={dbReady}
                            addRoutine={addRoutine}
                            addRoutineButtonClick={addRoutineButtonClick}
                            clearRoutine={clearRoutine}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
