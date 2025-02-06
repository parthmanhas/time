import Last30DaysChart from "../Last30DaysChart"
import { TimerState } from "../types"
import { cn } from "../utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

type ChartsRoutinesProps = {
    id?: string,
    className?: string,
    mobile?: boolean,
    state: TimerState,
}

export const Charts = ({ id, className, mobile = false, state, }: ChartsRoutinesProps) => {
    return (
        <div id={id}
            role="tablist"
            className={
                cn(
                    className && className,
                    mobile && "h-screen sm:hidden flex items-start",
                    !mobile && "hidden sm:h-full sm:flex justify-center tabs tabs-border opacity-20 hover:opacity-100",
                )
            }>
            <Tabs defaultValue="30days" className="w-full">
                <TabsList className="bg-transparent flex justify-center">
                    <TabsTrigger value="30days" className="cursor-pointer">30 Days</TabsTrigger>
                    <TabsTrigger value="30daysTags" className="cursor-pointer">30 Days Tags</TabsTrigger>
                </TabsList>
                <TabsContent value="30days" className="h-[550px] overflow-scroll">
                    {state.timers.length > 0
                        ?
                        <Last30DaysChart timers={state.timers} />
                        :
                        <div className="flex items-center justify-center h-full">No data</div>
                    }
                </TabsContent>
                <TabsContent value="30daysTags" className="h-[550px] overflow-scroll">
                    {state.timers.length > 0 && state.timers.some(timer => timer.tags.length > 0)
                        ?
                        <Last30DaysChart showTags={true} timers={state.timers} />
                        :
                        <div className="flex items-center justify-center h-full">No data</div>
                    }
                </TabsContent>
            </Tabs>
        </div>
    )
}