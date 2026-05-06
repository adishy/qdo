import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useTasks } from './lib/TaskContext';
import { useSettings } from './lib/SettingsContext';
import { 
  LayoutList, Play, CheckCircle2, BarChart3, Settings as SettingsIcon, 
  Plus, Trash2, ArrowUpCircle, Sun, Moon, Download, Upload, 
  AlertTriangle, ChevronDown, ChevronUp, X,
  Link as LinkIcon, Clock, Layers, ArrowRight, ArrowUp,
  GripVertical
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence, Reorder, useMotionValue, useTransform, useDragControls } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Task, SlotHistory } from './lib/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to format duration
const formatDuration = (ms: number) => {
  if (ms < 0) return '0s';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
};

export default function App() {
  const { tasks, history: taskHistory, addTask, moveTask, deleteTask, updateTask, clearData, exportData, importData, reorderTasks } = useTasks();
  const { theme, toggleTheme } = useSettings();
  const [activeTab, setActiveTab] = useState<'app' | 'stats' | 'settings'>('app');
  const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [shreddingTaskId, setShreddingTaskId] = useState<string | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  
  const workingSlotRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for adding task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        addInputRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        addInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const checkCollisionWithSlot = useCallback((x: number, y: number) => {
    if (!workingSlotRef.current) return false;
    const rect = workingSlotRef.current.getBoundingClientRect();
    return (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }, []);

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
              {/* Add Task Input - Front and Center with Classy Glow */}
              <section className="max-w-2xl mx-auto w-full pt-4 px-2">
                <form onSubmit={handleAddTask} className="relative group">
                  {/* Subtle Glowing Background */}
                  <div className="absolute -inset-[1px] bg-indigo-500/20 dark:bg-indigo-500/10 rounded-[18px] blur-sm group-focus-within:animate-glow-pulse transition-all duration-700 opacity-0 group-focus-within:opacity-100" />
                  
                  <div className="relative bg-zinc-50 dark:bg-zinc-950 rounded-2xl flex items-center border border-zinc-200 dark:border-zinc-800 group-focus-within:border-indigo-500/50 transition-all duration-500 shadow-lg group-focus-within:shadow-indigo-500/10">
                    <div className="absolute left-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                      <Plus size={20} />
                    </div>
                    <input 
                      ref={addInputRef}
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Add a task to the queue..." 
                      className="w-full bg-transparent pl-12 pr-24 py-4 text-lg font-bold focus:outline-none placeholder:text-zinc-500 dark:text-zinc-100"
                    />
                    <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
                      <kbd className="hidden sm:flex h-6 items-center gap-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                      <span className="text-zinc-300 dark:text-zinc-700 text-xs">or</span>
                      <kbd className="hidden sm:flex h-6 items-center gap-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 px-2 font-mono text-[10px] font-medium text-zinc-500">
                        /
                      </kbd>
                    </div>
                  </div>
                </form>
              </section>

              {/* Working Slot */}
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Play size={14} className="text-indigo-500" /> Working Slot
                </h2>
                <div 
                  ref={workingSlotRef}
                  className={cn(
                    "group relative min-h-[220px] rounded-3xl border-2 border-dashed transition-all duration-500 flex items-center justify-center p-8 overflow-hidden",
                    workingTask 
                      ? "border-indigo-500/50 bg-indigo-500/5 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-500/10" 
                      : isDropTarget
                        ? "border-indigo-500 bg-indigo-500/10 ring-8 ring-indigo-500/5 scale-[1.02]"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 bg-zinc-50 dark:bg-zinc-900/20"
                  )}
                >
                  {isDropTarget && !workingTask && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-indigo-500/10 flex flex-col items-center justify-center pointer-events-none"
                    >
                      <ArrowUpCircle size={48} className="text-indigo-500 animate-bounce" />
                      <span className="text-indigo-500 font-black text-xl uppercase tracking-tighter mt-4">Drop to start working</span>
                    </motion.div>
                  )}
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
                          className="w-full space-y-6"
                        >
                          <div className="text-center space-y-2">
                            <h3 className="text-3xl font-black">{workingTask.title}</h3>
                            {workingTask.url && (
                              <a href={workingTask.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-500 hover:underline">
                                <LinkIcon size={14} /> {workingTask.url}
                              </a>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-3">
                              {workingTask.description ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{workingTask.description}</ReactMarkdown>
                                </div>
                              ) : (
                                <p className="text-sm text-zinc-400 italic">No description</p>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(workingTask.customProperties).map(([key, val]) => (
                                  <div key={key} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-xs shadow-sm">
                                    <span className="text-zinc-500 font-bold">{key}:</span> {String(val)}
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => handleComplete(workingTask.id)}
                                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                >
                                  <CheckCircle2 size={18} /> Complete Task
                                </button>
                                <button 
                                  onClick={() => moveTask(workingTask.id, 'queue')}
                                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold transition-all active:scale-95 text-sm"
                                >
                                  Back to Queue
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    ) : (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-zinc-400 dark:text-zinc-600 font-medium text-center"
                      >
                        Drag a task here or select from queue to start working
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Queue */}
              <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-2">
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
                        className="space-y-4"
                      >
                        {queueTasks.map((task) => (
                          <DraggableTaskItem 
                            key={task.id} 
                            task={task} 
                            onMove={moveTask} 
                            onDelete={deleteTask} 
                            onUpdate={updateTask}
                            checkCollision={checkCollisionWithSlot}
                            setIsDropTarget={setIsDropTarget}
                          />
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

              {/* Done Section */}
              <DoneSection tasks={doneTasks} history={taskHistory} onDelete={deleteTask} onUpdate={updateTask} />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <StatsView tasks={tasks} history={taskHistory} onDelete={deleteTask} onUpdate={updateTask} />
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

function DraggableTaskItem({ task, onMove, onDelete, onUpdate, checkCollision, setIsDropTarget }: {
  task: Task,
  onMove: (id: string, status: 'working' | 'done' | 'queue') => void,
  onDelete: (id: string) => void,
  onUpdate: (task: Task) => void,
  checkCollision: (x: number, y: number) => boolean,
  setIsDropTarget: (v: boolean) => void
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      key={task.id} 
      value={task}
      dragControls={dragControls}
      dragListener={false}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onDrag={(_, info) => {
        if (checkCollision(info.point.x, info.point.y)) {
          setIsDropTarget(true);
        } else {
          setIsDropTarget(false);
        }
      }}
      onDragEnd={(_, info) => {
        setIsDropTarget(false);
        if (checkCollision(info.point.x, info.point.y)) {
          onMove(task.id, 'working');
        }
      }}
    >
      <TaskItem 
        task={task} 
        onMove={(status) => onMove(task.id, status)}
        onDelete={() => onDelete(task.id)}
        onUpdate={onUpdate}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}

function TaskItem({ task, onMove, onDelete, onUpdate, dragControls }: { 
  task: Task, 
  onMove?: (status: 'working' | 'done' | 'queue') => void, 
  onDelete: () => void,
  onUpdate: (task: Task) => void,
  dragControls?: any
}) {
  const [isExpanded, setIsExpanded] = useState(task.status === 'queue');
  const [localTask, setLocalTask] = useState(task);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropVal, setNewPropVal] = useState('');

  // Update local state if prop task changes (e.g. from context refresh)
  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  // Auto-save on blur or specific changes
  const handleBlur = () => {
    if (JSON.stringify(localTask) !== JSON.stringify(task)) {
      onUpdate(localTask);
    }
  };

  const addProperty = () => {
    if (!newPropKey.trim()) return;
    const updated = {
      ...localTask,
      customProperties: { ...localTask.customProperties, [newPropKey]: newPropVal }
    };
    setLocalTask(updated);
    onUpdate(updated);
    setNewPropKey('');
    setNewPropVal('');
  };

  const removeProperty = (key: string) => {
    const nextProps = { ...localTask.customProperties };
    delete nextProps[key];
    const updated = { ...localTask, customProperties: nextProps };
    setLocalTask(updated);
    onUpdate(updated);
  };

  const statusColors = {
    queue: "border-zinc-200 dark:border-zinc-800",
    working: "border-indigo-500/50 bg-indigo-500/5",
    done: "border-emerald-500/30 bg-emerald-500/5 opacity-80"
  };

  return (
    <div 
      className={cn(
        "group bg-zinc-50 dark:bg-zinc-900/50 border rounded-2xl overflow-hidden transition-all select-none",
        statusColors[task.status],
        isExpanded ? "ring-2 ring-indigo-500/10 shadow-lg" : "hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Handle - Only show/enable if dragControls provided */}
          {dragControls && (
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-1 -ml-1 text-zinc-300 dark:text-zinc-700 hover:text-indigo-500 cursor-grab active:cursor-grabbing transition-colors shrink-0"
              title="Drag handle"
            >
              <GripVertical size={20} />
            </div>
          )}

          <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
            <div className={cn(
              "h-3 w-3 rounded-full shrink-0",
              task.status === 'queue' ? "bg-zinc-300 dark:bg-zinc-700 group-hover:bg-indigo-500" :
              task.status === 'working' ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"
            )} />
            <input 
              className="flex-1 font-bold bg-transparent border-none p-0 focus:ring-0 outline-none truncate select-text cursor-text"
              value={localTask.title}
              onChange={e => setLocalTask({...localTask, title: e.target.value})}
              onBlur={handleBlur}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {onMove && task.status === 'queue' && (
            <button 
              onClick={() => onMove('working')}
              className="p-2 hover:bg-indigo-500/10 text-indigo-500 rounded-xl transition-all active:scale-90"
              title="Start work"
            >
              <ArrowUpCircle size={20} />
            </button>
          )}
          {onMove && task.status === 'working' && (
            <button 
              onClick={() => onMove('done')}
              className="p-2 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-all active:scale-90"
              title="Complete"
            >
              <CheckCircle2 size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 rounded-xl transition-all"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-5 space-y-6"
          >
            <div className="space-y-4 select-text">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Description (Markdown)</label>
                <textarea 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 ring-indigo-500/50 outline-none min-h-[100px] font-mono"
                  value={localTask.description}
                  onChange={e => setLocalTask({...localTask, description: e.target.value})}
                  onBlur={handleBlur}
                  placeholder="# Enter details..."
                />
                {localTask.description && (
                  <div className="mt-2 p-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{localTask.description}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">URL / Link</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:ring-2 ring-indigo-500/50 outline-none"
                      value={localTask.url || ''}
                      onChange={e => setLocalTask({...localTask, url: e.target.value})}
                      onBlur={handleBlur}
                    />
                    {localTask.url && (
                      <a href={localTask.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-all">
                        <LinkIcon size={18} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">Due Date</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:ring-2 ring-indigo-500/50 outline-none"
                    value={localTask.dateDue ? new Date(localTask.dateDue).toISOString().slice(0, 16) : ''}
                    onChange={e => setLocalTask({...localTask, dateDue: e.target.value ? new Date(e.target.value).getTime() : undefined})}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id={`remind-${task.id}`}
                  className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  checked={localTask.remindMe}
                  onChange={e => {
                    const updated = {...localTask, remindMe: e.target.checked};
                    setLocalTask(updated);
                    onUpdate(updated);
                  }}
                />
                <label htmlFor={`remind-${task.id}`} className="text-sm font-medium">Notify me when due</label>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Custom Properties</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(localTask.customProperties).map(([key, val]) => (
                    <div key={key} className="group/prop flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
                      <span className="text-zinc-500 font-bold">{key}:</span>
                      <span>{String(val)}</span>
                      <button onClick={() => removeProperty(key)} className="opacity-0 group-hover/prop:opacity-100 hover:text-red-500 transition-all ml-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 border border-dashed border-zinc-300 dark:border-zinc-700">
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

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Created</span>
                    <p className="text-[10px] font-medium">{new Date(task.dateAdded).toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Modified</span>
                    <p className="text-[10px] font-medium">{new Date(task.dateModified).toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={onDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} /> Delete Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DoneSection({ tasks, history, onDelete, onUpdate }: { tasks: Task[], history: SlotHistory[], onDelete: (id: string) => void, onUpdate: (task: Task) => void }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-4 pt-8">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full p-4 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-500 uppercase tracking-widest group hover:border-emerald-500/30 transition-all shadow-sm"
      >
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <CheckCircle2 size={18} className="text-emerald-500" /> 
          Recently Done ({tasks.length})
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-medium lowercase opacity-0 group-hover:opacity-100 transition-opacity">Click to {isCollapsed ? 'expand' : 'collapse'}</span>
          <div className="p-1 group-hover:bg-emerald-500/10 rounded-lg transition-all">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-6 pt-2"
          >
            {tasks.map(task => {
              const duration = history
                .filter(h => h.taskId === task.id)
                .reduce((total, h) => {
                  const end = h.exitedSlotAt || h.enteredSlotAt;
                  return total + (end - h.enteredSlotAt);
                }, 0);

              return (
                <div key={task.id} className="relative group/done-card">
                  <div className="absolute -left-3 top-0 bottom-0 w-1.5 bg-emerald-500/40 rounded-full blur-[1px]" />
                  <TaskItem task={task} onDelete={() => onDelete(task.id)} onUpdate={onUpdate} />
                  <div className="absolute right-12 top-4 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <Clock size={12} /> {formatDuration(duration)}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
    <div className="relative h-[550px] flex items-center justify-center perspective-1000 overflow-visible pb-12">
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
              <div className="prose prose-sm dark:prose-invert max-h-[160px] overflow-hidden text-zinc-500 dark:text-zinc-400 line-clamp-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentTask.description}</ReactMarkdown>
              </div>
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

const RESOLUTIONS = [
  { label: 'Last 10 Mins', value: 10 * 60 * 1000 },
  { label: 'Last 1 Hour', value: 60 * 60 * 1000 },
  { label: 'Last 8 Hours', value: 8 * 60 * 60 * 1000 },
  { label: 'Last Day', value: 24 * 60 * 60 * 1000 },
  { label: 'Last Week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Last 2 Weeks', value: 14 * 24 * 60 * 60 * 1000 },
  { label: 'Last Month', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Last Quarter', value: 90 * 24 * 60 * 60 * 1000 },
  { label: 'Last Year', value: 365 * 24 * 60 * 60 * 1000 },
];

function StatsView({ tasks, history, onDelete, onUpdate }: { tasks: Task[], history: SlotHistory[], onDelete: (id: string) => void, onUpdate: (task: Task) => void }) {
  const [periodMs, setPeriodMs] = useState(24 * 60 * 60 * 1000);
  const now = Date.now();
  const periodStart = now - periodMs;

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

  const chartWidth = 800;
  const chartHeight = Math.max(200, historyInPeriod.length * 35 + 40);
  
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
        <select 
          value={periodMs}
          onChange={(e) => setPeriodMs(Number(e.target.value))}
          className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/50"
        >
          {RESOLUTIONS.map(res => (
            <option key={res.value} value={res.value}>{res.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-2 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Completed</span>
          <p className="text-4xl font-black text-indigo-500">{completedInPeriod.length}</p>
          <p className="text-xs text-zinc-500">Tasks in selected period</p>
        </div>
        <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
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
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 overflow-x-auto shadow-sm">
          {historyInPeriod.length > 0 ? (
            <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[600px]">
              {/* Timeline markers */}
              {[...Array(5)].map((_, i) => {
                const x = (i / 4) * chartWidth;
                const time = periodStart + (i / 4) * periodMs;
                return (
                  <g key={i}>
                    <line x1={x} y1={0} x2={x} y2={chartHeight - 40} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="4 4" />
                    <text x={x} y={chartHeight - 15} textAnchor="middle" className="text-[10px] font-bold fill-zinc-400">
                      {new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </text>
                    <text x={x} y={chartHeight - 5} textAnchor="middle" className="text-[9px] fill-zinc-500">
                      {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </text>
                  </g>
                );
              })}
              
              {/* Bars */}
              {historyInPeriod.map((h, i) => {
                const startX = getTimeX(h.enteredSlotAt);
                const endX = getTimeX(h.exitedSlotAt || now);
                const barY = i * 45 + 10;
                const barWidth = Math.max(8, endX - startX);
                
                return (
                  <g key={h.id} className="group/bar">
                    <rect 
                      x={startX} 
                      y={barY} 
                      width={barWidth} 
                      height={35} 
                      rx={8} 
                      className="fill-indigo-500/20 stroke-indigo-500/50 stroke-1 hover:fill-indigo-500/40 transition-all cursor-help"
                    />
                    <foreignObject x={startX + 5} y={barY} width={Math.max(200, barWidth - 10)} height="35">
                      <div className="flex items-center h-full overflow-hidden">
                        <span className="text-[11px] font-bold truncate text-indigo-700 dark:text-indigo-300 pointer-events-none">
                          {h.taskTitle}
                          <span className="ml-2 font-normal opacity-70">
                            ({formatDuration((h.exitedSlotAt || now) - h.enteredSlotAt)})
                          </span>
                        </span>
                      </div>
                    </foreignObject>
                    
                    {/* Tooltip on hover */}
                    <title>{h.taskTitle} (Started: {new Date(h.enteredSlotAt).toLocaleString()})</title>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="text-center py-20 text-zinc-500 italic text-sm">No history records for this period</div>
          )}
        </div>
      </section>

      {/* Done section included in stats too */}
      <DoneSection tasks={completedInPeriod} history={history} onDelete={onDelete} onUpdate={onUpdate} />
    </motion.div>
  );
}
