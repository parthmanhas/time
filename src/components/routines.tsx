// generate dates for a year

import dayjs from "dayjs";
import { cn } from "../utils";
import { useEffect, useState } from "react";
import { getRoutineCompletions, toggleRoutineCompletion } from "../db";
import { Edit } from "lucide-react";

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
    const [selectedDate, setSelectedDate] = useState<string | null>();
    const [completedDates, setCompletedDates] = useState<string[]>([]);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (!dbReady) return;
        (async () => {
            setSelectedDate(null);
            setCompletedDates([]);
            try {
                const completedDates = await getRoutineCompletions(name) as string[];
                setCompletedDates(completedDates || []);
            } catch (err) {
                console.error(err);
            }
        })()
    }, [name, dbReady])

    const toggleRoutine = async (date: string) => {
        if (dayjs(date).isSame(new Date, 'day') || (editing && dayjs(date).isBefore(new Date()))) {
            const updatedCompletions = await toggleRoutineCompletion(name, date) as string[];
            setCompletedDates(updatedCompletions)
        };
    }

    return (
        <div className="carousel max-w-[350px]">
            <div className="carousel-item flex flex-wrap gap-2 h-full w-full mx-5">
                {Array.from({ length: 3 }, (_, i) => i + 1).map((i) => {
                    return (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="text-center">{dayjs(`2025-${i}-01`).format('MMMM').toLowerCase()}</div>
                            <div className="flex flex-wrap gap-2">
                                {dates.map((date) => {
                                    if (dayjs(date).month() + 1 !== i) return null;
                                    return (
                                        <div key={date}
                                            onClick={() => toggleRoutine(date)}
                                            className={cn(
                                                "w-5 h-5 bg-white rounded cursor-pointer",
                                                completedDates.includes(date) && "bg-green-500",
                                                dayjs(date).isSame(new Date(), 'day') && !completedDates.includes(date) && "bg-yellow-500",
                                                dayjs(selectedDate).isSame(new Date(), 'day') && dayjs(selectedDate).isSame(date, 'day') && "!bg-green-500"
                                            )}>
                                            {/* Add your logic to change the color based on the routine */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                <div
                    onClick={() => setEditing(!editing)}
                    className="flex justify-end w-full cursor-pointer">
                    <Edit className={cn(
                        editing && "text-amber-300",
                        "hover:text-amber-300"
                    )} />
                </div>
            </div>
            <div className="carousel-item flex flex-wrap gap-2 h-full w-full mx-5">
                {Array.from({ length: 3 }, (_, i) => i + 4).map((i) => {
                    return (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="text-center">{dayjs(`2025-${i}-01`).format('MMMM').toLowerCase()}</div>
                            <div className="flex flex-wrap gap-2">
                                {dates.map((date) => {
                                    if (dayjs(date).month() + 1 !== i) return null;
                                    return (
                                        <div key={date}
                                            onClick={() => toggleRoutine(date)}
                                            className={cn(
                                                "w-5 h-5 bg-white rounded cursor-pointer",
                                                completedDates.includes(date) && "bg-green-500",
                                                dayjs(date).isSame(new Date(), 'day') && !completedDates.includes(date) && "bg-yellow-500",
                                                dayjs(selectedDate).isSame(new Date(), 'day') && dayjs(selectedDate).isSame(date, 'day') && "!bg-green-500"
                                            )}>
                                            {/* Add your logic to change the color based on the routine */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                <div
                    onClick={() => setEditing(!editing)}
                    className="flex justify-end w-full cursor-pointer">
                    <Edit className={cn(
                        editing && "text-amber-300",
                        "hover:text-amber-300"
                    )} />
                </div>
            </div>
            <div className="carousel-item flex flex-wrap gap-2 h-full w-full mx-5">
                {Array.from({ length: 3 }, (_, i) => i + 7).map((i) => {
                    return (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="text-center">{dayjs(`2025-${i}-01`).format('MMMM').toLowerCase()}</div>
                            <div className="flex flex-wrap gap-2">
                                {dates.map((date) => {
                                    if (dayjs(date).month() + 1 !== i) return null;
                                    return (
                                        <div key={date}
                                            onClick={() => toggleRoutine(date)}
                                            className={cn(
                                                "w-5 h-5 bg-white rounded cursor-pointer",
                                                completedDates.includes(date) && "bg-green-500",
                                                dayjs(date).isSame(new Date(), 'day') && !completedDates.includes(date) && "bg-yellow-500",
                                                dayjs(selectedDate).isSame(new Date(), 'day') && dayjs(selectedDate).isSame(date, 'day') && "!bg-green-500"
                                            )}>
                                            {/* Add your logic to change the color based on the routine */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                <div
                    onClick={() => setEditing(!editing)}
                    className="flex justify-end w-full cursor-pointer">
                    <Edit className={cn(
                        editing && "text-amber-300",
                        "hover:text-amber-300"
                    )} />
                </div>
            </div>
            <div className="carousel-item flex flex-wrap gap-2 h-full w-full mx-5">
                {Array.from({ length: 3 }, (_, i) => i + 10).map((i) => {
                    return (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="text-center">{dayjs(`2025-${i}-01`).format('MMMM').toLowerCase()}</div>
                            <div className="flex flex-wrap gap-2">
                                {dates.map((date) => {
                                    if (dayjs(date).month() + 1 !== i) return null;
                                    return (
                                        <div key={date}
                                            onClick={() => toggleRoutine(date)}
                                            className={cn(
                                                "w-5 h-5 bg-white rounded cursor-pointer",
                                                completedDates.includes(date) && "bg-green-500",
                                                dayjs(date).isSame(new Date(), 'day') && !completedDates.includes(date) && "bg-yellow-500",
                                                dayjs(selectedDate).isSame(new Date(), 'day') && dayjs(selectedDate).isSame(date, 'day') && "!bg-green-500"
                                            )}>
                                            {/* Add your logic to change the color based on the routine */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                <div
                    onClick={() => setEditing(!editing)}
                    className="flex justify-end w-full cursor-pointer">
                    <Edit className={cn(
                        editing && "text-amber-300",
                        "hover:text-amber-300"
                    )} />
                </div>
            </div>
        </div>
    )
}