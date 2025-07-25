// src/components/TaskManager.tsx

import { useState } from 'react';
import { Plus, Edit3, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

export interface Task {
  id: string;
  title: string;
  targetDate: Date;
  startDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'extreme';
}

interface TaskManagerProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onArchive: (task: Task) => void;
}

const priorityClasses = {
  low: 'border-blue-500/50 bg-blue-500/10 hover:border-blue-500',
  medium: 'border-yellow-500/50 bg-yellow-500/10 hover:border-yellow-500',
  high: 'border-orange-500/50 bg-orange-500/10 hover:border-orange-500',
  extreme: 'border-red-500/50 bg-red-500/10 hover:border-red-500 animate-pulse'
};

export const TaskManager = ({ tasks, onTasksChange, selectedTaskId, onSelectTask }: TaskManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deadlineType, setDeadlineType] = useState<'date' | 'days'>('date');
  const [numberOfDays, setNumberOfDays] = useState('30');
  const [formData, setFormData] = useState({
    title: '',
    targetDate: '',
    category: '',
    priority: 'high' as Task['priority']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetDateValue: Date;

    if (deadlineType === 'date') {
      if (!formData.targetDate) return;
      targetDateValue = new Date(formData.targetDate);
    } else {
      const days = parseInt(numberOfDays, 10);
      if (!days || days <= 0) return;
      targetDateValue = new Date();
      targetDateValue.setDate(targetDateValue.getDate() + days);
    }
    
    targetDateValue.setHours(23, 59, 59, 999);
    
    const taskData = {
      id: editingTask?.id || Date.now().toString(),
      title: formData.title,
      targetDate: targetDateValue,
      startDate: editingTask?.startDate || new Date(),
      category: formData.category || 'General',
      priority: formData.priority
    };

    const updatedTasks = editingTask
      ? tasks.map(task => (task.id === editingTask.id ? taskData : task))
      : [...tasks, taskData];
      
    onTasksChange(updatedTasks);
    if (!editingTask) {
        onSelectTask(taskData.id);
    }

    setFormData({ title: '', targetDate: '', category: '', priority: 'high' });
    setNumberOfDays('30');
    setDeadlineType('date');
    setIsAddDialogOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDeadlineType('date');
    setFormData({
      title: task.title,
      targetDate: task.targetDate.toISOString().split('T')[0],
      category: task.category,
      priority: task.priority
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    onTasksChange(updatedTasks);
    if (selectedTaskId === taskId && updatedTasks.length > 0) {
      onSelectTask(updatedTasks[0].id);
    } else if (updatedTasks.length === 0) {
      onSelectTask(null);
    }
  };

  const getTimeLeft = (targetDate: Date) => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
    
    if (days > 1) return `${days} days left`;
    if (days === 1) return '1 day left';
    if (days === 0) return 'Today!';
    return `${Math.abs(days)} days overdue`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold neon-text">Active Missions</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cyberpunk-button" onClick={() => { setEditingTask(null); setFormData({ title: '', targetDate: '', category: '', priority: 'high' }); setDeadlineType('date'); setNumberOfDays('30'); }}>
              <Plus className="w-4 h-4 mr-2" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/50">
            <DialogHeader><DialogTitle className="neon-text">{editingTask ? 'Edit Mission' : 'Create New Mission'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="title" className="text-foreground">Title</Label><Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="What will you conquer?" className="neon-border bg-background/50" required /></div>
              
              <div>
                <Label className="text-foreground">Deadline</Label>
                <ToggleGroup type="single" value={deadlineType} onValueChange={(value) => value && setDeadlineType(value as 'date' | 'days')} className="grid grid-cols-2 mt-2">
                  <ToggleGroupItem value="date">By Date</ToggleGroupItem>
                  <ToggleGroupItem value="days">In Days</ToggleGroupItem>
                </ToggleGroup>
                {deadlineType === 'date' ? (
                  <Input id="targetDate" type="date" value={formData.targetDate} onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })} className="neon-border bg-background/50 mt-2" required={deadlineType === 'date'} />
                ) : (
                  <Input id="numberOfDays" type="number" value={numberOfDays} onChange={(e) => setNumberOfDays(e.target.value)} placeholder="e.g., 30" className="neon-border bg-background/50 mt-2" required={deadlineType === 'days'} min="1" />
                )}
              </div>

              <div><Label htmlFor="category" className="text-foreground">Category</Label><Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Fitness, Business" className="neon-border bg-background/50" /></div>
              <div>
                <Label htmlFor="priority" className="text-foreground">Priority</Label>
                <select id="priority" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })} className="w-full p-2 rounded-md neon-border bg-background/50 text-foreground">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="extreme">EXTREME</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-4"><Button type="submit" className="flex-1 cyberpunk-button">{editingTask ? 'Update' : 'Launch'}</Button><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="neon-border">Cancel</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card 
            key={task.id}
            className={`p-3 cursor-pointer transition-all duration-300 ${selectedTaskId === task.id ? 'border-primary bg-primary/20 shadow-neon' : priorityClasses[task.priority]}`}
            onClick={() => onSelectTask(task.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2">
                <h4 className="font-semibold text-foreground truncate">{task.title}</h4>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" /><span className={getTimeLeft(task.targetDate).includes('overdue') ? 'text-red-500 font-bold' : ''}>{getTimeLeft(task.targetDate)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(task); }} className="h-7 w-7"><Edit3 className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="h-7 w-7 text-red-400 hover:bg-red-500/20"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground"><p className="font-bold">No missions active.</p><p className="text-sm">Time to stop making excuses.</p></div>
        )}
      </div>
    </div>
  );
};