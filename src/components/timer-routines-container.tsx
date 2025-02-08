import { AnimatePresence, motion } from "framer-motion";
import { AppState, TimerModel } from "../types";
import { Timer } from "./timer";
import { RoutinesContainer } from "./routines-container";
import { cn } from "../utils";

type TimerRoutinesContainerProps = {
    id?: string;
    className?: string;
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    getNewTimer: () => TimerModel;
    workerRef: React.MutableRefObject<Worker | null>;
    addRoutine: (key: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
    addRoutineButtonClick: () => Promise<void>;
    timerSelected: boolean;
    mobile?: boolean;
    setTimerSelected: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TimerRoutinesContainer({
    id,
    className,
    state,
    setState,
    getNewTimer,
    workerRef,
    addRoutineButtonClick,
    timerSelected,
    setTimerSelected,
}: TimerRoutinesContainerProps) {

    return (
        <div id={id} className={cn(
            className && className,
            "relative"
        )}>
            <div className={cn(
                "flex gap-2 bg-black absolute top-0",
                state.currentTimer.status === 'RUNNING' && "disabled"
            )}>
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
                        className="flex items-center justify-center w-full"
                    >
                        <Timer
                            state={state}
                            setState={setState}
                            getNewTimer={getNewTimer}
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
                        className="flex items-center justify-center w-full px-5"
                    >
                        <RoutinesContainer
                            state={state}
                            setState={setState}
                            addRoutineButtonClick={addRoutineButtonClick}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
