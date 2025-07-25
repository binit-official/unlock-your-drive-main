import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { StudyLog } from './StudyTimer';

interface DailyTaskCardProps {
  roadmap: any | null;
  selectedDay: number;
  onRoadmapUpdate: (updatedTasks: any[], completedTask?: any) => void;
  currentDay: number;
  onOpenTimer: (day: number, subTaskIndex: number, taskText: string, logs: StudyLog[]) => void;
}

export const DailyTaskCard = ({ roadmap, selectedDay, onRoadmapUpdate, currentDay, onOpenTimer }: DailyTaskCardProps) => {

  if (!roadmap || !roadmap.dailyTasks || roadmap.dailyTasks.length === 0) {
    return null;
  }

  const startDate = roadmap.startDate ? (roadmap.startDate.toDate ? roadmap.startDate.toDate() : new Date(roadmap.startDate)) : new Date();
  
  const handleSubTaskCompletion = (day: number, subTaskIndex: number, completed: boolean) => {
    let justCompletedTask: any = null;
    const updatedTasks = roadmap.dailyTasks.map((task: any) => {
      if (task.day === day) {
        const wasPreviouslyComplete = task.completed;
        const subTasks = task.task.split(';').map((s: string, i: number) => ({
            text: s.trim(),
            completed: i === subTaskIndex ? completed : (task.subTasks?.[i]?.completed ?? false),
            studyLogs: task.subTasks?.[i]?.studyLogs ?? [],
        }));
        const allCompleted = subTasks.every((st: any) => st.completed);

        if (allCompleted && !wasPreviouslyComplete) {
            justCompletedTask = { ...task, subTasks, completed: allCompleted };
        }
        return { ...task, subTasks, completed: allCompleted };
      }
      return task;
    });
    onRoadmapUpdate(updatedTasks, justCompletedTask);
  };
  
  const formatStudyTime = (logs: StudyLog[] | undefined) => {
    if (!logs || logs.length === 0) return null;
    const totalSeconds = logs.reduce((acc, log) => acc + log.duration, 0);
    if (totalSeconds === 0) return null;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m logged`;
    if (minutes > 0) return `${minutes}m ${seconds}s logged`;
    return `${seconds}s logged`;
  };

  const selectedDayTask = roadmap.dailyTasks.find((task: any) => task.day === selectedDay);
  const subTasks = selectedDayTask?.task.split(';').map((s: string) => s.trim()).filter(Boolean) || [];
  const previousIncompleteTasks = roadmap.dailyTasks.filter((task: any) => task.day < currentDay && !task.completed);
  const selectedDate = new Date(startDate);
  if (!isNaN(selectedDate.getTime())) {
    selectedDate.setDate(startDate.getDate() + selectedDay - 1);
  }

  return (
      <Card className="p-4 md:p-6 neon-border bg-card/90 backdrop-blur-sm border-primary/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-primary neon-text">Mission for Day {selectedDay}</h3>
          <span className="text-sm text-muted-foreground">{!isNaN(selectedDate.getTime()) ? format(selectedDate, 'MMMM d, yyyy') : 'Invalid Date'}</span>
        </div>

        {previousIncompleteTasks.length > 0 && selectedDay >= currentDay && (
          <div className="mb-4 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <h4 className="font-bold">INCOMPLETE TASKS!</h4>
            </div>
            <p className="text-xs mt-1">You have unfinished missions from previous days.</p>
          </div>
        )}

        {selectedDayTask && subTasks.length > 0 ? (
          <div className="space-y-3">
            {selectedDayTask.completed && (
              <div className="flex items-center space-x-2 text-green-400 p-2 bg-green-500/10 rounded-md">
                <CheckCircle className="w-5 h-5" />
                <p className="font-bold text-sm">Day Complete!</p>
              </div>
            )}
            {subTasks.map((subTask: string, index: number) => {
              const subTaskData = selectedDayTask.subTasks?.[index];
              const studyTime = formatStudyTime(subTaskData?.studyLogs);
              return (
                <div key={index} className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id={`task-${selectedDay}-${index}`}
                            checked={subTaskData?.completed ?? false}
                            onCheckedChange={(checked) => handleSubTaskCompletion(selectedDay, index, !!checked)}
                            className="neon-border mt-1"
                        />
                        <div>
                            <label
                                htmlFor={`task-${selectedDay}-${index}`}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                subTaskData?.completed ? 'line-through text-muted-foreground' : ''
                                }`}
                            >
                                {subTask}
                            </label>
                            {studyTime && <p className="text-xs text-primary/80 mt-1">{studyTime}</p>}
                        </div>
                    </div>
                    {!subTaskData?.completed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onOpenTimer(selectedDay, index, subTask, subTaskData?.studyLogs || [])}>
                            <Timer className="w-4 h-4 text-primary" />
                        </Button>
                    )}
                </div>
            )})}
          </div>
        ) : (
          <div className="flex items-center space-x-3 text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p>No tasks scheduled for this day.</p>
          </div>
        )}
      </Card>
  );
};