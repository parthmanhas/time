import { Plus } from "lucide-react"
import Last30DaysChart from "../Last30DaysChart"
import { TimerState } from "../types"
import { cn } from "../utils"
import { Routines } from "./routines"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

type ChartsRoutinesProps = {
    className?: string,
    mobile?: boolean,
    state: TimerState,
    setState: React.Dispatch<React.SetStateAction<TimerState>>,
    dbReady: boolean,
    addRoutine: (e?: React.KeyboardEvent<HTMLInputElement>) => void
    clearRoutine: (routine: string) => void
}

export const ChartsRoutines = ({ className, mobile = false, state, dbReady, setState, addRoutine, clearRoutine }: ChartsRoutinesProps) => {
    return (
        <div role="tablist" className={
            cn(
                className && className,
                mobile && "h-screen sm:hidden border-b flex items-center",
                !mobile && "hidden sm:h-full sm:flex items-center justify-center tabs tabs-border opacity-20 hover:opacity-100",
            )
        }>
            <Tabs defaultValue="30days" className="w-full">
                <TabsList className="bg-transparent flex justify-center">
                    <TabsTrigger value="30days" className="cursor-pointer">30 Days</TabsTrigger>
                    <TabsTrigger value="30daysTags" className="cursor-pointer">30 Days Tags</TabsTrigger>
                    <TabsTrigger value="routine" className="cursor-pointer">Routines</TabsTrigger>
                </TabsList>
                <TabsContent value="30days" className="h-[500px] overflow-scroll">
                    {state.timers.length > 0
                        ?
                        <Last30DaysChart timers={state.timers} />
                        :
                        <div className="flex items-center justify-center h-full">No data</div>
                    }
                </TabsContent>
                <TabsContent value="30daysTags" className="h-[500px] overflow-scroll">
                    {state.timers.length > 0
                        ?
                        <Last30DaysChart showTags={true} timers={state.timers} />
                        :
                        <div className="flex items-center justify-center h-full">No data</div>
                    }
                </TabsContent>
                <TabsContent value="routine" className="h-[500px] overflow-scroll">
                    <div className="flex justify-center m-5 gap-5">
                        <input
                            value={state.newRoutine}
                            onKeyDown={addRoutine}
                            onChange={e => setState(prev => ({ ...prev, newRoutine: e.target.value }))}
                            type="text"
                            className="p-2 rounded"
                            placeholder="add routine name"
                        />
                        <Button size="icon" className="cursor-pointer" onClick={() => addRoutine()}><Plus /></Button>
                    </div>
                    {state.routines.length > 0 ?
                        <>
                            <div className="flex justify-center mb-5">
                                <ul className="menu menu-horizontal shadow-md max-w-3/4 overflow-x-auto whitespace-nowrap flex-nowrap flex gap-3">
                                    {state.routines.map(routine => (
                                        <li
                                            key={routine}
                                            className={cn(
                                                state.selectedRoutine === routine && "border rounded block",
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
                                <Routines name={state.selectedRoutine} dbReady={dbReady} />
                                :
                                <p className="text-center pt-10">Select a routine to display</p>
                            }
                        </> :
                        <div className="flex justify-center pt-16">No routines yet</div>
                    }
                </TabsContent>
            </Tabs>
        </div>
    )
}