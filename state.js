/**
 * STRIDE State Management Module
 * Responsible for data operations and persistence.
 * Modularized to separate "State" from "UI".
 */

const State = (() => {
    // Standardized default tasks for initial load.
    const DEFAULT_TASKS = [
        {
            id: 1,
            text: "Prepare English lesson plan for next week's vocational center sessions.",
            urgency: "high",
            tags: ["Internship", "LessonPlan"],
            completed: false,
            isArchived: false,
            createdAt: Date.now() - 7200000, // 2h ago
            subtasks: [
                { id: 11, text: "Research interactive grammar games for C1 level.", completed: false },
                { id: 12, text: "Print handouts for 20 students.", completed: false },
                { id: 13, text: "Coordinate with the lead teacher on timing.", completed: false }
            ]
        },
        {
            id: 2,
            text: "Design a brand strategy and visual identity for an understated, 'Dark Romantic' menswear label focusing on high-quality fabrics and minimalist silhouettes.",
            urgency: "medium",
            tags: ["DesignStrategy", "Menswear"],
            completed: false,
            isArchived: false,
            createdAt: Date.now() - 3600000, // 1h ago
            subtasks: []
        },
        {
            id: 3,
            text: "Buy ingredients for lamb and prune tagine.",
            urgency: "low",
            tags: ["CulinaryGoal", "Khenifra"],
            completed: false,
            isArchived: false,
            createdAt: Date.now() - 86400000, // 1d ago
            subtasks: [
                { id: 31, text: "Visit the local market in Khenifra for fresh prunes.", completed: false },
                { id: 32, text: "Check spice levels for ras el hanout.", completed: false }
            ]
        },
        {
            id: 4,
            text: "Compare agentic IDE features in Antigravity versus standard VS Code plugins.",
            urgency: "none",
            tags: ["Research"],
            completed: false,
            isArchived: false,
            createdAt: Date.now() - 300000, // 5m ago
            subtasks: []
        },
        {
            id: 5,
            text: "Research technical specifications for civilian-grade body armor and check local range availability or training centers for tactical gear familiarization.",
            urgency: "low",
            tags: ["Tactical", "DeepDive"],
            completed: false,
            isArchived: false,
            createdAt: Date.now() - 43200000, // 12h ago
            subtasks: [
                { id: 51, text: "Verify NIJ level ratings.", completed: false },
                { id: 52, text: "Compare carrier plate weights.", completed: false }
            ]
        }
    ];

    let tasks = [];

    /**
     * The Gatekeeper (Persistence System):
     * Handles all localStorage writes to prevent sync errors.
     * Every data mutation must pass through here.
     */
    const persist = () => {
        sortTasks();
        localStorage.setItem('tasks', JSON.stringify(tasks));
        if (window.showSaveIndicator) window.showSaveIndicator();
    };

    const loadTasks = () => {
        const stored = localStorage.getItem('tasks');
        tasks = stored ? JSON.parse(stored) : [...DEFAULT_TASKS];
        if (!stored) persist();
        return tasks;
    };

    /**
     * Smart Sorting Logic:
     * Priorities tasks by Urgency weight (High > Med > Low > None).
     * If 'sink' preference is active, completed tasks are pushed to the bottom.
     */
    const sortTasks = () => {
        const weights = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
        tasks.sort((a, b) => {
            if (window.userPreferences?.completionAction === 'sink') {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
            }
            return weights[b.urgency] - weights[a.urgency];
        });
    };

    const addTask = (taskData) => {
        const newTask = {
            id: Date.now(),
            text: taskData.text,
            urgency: taskData.urgency || 'none',
            tags: taskData.tags || [],
            completed: false,
            isArchived: false,
            createdAt: Date.now(),
            subtasks: []
        };
        tasks.push(newTask);
        persist();
        return newTask;
    };

    const deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        persist();
    };

    const updateTask = (id, updates) => {
        tasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
        persist();
    };

    /**
     * Toggle Task Completion:
     * Integrated with "Auto-Archive" automation.
     * If completionAction is 'archive', tasks move to archive record instantly.
     */
    const toggleTask = (id) => {
        tasks = tasks.map(t => {
            if (t.id === id) {
                const newState = !t.completed;
                if (newState && window.userPreferences?.completionAction === 'archive') {
                    return { ...t, completed: newState, isArchived: true };
                }
                return { ...t, completed: newState };
            }
            return t;
        });
        persist();
    };

    const addSubTask = (parentId) => {
        const newSubId = Date.now();
        tasks = tasks.map(t => {
            if (t.id === parentId) {
                if (!t.subtasks) t.subtasks = [];
                t.subtasks.push({ id: newSubId, text: '', completed: false, isEditing: true });
            }
            return t;
        });
        persist();
        return newSubId;
    };

    const saveSubTask = (parentId, subId, text) => {
        tasks = tasks.map(t => {
            if (t.id === parentId && t.subtasks) {
                if (!text.trim()) {
                    t.subtasks = t.subtasks.filter(s => s.id !== subId);
                } else {
                    t.subtasks = t.subtasks.map(s => s.id === subId ? { ...s, text, isEditing: false } : s);
                }
            }
            return t;
        });
        persist();
    };

    const toggleSubTask = (parentId, subId) => {
        let parentAutoChanged = false;
        let needsFullRefresh = false;

        tasks = tasks.map(t => {
            if (t.id === parentId && t.subtasks) {
                t.subtasks = t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);

                const allDone = t.subtasks.length > 0 && t.subtasks.every(s => s.completed);

                if (t.completed !== allDone) {
                    t.completed = allDone;
                    parentAutoChanged = true;

                    // Check if parent should move/sink/archive
                    const mode = window.userPreferences?.completionAction;
                    if (mode === 'sink' || mode === 'archive') {
                        needsFullRefresh = true;
                        if (mode === 'archive' && t.completed) t.isArchived = true;
                    }
                }
            }
            return t;
        });
        persist();
        return { parentAutoChanged, needsFullRefresh };
    };

    const deleteSubTask = (parentId, subId) => {
        tasks = tasks.map(t => {
            if (t.id === parentId && t.subtasks) {
                t.subtasks = t.subtasks.filter(s => s.id !== subId);
            }
            return t;
        });
        persist();
    };

    const reorderTasks = (fromIdx, toIdx) => {
        const [moved] = tasks.splice(fromIdx, 1);
        tasks.splice(toIdx, 0, moved);
        persist();
    };

    const reorderSubTasks = (parentId, fromIdx, toIdx) => {
        tasks = tasks.map(t => {
            if (t.id === parentId && t.subtasks) {
                const [moved] = t.subtasks.splice(fromIdx, 1);
                t.subtasks.splice(toIdx, 0, moved);
            }
            return t;
        });
        persist();
    };

    return {
        loadTasks,
        getTasks: () => tasks,
        addTask,
        deleteTask,
        updateTask,
        toggleTask,
        addSubTask,
        saveSubTask,
        toggleSubTask,
        deleteSubTask,
        reorderTasks,
        reorderSubTasks
    };
})();
