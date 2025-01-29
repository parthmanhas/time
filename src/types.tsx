
export type TimerStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'QUEUED';

export type TimerModel = {
  id: string,
  duration: number;
  remaining_time: number;
  status: TimerStatus,
  created_at: string,
  completed_at: string,
  tags: string[],
  task: string,
  newTask: string,
  newTag: string
}

export type TimerState = {
  currentTimer: TimerModel,
  timers: TimerModel[],
  selectedRoutine: string,
  newRoutine: string,
  routines: string[]
}