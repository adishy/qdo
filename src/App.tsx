import React, { useState, useMemo } from 'react';
import { useTasks } from './lib/TaskContext';
import { useSettings } from './lib/SettingsContext';
import { 
  LayoutList, Play, CheckCircle2, BarChart3, Settings as SettingsIcon, 
  Plus, Trash2, ArrowUpCircle, Sun, Moon, Download, Upload, 
  AlertTriangle, ChevronDown, ChevronUp, Edit2, X, Save,
  Link as LinkIcon, Info, Calendar, Clock, Layers, ArrowRight, ArrowUp
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence, Reorder, useMotionValue, useTransform } from 'framer-motion';
import type { Task, SlotHistory } from './lib/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const { tasks, history: taskHistory, addTask, moveTask, deleteTask, updateTask, clearData, exportData, importData, reorderTasks } = useTasks();
  const { theme, toggleTheme } = useSettings();
  const [activeTab, setActiveTab] = useState<'app' | 'stats' | 'settings'>('app');
  const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [shreddingTaskId, setShreddingTaskId] = useState<string | null>(null);

  const queueTasks = useMemo(() => tasks.filter(t => t.status === 'queue').sort((a, b) => a.queueOrder - b.queueOrder), [tasks]);
  const workingTask = tasks.find(t => t.status === 'working');
  const doneTasks = tasks.filter(t => t.status === 'done').sort((a, b) => b.dateModified - a.dateModified);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle);
    setNewTaskTitle('');
  };

  const handleComplete = async (id: string) => {
    setShreddingTaskId(id);
    // Wait for animation
    setTimeout(() => {
      moveTask(id, 'done');
      setShreddingTaskId(null);
    }, 600);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qdo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (re) => {
      const json = re.target?.result as string;
      try {
        await importData(json);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data. Invalid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-300",
      "bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
    )}>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">QDO</h1>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
          <TabButton active={activeTab === 'app'} onClick={() => setActiveTab('app')} icon={<LayoutList size={18} />} label="Queue" />
          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={18} />} label="Stats" />
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={18} />} label="Settings" />
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'app' && (
            <motion.div 
              key="app"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Working Slot */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Play size={14} className="text-indigo-500" /> Working Slot
                </h2>
                <div className={cn(
                  "group relative min-h-[180px] rounded-2xl border-2 border-dashed transition-all duration-500 flex items-center justify-center p-8",
                  workingTask 
                    ? "border-indigo-500/50 bg-indigo-500/5 ring-4 ring-indigo-500/10" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 bg-zinc-50 dark:bg-zinc-900/20"
                )}>
                  <AnimatePresence mode="wait">
                    {workingTask ? (
                      shreddingTaskId === workingTask.id ? (
                        <Shredder key="shredding" title={workingTask.title} />
                      ) : (
                        <motion.div 
                          key={workingTask.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="text-center space-y-4 w-full"
                        >
                          <h3 className="text-2xl font-bold">{workingTask.title}</h3>
                          <div className="flex justify-center gap-3">
                            <button 
                              onClick={() => handleComplete(workingTask.id)}
                              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                              <CheckCircle2 size={18} /> Complete
                            </button>
                            <button 
                              onClick={() => moveTask(workingTask.id, 'queue')}
                              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold transition-all active:scale-95"
                            >
                              Back to Queue
                            </button>
                          </div>
                        </motion.div>
                      )
                    ) : (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-zinc-400 dark:text-zinc-600 font-medium text-center"
                      >
                        Select a task to start working
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Queue */}
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <LayoutList size={14} className="text-indigo-500" /> The Queue ({queueTasks.length})
                    </h2>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <button 
                        onClick={() => setViewMode('list')}
                        className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-zinc-800 shadow-sm text-indigo-500" : "text-zinc-500")}
                      >
                        <LayoutList size={16} />
                      </button>
                      <button 
                        onClick={() => setViewMode('swipe')}
                        className={cn("p-1.5 rounded-md transition-all", viewMode === 'swipe' ? "bg-white dark:bg-zinc-800 shadow-sm text-indigo-500" : "text-zinc-500")}
                      >
                        <Layers size={16} />
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleAddTask} className="flex gap-2 w-full sm:max-w-xs">
                    <input 
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Add task..." 
                      className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-500"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/10">
                      <Plus size={20} />
                    </button>
                  </form>
                </div>

                <AnimatePresence mode="wait">
                  {viewMode === 'list' ? (
                    <motion.div
                      key="list-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Reorder.Group 
                        axis="y" 
                        values={queueTasks} 
                        onReorder={(newOrder) => reorderTasks(newOrder.map(t => t.id))}
                        className="space-y-3"
                      >
                        {queueTasks.map((task) => (
                          <Reorder.Item 
                            key={task.id} 
                            value={task}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <TaskItem 
                              task={task} 
                              onMove={(status) => moveTask(task.id, status)}
                              onDelete={() => deleteTask(task.id)}
                              onUpdate={(updated) => updateTask(updated)}
                            />
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </motion.div>
                  ) : (
                    <SwipeView 
                      key="swipe-view"
                      tasks={queueTasks} 
                      onSelect={(task) => moveTask(task.id, 'working')}
                    />
                  )}
                </AnimatePresence>
                
                {queueTasks.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 border border-zinc-100 dark:border-zinc-900 rounded-2xl"
                  >
                    <p className="text-zinc-400 dark:text-zinc-600 italic">Queue is empty. Time to relax!</p>
                  </motion.div>
                )}
              </section>

              {/* Done */}
              {doneTasks.length > 0 && (
                <section className="space-y-4 pt-8">
                  <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Recently Done
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {doneTasks.slice(0, 15).map(task => (
                      <motion.div 
                        layout
                        key={task.id} 
                        className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-500/80 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
                      >
                        {task.title}
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <StatsView tasks={tasks} history={taskHistory} />
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section className="space-y-6">
                <h2 className="text-xl font-bold">Settings</h2>
                
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Appearance</h3>
                      <p className="text-sm text-zinc-500">Switch between light and dark themes</p>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-indigo-500 transition-all"
                    >
                      {theme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-500" />}
                    </button>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold">Data Management</h3>
                      <p className="text-sm text-zinc-500">Backup or restore your local data</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleExport}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 p-3 rounded-xl font-medium transition-all"
                      >
                        <Download size={18} /> Export JSON
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 p-3 rounded-xl font-medium transition-all cursor-pointer">
                        <Upload size={18} /> Import JSON
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                      <AlertTriangle size={20} />
                      <h3 className="font-semibold">Danger Zone</h3>
                    </div>
                    <p className="text-sm text-red-500/80">This will permanently delete all your tasks and history. This action cannot be undone.</p>
                    <button 
                      onClick={() => {
                        if (confirm('Are you absolutely sure? All data will be wiped.')) {
                          clearData();
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-500/10"
                    >
                      Reset Everything
                    </button>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SwipeView({ tasks, onSelect }: { tasks: Task[], onSelect: (task: Task) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const upOpacity = useTransform(y, [-150, -100, 0], [0, 1, 1]);

  const currentTask = tasks[currentIndex];

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -100) {
      onSelect(currentTask);
    } else if (Math.abs(info.offset.x) > 100) {
      setCurrentIndex((prev) => (prev + 1) % tasks.length);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className="relative h-[400px] flex items-center justify-center perspective-1000 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-600 opacity-20">
          <ArrowUp size={48} />
          <span className="text-sm font-bold uppercase tracking-widest">Swipe Up to Slot</span>
          <div className="flex gap-20 mt-4">
            <div className="flex flex-col items-center gap-1">
              <ArrowRight size={24} className="rotate-180" />
              <span className="text-[10px]">Skip</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight size={24} />
              <span className="text-[10px]">Skip</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div 
          key={currentTask.id}
          style={{ x, y, rotate, opacity: upOpacity }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.05 }}
          className="absolute w-full max-w-sm aspect-[3/4] bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-8 flex flex-col justify-between cursor-grab active:cursor-grabbing z-10"
        >
          <div className="space-y-4">
            <div className="h-1 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-8" />
            <h3 className="text-3xl font-bold leading-tight">{currentTask.title}</h3>
            {currentTask.description && (
              <p className="text-zinc-500 dark:text-zinc-400 line-clamp-4">{currentTask.description}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <Clock size={12} /> Added {new Date(currentTask.dateAdded).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
        
        {tasks[(currentIndex + 1) % tasks.length] && (
          <motion.div 
            key="next-card"
            className="absolute w-full max-w-sm aspect-[3/4] bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800/50 rounded-3xl p-8 -z-10 scale-95 translate-y-4 opacity-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Shredder({ title }: { title: string }) {
  return (
    <div className="relative w-full text-center overflow-hidden h-24 flex items-center justify-center">
      <motion.div 
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeIn" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold line-through opacity-50">{title}</h3>
          <div className="flex justify-center gap-1">
            {[...Array(12)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: [0, 40, 0] }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
                className="w-1 bg-indigo-500/30 rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-emerald-500 font-bold text-xl flex items-center gap-2"
      >
        <CheckCircle2 size={24} /> Done!
      </motion.div>
    </div>
  );
}

function TaskItem({ task, onMove, onDelete, onUpdate }: { 
  task: Task, 
  onMove: (status: 'working' | 'done') => void, 
  onDelete: () => void,
  onUpdate: (task: Task) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editUrl, setEditUrl] = useState(task.url || '');
  const [editDue, setEditDue] = useState(task.dateDue ? new Date(task.dateDue).toISOString().slice(0, 16) : '');
  const [editRemind, setEditRemind] = useState(task.remindMe);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropVal, setNewPropVal] = useState('');

  const handleSave = () => {
    onUpdate({
      ...task,
      title: editTitle,
      description: editDesc,
      url: editUrl,
      dateDue: editDue ? new Date(editDue).getTime() : undefined,
      remindMe: editRemind,
    });
    setIsEditing(false);
  };

  const addProperty = () => {
    if (!newPropKey.trim()) return;
    onUpdate({
      ...task,
      customProperties: {
        ...task.customProperties,
        [newPropKey]: newPropVal
      }
    });
    setNewPropKey('');
    setNewPropVal('');
  };

  const removeProperty = (key: string) => {
    const next = { ...task.customProperties };
    delete next[key];
    onUpdate({ ...task, customProperties: next });
  };

  return (
    <motion.div 
      layout
      className={cn(
        "group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all",
        isExpanded ? "ring-2 ring-indigo-500/20 border-indigo-500/30 shadow-xl" : "hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-indigo-500 transition-colors shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{task.title}</h4>
            {task.description && !isExpanded && (
              <p className="text-xs text-zinc-500 truncate">{task.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => onMove('working')}
            className="p-2 hover:bg-indigo-500/10 text-indigo-500 rounded-xl transition-all active:scale-90"
            title="Start work"
          >
            <ArrowUpCircle size={20} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 rounded-xl transition-all"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-5 space-y-6"
          >
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Title</label>
                  <input 
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:ring-2 ring-indigo-500/50 outline-none"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Description</label>
                  <textarea 
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:ring-2 ring-indigo-500/50 outline-none min-h-[80px]"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">URL / Link</label>
                  <input 
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:ring-2 ring-indigo-500/50 outline-none"
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Due Date & Time</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:ring-2 ring-indigo-500/50 outline-none"
                      value={editDue}
                      onChange={e => setEditDue(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox"
                      id={`remind-${task.id}`}
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      checked={editRemind}
                      onChange={e => setEditRemind(e.target.checked)}
                    />
                    <label htmlFor={`remind-${task.id}`} className="text-sm font-medium">Remind me</label>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-all">Cancel</button>
                  <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all"><Save size={16} /> Save Changes</button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={10}/> Added</span>
                    <p className="text-xs font-medium">{new Date(task.dateAdded).toLocaleDateString()} at {new Date(task.dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {task.dateDue && (
                    <div className="space-y-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                        task.dateDue < Date.now() ? "text-red-500" : "text-zinc-500"
                      )}><Clock size={10}/> Due</span>
                      <p className={cn("text-xs font-bold", task.dateDue < Date.now() ? "text-red-500" : "")}>
                        {new Date(task.dateDue).toLocaleDateString()} at {new Date(task.dateDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                {task.description && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Info size={10}/> Description</span>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{task.description}</p>
                  </div>
                )}

                {task.url && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><LinkIcon size={10}/> Link</span>
                    <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline truncate block">
                      {task.url}
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Custom Properties</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(task.customProperties).map(([key, val]) => (
                      <div key={key} className="group/prop flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
                        <span className="text-zinc-500 font-bold">{key}:</span>
                        <span>{String(val)}</span>
                        <button onClick={() => removeProperty(key)} className="opacity-0 group-hover/prop:opacity-100 hover:text-red-500 transition-all ml-1">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
                      <input 
                        placeholder="Key" 
                        className="bg-transparent text-[10px] w-12 px-1 outline-none"
                        value={newPropKey}
                        onChange={e => setNewPropKey(e.target.value)}
                      />
                      <span className="text-zinc-500">:</span>
                      <input 
                        placeholder="Value" 
                        className="bg-transparent text-[10px] w-16 px-1 outline-none"
                        value={newPropVal}
                        onChange={e => setNewPropVal(e.target.value)}
                      />
                      <button onClick={addProperty} className="p-1 hover:bg-indigo-500 hover:text-white rounded transition-all">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 rounded-xl text-sm font-semibold transition-all"
                  >
                    <Edit2 size={16} /> Edit Task
                  </button>
                  <button 
                    onClick={onDelete}
                    className="p-2.5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
        active 
          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatsView({ tasks, history }: { tasks: Task[], history: SlotHistory[] }) {
  const [period, setPeriod] = useState<7 | 30>(7);
  const now = Date.now();
  const periodStart = now - period * 24 * 60 * 60 * 1000;

  const completedInPeriod = tasks.filter(t => t.status === 'done' && t.dateModified >= periodStart);
  
  const statsBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    completedInPeriod.forEach(t => {
      const source = t.source || 'No Source';
      counts[source] = (counts[source] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [completedInPeriod]);

  const historyInPeriod = useMemo(() => {
    return history.filter(h => h.enteredSlotAt >= periodStart || (h.exitedSlotAt && h.exitedSlotAt >= periodStart))
      .sort((a, b) => a.enteredSlotAt - b.enteredSlotAt);
  }, [history, periodStart]);

  // Gantt chart logic
  const chartWidth = 800;
  const chartHeight = Math.max(200, historyInPeriod.length * 30 + 40);
  
  const getTimeX = (time: number) => {
    const relativeTime = Math.max(0, time - periodStart);
    return (relativeTime / (now - periodStart)) * chartWidth;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Statistics</h2>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={() => setPeriod(7)}
            className={cn("px-3 py-1 rounded-md text-xs font-bold transition-all", period === 7 ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-zinc-500")}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setPeriod(30)}
            className={cn("px-3 py-1 rounded-md text-xs font-bold transition-all", period === 30 ? "bg-white dark:bg-zinc-800 shadow-sm" : "text-zinc-500")}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Completed</span>
          <p className="text-4xl font-black text-indigo-500">{completedInPeriod.length}</p>
          <p className="text-xs text-zinc-500">Tasks in last {period} days</p>
        </div>
        <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">By Source</h3>
          <div className="space-y-3">
            {statsBySource.slice(0, 5).map(([source, count]) => (
              <div key={source} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{source}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / completedInPeriod.length) * 100}%` }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
            ))}
            {statsBySource.length === 0 && <p className="text-center text-zinc-500 py-4 italic text-sm">No data yet</p>}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Working Slot History (Gantt)</h3>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 overflow-x-auto">
          {historyInPeriod.length > 0 ? (
            <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[600px]">
              {/* Timeline markers */}
              {[...Array(period + 1)].map((_, i) => {
                const x = (i / period) * chartWidth;
                return (
                  <g key={i}>
                    <line x1={x} y1={0} x2={x} y2={chartHeight - 20} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="4 4" />
                    <text x={x} y={chartHeight - 5} textAnchor="middle" className="text-[10px] fill-zinc-400">
                      {new Date(periodStart + i * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </text>
                  </g>
                );
              })}
              
              {/* Bars */}
              {historyInPeriod.map((h, i) => {
                const startX = getTimeX(h.enteredSlotAt);
                const endX = getTimeX(h.exitedSlotAt || now);
                const barY = i * 30 + 10;
                return (
                  <g key={h.id} className="group/bar">
                    <rect 
                      x={startX} 
                      y={barY} 
                      width={Math.max(2, endX - startX)} 
                      height={20} 
                      rx={4} 
                      className="fill-indigo-500/40 stroke-indigo-500 stroke-1 hover:fill-indigo-500/60 transition-all cursor-help"
                    />
                    <text 
                      x={startX + 5} 
                      y={barY + 14} 
                      className="text-[10px] font-bold fill-zinc-900 dark:fill-white opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity"
                    >
                      {h.taskTitle}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="text-center py-20 text-zinc-500 italic text-sm">No history records for this period</div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
