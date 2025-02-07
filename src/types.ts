export type TimerStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'QUEUED';

export interface TimerModel {
  id: string;
  duration: number;
  remaining_time: number;
  status: TimerStatus;
  created_at: string;
  completed_at: string;
  tags: string[];
  task: string;
  newTask?: string;
  newTag?: string;
  userId?: string; // Add userId for data ownership
}

export type AppState = {
  currentTimer: TimerModel,
  timers: TimerModel[],
  selectedRoutine: string,
  newRoutine: string,
  routines: RoutineWithCompletions[]
}


export type RoutineWithCompletions = {
    name: string;
    completions: Date[];
};
