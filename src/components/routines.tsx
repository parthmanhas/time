// generate dates for a year

import dayjs from "dayjs";
import { cn } from "../utils";
import { useEffect, useState } from "react";
import { getRoutineCompletions, commitRoutineCompletion } from "../db";
import { Edit } from "lucide-react";
import confetti from 'canvas-confetti';

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
export const Routines = ({ name, dbReady }: { name: string, dbReady: boolean }) => {

    const dates = generateCurrentYearDates();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [completedDates, setCompletedDates] = useState<Record<string, number>>({});
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!dbReady) return;
        (async () => {
            setSelectedDate(null);
            setCompletedDates([]);
            try {
                const completedDates = await getRoutineCompletions(name) as string[];
                setCompletedDates(groupCompletionsByDate(completedDates));
            } catch (err) {
                console.error(err);
            }
        })()
    }, [name, dbReady])

    const commitRoutine = async (date: string) => {
        if (dayjs(date).isSame(new Date, 'day') || (editing && dayjs(date).isBefore(new Date()))) {
            const updatedCompletions = await commitRoutineCompletion(name, new Date(date)) as string[];
            // group updated completions by date
            const updatedCompletionsGrouped = groupCompletionsByDate(updatedCompletions);
            // const wasComplete = completedDates.includes(date);
            setCompletedDates(updatedCompletionsGrouped);

            // Show confetti only when marking as complete
            // if (!wasComplete && updatedCompletions.includes(date)) {
            //     confetti({
            //         particleCount: 100,
            //         spread: 70,
            //         origin: { y: 0.6 },
            //         colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B']
            //     });
            // }
        };
    }

    type CarouselItem = {
        id: string;
        startMonth: number;
        dates: string[];
        editing: boolean;
        commitRoutine: (date: string) => void;
        completedDates: Record<string, number>;
        selectedDate: string | null;
        setEditing: React.Dispatch<React.SetStateAction<boolean>>;
    }

    const CarouselItem = ({ id, startMonth, dates, editing, commitRoutine, completedDates, selectedDate, setEditing }: CarouselItem) => (
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
                                <div key={date}
                                    onClick={() => commitRoutine(date)}
                                    className={cn(
                                        "w-5 h-5 bg-white rounded cursor-pointer",
                                        completedDates[date] && "bg-green-500 !animate-none !border-none",
                                        dayjs(date).isBefore(new Date(), 'day') && editing && "border-2 animate-bounce border-yellow-500",
                                        dayjs(date).isSame(new Date(), 'day') && !completedDates[date] && "bg-yellow-500",
                                        dayjs(selectedDate).isSame(new Date(), 'day') && dayjs(selectedDate).isSame(date, 'day') && "!bg-green-500"
                                    )}>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
            <div
                onClick={() => setEditing(!editing)}
                className="flex justify-end w-full cursor-pointer">
                <Edit className={cn(
                    editing && "text-amber-300",
                    "hover:text-amber-300"
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
                        id={`item${index + 1}`}
                        startMonth={startMonth}
                        dates={dates}
                        editing={editing}
                        commitRoutine={commitRoutine}
                        completedDates={completedDates}
                        selectedDate={selectedDate}
                        setEditing={setEditing}
                    />
                ))}
            </div>
            <div className="flex w-full justify-center gap-2 py-2">
                <a href="#item1" className="btn btn-xs">1</a>
                <a href="#item2" className="btn btn-xs">2</a>
                <a href="#item3" className="btn btn-xs">3</a>
                <a href="#item4" className="btn btn-xs">4</a>
            </div>
        </>
    )
}

function groupCompletionsByDate(updatedCompletions: string[]) {
    return updatedCompletions.reduce((acc, date) => {
        const key = dayjs(date).format('YYYY-MM-DD');
        acc[key] = acc[key] ? acc[key] + 1 : 1;
        return acc;
    }, {} as Record<string, number>);
}
