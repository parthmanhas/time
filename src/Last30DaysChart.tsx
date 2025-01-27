import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import dayjs from "dayjs";

// Generate mock data for the last 30 days with dynamic tags
const generateLast30DaysDataWithTags = (tags) => {
    return Array.from({ length: 30 }, (_, i) => {
        const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
        const dataForTags = tags.reduce((acc, tag) => {
            acc[tag] = Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0; // Random hours per tag
            return acc;
        }, {});
        const totalTime = Object.values(dataForTags).reduce((sum, val) => sum + val, 0);
        return { date, totalTime, ...dataForTags }; // Combine date, total time, and tag data
    }).reverse(); // Reverse to show the oldest date first
};

// Example dynamic tags
const tags = ["Work", "Study", "Exercise", "Leisure", "SideProject"];
const data = generateLast30DaysDataWithTags(tags);

const Last30DaysChart = ({ className, showTags = false }: { className?: string, showTags?: boolean }) => {
    // const [showTags, setShowTags] = useState(tags); // Toggle state for tags

    return (
        <div className={`w-full h-[500px] ${className}`}>
            {/* <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <input
                    onChange={e => setShowTags(e.currentTarget.checked)}
                    type="checkbox"
                    className="toggle border-white bg-black checked:bg-black text-white"
                />
            </div> */}

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
                        label={{
                            value: "Hours Completed",
                            position: "insideBottom",
                            offset: 0,
                        }}
                    />
                    <YAxis
                        type="category"
                        dataKey="date"
                        label={{ angle: -90, position: "insideLeft" }}
                    // interval={0}
                    />
                    <Tooltip
                        formatter={(value, name) => (value > 0 ? `${value} hrs` : null)}
                        content={({ payload }) => {
                            if (!payload || payload.length === 0) return null;
                            if (!showTags) {
                                // For without tags, display total time
                                return (
                                    <div className="bg-black rounded border-2 border-slate-300 p-2">
                                        <p>{`Date: ${payload[0]?.payload?.date || ""}`}</p>
                                        <p>{`Total Time: ${payload[0]?.value} hrs`}</p>
                                    </div>
                                );
                            }
                            // For with tags, display tags with time > 0
                            const validTags = payload.filter((entry) => entry.value > 0);
                            return (
                                <div className="bg-black rounded border-2 border-slate-300 p-2">
                                    <p>{`Date: ${validTags[0]?.payload?.date || ""}`}</p>
                                    {validTags.map((entry) => (
                                        <p key={entry.name} style={{ color: entry.color }}>
                                            {entry.name}: {entry.value} hrs
                                        </p>
                                    ))}
                                </div>
                            );
                        }}
                    />
                    <Legend />
                    {showTags
                        ? tags.map((tag, index) => (
                            <Bar
                                key={tag}
                                dataKey={tag}
                                stackId="a"
                                fill={["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"][index % 5]} // Rotate colors for tags
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
