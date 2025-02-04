import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
    Label,
} from "recharts";
import dayjs from "dayjs";
import { TimerModel } from "./types";

// Generate mock data for the last 30 days with dynamic tags
const generateLast30DaysDataWithTags = (timers: TimerModel[]) => {
    return Array.from({ length: 30 }, (_, i) => {
        const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
        const dateTimers = timers.filter(timer => dayjs(timer.completed_at).isSame(date, 'day'));
        const dataForTags = dateTimers.reduce((acc: Record<string, number>, timer) => {
            for (const tag of timer.tags) {
                if (acc[tag]) acc[tag] += timer.duration;
                else acc[tag] = timer.duration
            }
            return acc;
        }, {});
        const formatSecondsToDecimalHours = (seconds: number) => {
            return parseFloat((seconds / 3600).toFixed(2))
        }
        const tagsInDecimalHours = Object.fromEntries(
            Object.entries(dataForTags).map(([tag, timeInSeconds]) => [tag, formatSecondsToDecimalHours(timeInSeconds)])
        );
        return { date, ...tagsInDecimalHours }; // Combine date, total time, and tag data

    }).reverse(); // Reverse to show the oldest date first
};

const generateLast30DaysDataWithoutTags = (timers: TimerModel[]) => {
    return Array.from({ length: 30 }, (_, i) => {
        const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
        const totalTime = timers
            .filter(timer => dayjs(timer.completed_at).isSame(date, 'day'))
            .reduce<Record<string, number>>((acc, timer) => {
                if (!acc[date]) acc[date] = 0;
                acc[date] += timer.status === 'COMPLETED' ? timer.duration : 0;
                return acc;
            }, {});
        const totalTimeInHours = (totalTime[date] / 3600).toFixed(2);
        return { date, totalTime: parseFloat(totalTimeInHours) || 0 }; // Combine date, total time, and tag data
    }).reverse(); // Reverse to show the oldest date first
};

const decimalToMinutes = (decimalHours: number) => {
    const hours = Math.floor(decimalHours); // Whole hours
    const minutes = Math.round((decimalHours - hours) * 60); // Remaining minutes
    if (minutes === 0) return `${hours} hr`
    if (hours === 0) return `${minutes} min`
    return `${hours} hr ${minutes} min`;
};

const Last30DaysChart = ({ className = '', showTags = false, timers }: { className?: string, showTags?: boolean, timers: TimerModel[] }) => {
    // const [showTags, setShowTags] = useState(tags); // Toggle state for tags

    let data = null;
    let uniqueTags: string[] = [];

    if (showTags === true) {
        data = generateLast30DaysDataWithTags(timers);
        uniqueTags = Array.from(new Set(Object.values(data).flatMap(obj => Object.keys(obj)))).filter(tag => tag !== 'totalTime' && tag !== 'date');
    } else {
        data = generateLast30DaysDataWithoutTags(timers);
    }

    return (
        <div className={`w-full h-[500px] ${className}`}>
            <ResponsiveContainer>
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 50,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="1 5" />
                    <XAxis
                        type="number"
                    >
                        <Label
                            position='insideBottom'
                            offset={-5}
                            value="Hours Completed"
                        />
                    </XAxis>
                    <YAxis
                        type="category"
                        dataKey="date"
                        label={{ angle: -90, position: "insideLeft" }}
                    // interval={0}
                    />
                    <Tooltip
                        formatter={(value) => (typeof value === 'number' && value > 0 ? `${decimalToMinutes(value)}` : null)}
                        content={({ payload }) => {
                            if (!payload || payload.length === 0) return null;
                            if (!showTags) {
                                // For without tags, display total time
                                return (
                                    <div className="bg-black rounded border-2 border-slate-300 p-2">
                                        <p>{`Date: ${payload[0]?.payload?.date || ""}`}</p>
                                        <p>{`Total Time: ${typeof payload[0]?.value === 'number' ? decimalToMinutes(payload[0].value) : '0 min'}`}</p>
                                    </div>
                                );
                            }
                            // For with tags, display tags with time > 0
                            const validTags = payload.filter((entry) => entry.value !== undefined && !isNaN(parseFloat(String(entry.value))) && parseFloat(String(entry.value)) > 0);
                            return (
                                <div className="bg-black rounded border-2 border-slate-300 p-2">
                                    <p>{`Date: ${validTags[0]?.payload?.date || ""}`}</p>
                                    {validTags.map((entry) => {
                                        return (
                                            <p key={entry.name} style={{ color: entry.color }}>
                                                {entry.name}: {typeof entry.value === 'number' ? decimalToMinutes(entry.value) : '0 min'}
                                            </p>
                                        )
                                    })}
                                </div>
                            );
                        }}
                    />
                    <Legend wrapperStyle={{bottom: -10}}/>
                    {showTags
                        ? uniqueTags.map((tag, index) => (
                            <Bar
                                key={tag}
                                dataKey={tag}
                                stackId="a"
                                fill={[
                                    "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1",
                                    "#a5d6a7", "#ffcc80", "#f48fb1", "#b3e5fc", "#c5e1a5",
                                    "#ffd54f", "#64b5f6", "#81c784", "#d1c4e9", "#e57373"
                                ][index % 15]} // Rotate colors for tags
                                name={tag}
                            />
                        ))
                        : // Single bar for total time without tags
                        [
                            <Bar
                                key="totalTime"
                                dataKey="totalTime"
                                fill="#fff"
                                name="Total Time"
                            />,
                        ]}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Last30DaysChart;
