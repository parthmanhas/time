import dayjs from "dayjs";
import { cn } from "../utils";
import { useState } from "react";
import { Edit, Sparkles } from "lucide-react";
import confetti from 'canvas-confetti';
import { AppState, RoutineWithCompletions } from "../types";
import { commitRoutine, createUpdateTimer, deleteOneRoutineCompletion as deleteOneRoutineCompletions, deleteTimer, updateRoutineInDB } from "../db";
import { useAuth } from "../contexts/AuthContext";
import { getNewTimer } from "../App";

const generateCurrentYearDates = () => {
    const startOfYear = dayjs().startOf('year');
    const endOfYear = dayjs().endOf('year');

    const dates = [];
    let currentDate = startOfYear;

    while (currentDate.isBefore(endOfYear) || currentDate.isSame(endOfYear)) {
        dates.push(currentDate.format('YYYY-MM-DD')); // Customize the format if needed
        currentDate = currentDate.add(1, 'day');
    }

    return dates;
}
export const Routines = ({ routine, state, setState }: { routine: RoutineWithCompletions, state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>> }) => {
    const { name } = routine;
    const dates = generateCurrentYearDates();
    const [completions, setCompletions] = useState<Record<string, number>>(groupCompletionsByDate(routine.completions.map(date => dayjs(date).format('YYYY-MM-DD'))));
    const [duration, setDuration] = useState(routine.duration);
    const [editing, setEditing] = useState(false);

    const { user } = useAuth();

    const _commitRoutine = async (date: string) => {
        if (dayjs(date).isSame(new Date, 'day') || (editing && dayjs(date).isBefore(new Date()))) {
            setCompletions(prev => {
                const formattedDate = dayjs(date).format('YYYY-MM-DD');
                return {
                    ...prev,
                    [formattedDate]: (prev[formattedDate] || 0) + 1
                };
            })
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22C55E', '#16A34A', '#15803D', '#166534', '#14532D', '#124D28', '#0F3F1F', '#0D3A1B', '#0B2F15', '#092610', '#071F0B', '#051A07', '#031404']
            });
            if (!user) return;
            const randomDate = new Date(date); //same date with different time
            randomDate.setHours(Math.floor(Math.random() * 24));
            randomDate.setMinutes(Math.floor(Math.random() * 60));
            randomDate.setSeconds(Math.floor(Math.random() * 60));
            commitRoutine(name, randomDate, user.uid);
            // duration is being passed from parent
            if (duration === 0) return;
            const timer = { ...getNewTimer(), duration, completed_at: new Date().toISOString(), status: "COMPLETED" as const, task: name, tags: [name] };
            createUpdateTimer(timer, user.uid);
            setState(prev => ({ ...prev, timers: [...prev.timers, timer] }));
        };
    }

    const updateRoutine = async (name: string, updates: Partial<RoutineWithCompletions>) => {
        setState(prev => ({
            ...prev,
            routines: prev.routines.map(r =>
                r.name === name ? { ...r, ...updates } : r
            )
        }));
        if (!user) return;
        await updateRoutineInDB(name, updates, user.uid);
    };

    type CarouselItem = {
        id: string;
        startMonth: number;
        dates: string[];
        editing: boolean;
        commitRoutine: (date: string) => void;
        completedDates: Record<string, number>;
        setEditing: React.Dispatch<React.SetStateAction<boolean>>;
    }

    const CarouselItem = ({ id, startMonth, dates, editing, commitRoutine, completedDates, setEditing }: CarouselItem) => (
        <div id={id} className="carousel-item flex flex-wrap gap-2 h-full w-full mx-5">
            {Array.from({ length: 3 }, (_, i) => i + startMonth).map((month) => (
                <div key={month} className="flex flex-col gap-2">
                    <div className="text-center">
                        {dayjs(`2025-${month}-01`).format('MMMM').toLowerCase()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {dates.map((date) => {
                            if (dayjs(date).month() + 1 !== month) return null;
                            return (
                                <div key={date} className="relative">
                                    <div
                                        onClick={() => commitRoutine(date)}
                                        onTouchStart={() => {
                                            const timer = setTimeout(async () => {
                                                if (completions[dayjs(date).format('YYYY-MM-DD')]) {
                                                    setCompletions(prev => {
                                                        const formattedDate = dayjs(date).format('YYYY-MM-DD');
                                                        const { [formattedDate]: _, ...rest } = prev;
                                                        return rest;
                                                    })
                                                    if (!user) return;
                                                    deleteOneRoutineCompletions(name, new Date(date), user.uid);
                                                    const timersToDelete = state.timers.filter(timer => timer.task === name && dayjs(timer.completed_at).isSame(new Date(date), 'day'));
                                                    timersToDelete.forEach(timer => deleteTimer(timer.id, user.uid));
                                                    setState(prev => ({ ...prev, timers: prev.timers.filter(timer => !timersToDelete.includes(timer)) }));
                                                }
                                            }, 500);
                                            const cleanup = () => clearTimeout(timer);
                                            window.addEventListener('touchend', cleanup, { once: true });
                                            window.addEventListener('touchcancel', cleanup, { once: true });
                                        }}
                                        onMouseDown={() => {
                                            const timer = setTimeout(async () => {
                                                if (completions[dayjs(date).format('YYYY-MM-DD')]) {
                                                    setCompletions(prev => {
                                                        const formattedDate = dayjs(date).format('YYYY-MM-DD');
                                                        const { [formattedDate]: _, ...rest } = prev;
                                                        return rest;
                                                    })
                                                    if (!user) return;
                                                    deleteOneRoutineCompletions(name, new Date(date), user.uid);
                                                    const timersToDelete = state.timers.filter(timer => timer.task === name && dayjs(timer.completed_at).isSame(new Date(date), 'day'));
                                                    timersToDelete.forEach(timer => deleteTimer(timer.id, user.uid));
                                                    setState(prev => ({ ...prev, timers: prev.timers.filter(timer => !timersToDelete.includes(timer)) }));
                                                }
                                            }, 500);

                                            const cleanup = () => clearTimeout(timer);
                                            window.addEventListener('mouseup', cleanup, { once: true });
                                        }}
                                        className={cn(
                                            "w-5 h-5 rounded cursor-pointer flex items-center justify-center text-xs",
                                            !completedDates[date] && "bg-white",
                                            completedDates[date] === 1 && "bg-green-500 !animate-none !border-none",
                                            completedDates[date] === 2 && "bg-green-600 !animate-none !border-none",
                                            completedDates[date] === 3 && "bg-green-700 !animate-none !border-none",
                                            completedDates[date] === 4 && "bg-green-800 !animate-none !border-none",
                                            completedDates[date] === 5 && "bg-green-900 !animate-none !border-none",
                                            completedDates[date] > 5 && "bg-red-500 !animate-none !border-none",
                                            dayjs(date).isBefore(new Date(), 'day') && editing && "border-2 animate-bounce border-yellow-500",
                                            dayjs(date).isSame(new Date(), 'day') && !completedDates[date] && "bg-yellow-500",
                                        )}
                                    >
                                        {completedDates[date]}
                                    </div>
                                    {completedDates[date] > 5 && (
                                        <span className="absolute -top-1 -right-1 text-yellow-400 text-xs"><Sparkles size={12} fill="yellow" /></span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
            <div
                className="flex justify-between items-center w-full">
                <select
                    value={duration?.toString() || 'default'}
                    onChange={(e) => {
                        const duration = parseInt(e.target.value);
                        setDuration(duration);
                        if (!isNaN(duration)) {
                            updateRoutine(routine.name, { duration });
                        }
                    }}
                    className="cursor-pointer select select-bordered max-w-xs bg-black"
                >
                    <option disabled value="default">default duration</option>
                    <option value="0">No time</option>
                    <option value="60">1 minute</option>
                    <option value="120">2 minutes</option>
                    <option value="300">5 minutes</option>
                    <option value="600">10 minutes</option>
                    <option value="900">15 minutes</option>
                    <option value="1800">30 minutes</option>
                </select>
                <Edit
                    size={20}
                    onClick={() => setEditing(!editing)}
                    className={cn(
                        editing && "text-amber-300",
                        "cursor-pointer hover:text-amber-300"
                    )} />
            </div>
        </div>
    );

    return (
        <>
            <div className="carousel w-full">
                {[1, 4, 7, 10].map((startMonth, index) => (
                    <CarouselItem
                        key={startMonth}
                        id={`quarter-${index + 1}`}
                        startMonth={startMonth}
                        dates={dates}
                        editing={editing}
                        commitRoutine={_commitRoutine}
                        completedDates={completions}
                        setEditing={setEditing}
                    />
                ))}
            </div>
            <div className="flex w-full justify-center gap-2 py-2">
                <a href="#quarter-1" className="btn btn-xs">1</a>
                <a href="#quarter-2" className="btn btn-xs">2</a>
                <a href="#quarter-3" className="btn btn-xs">3</a>
                <a href="#quarter-4" className="btn btn-xs">4</a>
            </div>
        </>
    )
}

function groupCompletionsByDate(updatedCompletions: string[]) {
    if (updatedCompletions.length === 0) {
        console.error('No completions found');
    }
    return updatedCompletions.reduce((acc, date) => {
        const key = dayjs(date).format('YYYY-MM-DD');
        acc[key] = acc[key] ? acc[key] + 1 : 1;
        return acc;
    }, {} as Record<string, number>);
}
