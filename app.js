/**
 * STRIDE UI Rendering Module
 * Focused purely on DOM manipulation and Event Binding.
 * Delegates all data operations to State.js.
 */

// ==========================================================================
// 1. DOM Elements
// ==========================================================================
const todoInput = document.getElementById('todo-input');
const urgDropdown = document.getElementById('urgency-dropdown');
const urgTrigger = urgDropdown.querySelector('.dropdown-trigger');
const urgOptionsList = urgDropdown.querySelector('.dropdown-options');
const urgOptions = urgDropdown.querySelectorAll('.dropdown-option');
const activeUrgencyText = urgTrigger.querySelector('span');
const activeUrgencyStripe = urgTrigger.querySelector('.urgency-stripe');

// Helper to get priority dropdown HTML
const getPriorityDropdownHTML = () => `
    <div class="dropdown-options">
        <div class="dropdown-option" data-urg="none">
            <div class="urgency-stripe none"></div>
            <span>None</span>
        </div>
        <div class="dropdown-option" data-urg="low">
            <div class="urgency-stripe low"></div>
            <span>Low</span>
        </div>
        <div class="dropdown-option" data-urg="medium">
            <div class="urgency-stripe medium"></div>
            <span>Medium</span>
        </div>
        <div class="dropdown-option" data-urg="high">
            <div class="urgency-stripe high"></div>
            <span>High</span>
        </div>
    </div>
`;

const commandCapsule = document.getElementById('command-capsule');
const capsuleDisplayText = document.getElementById('capsule-display-text');

const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const emptyMsg = document.getElementById('empty-msg');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');
const testSuiteBtn = document.getElementById('test-suite-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const archiveToggleBtn = document.getElementById('archive-toggle-btn');

const taskFontSelect = document.getElementById('task-font-select');
const subtaskFontSelect = document.getElementById('subtask-font-select');
const densitySlider = document.getElementById('density-slider');
const contrastSegments = document.querySelectorAll('#contrast-segments .segment');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const motionToggle = document.getElementById('motion-toggle');
const stealthToggle = document.getElementById('stealth-toggle');
const completionActionSelect = document.getElementById('completion-action');
const resetDefaultsBtn = document.getElementById('reset-defaults-btn');

let currentView = 'timeline'; // 'timeline' or 'archive'
let editingTaskId = null;

// ==========================================================================
// 2. Global UI Helpers
// ==========================================================================

window.showSaveIndicator = () => {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) return;
    indicator.classList.add('visible');
    setTimeout(() => indicator.classList.remove('visible'), 2000);
};

const timeAgo = (timestamp) => {
    if (!timestamp) return 'recently';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

// ==========================================================================
// 3. UI logic
// ==========================================================================

const UI = (() => {
    const renderTasks = () => {
        todoList.innerHTML = '';
        const tasks = State.getTasks();

        let filteredTasks = [];
        const emptyImg = emptyMsg.querySelector('.empty-illustration');
        const emptyText = emptyMsg.querySelector('p');

        if (currentView === 'archive') {
            filteredTasks = tasks.filter(t => t.isArchived);
            emptyText.textContent = 'Your history is a clean slate.';
            emptyImg.src = 'archive_empty_illustration.png';
            document.body.classList.add('archive-mode');
        } else {
            filteredTasks = tasks.filter(t => !t.isArchived);
            emptyText.textContent = 'Your path is clear.';
            emptyImg.src = 'stride_empty_state_illustration_1769710163539.png';
            document.body.classList.remove('archive-mode');
        }

        if (filteredTasks.length === 0) {
            emptyMsg.style.display = 'flex';
        } else {
            emptyMsg.style.display = 'none';
        }

        filteredTasks.forEach(task => {
            const article = document.createElement('article'); // Professional semantic tag
            article.className = 'task-card';
            article.dataset.id = task.id;
            article.dataset.type = 'task';
            article.draggable = true;

            // Accent Color Setup
            let accentColor = 'var(--urgency-none)';
            if (task.urgency === 'high') accentColor = 'var(--urgency-high)';
            if (task.urgency === 'medium') accentColor = 'var(--urgency-medium)';
            if (task.urgency === 'low') accentColor = 'var(--urgency-low)';

            article.style.setProperty('--accent-color', accentColor);
            if (task.completed) article.classList.add('completed');

            // Archive Actions
            if (currentView === 'archive') {
                const archiveActions = document.createElement('div');
                archiveActions.className = 'archive-actions';

                const restoreBtn = document.createElement('button');
                restoreBtn.className = 'archive-btn restore-btn';
                restoreBtn.textContent = 'Restore';
                restoreBtn.onclick = () => { State.updateTask(task.id, { isArchived: false }); renderTasks(); };

                const purgeBtn = document.createElement('button');
                purgeBtn.className = 'archive-btn purge-btn';
                purgeBtn.textContent = 'Purge';
                purgeBtn.onclick = () => { State.deleteTask(task.id); renderTasks(); };

                archiveActions.appendChild(restoreBtn);
                archiveActions.appendChild(purgeBtn);
                article.appendChild(archiveActions);
            }

            article.style.setProperty('--accent-color', accentColor);
            if (task.completed) article.classList.add('completed');

            // Card Header
            const header = document.createElement('header');
            header.className = 'card-header';

            const chip = document.createElement('div');
            chip.className = 'urgency-chip-container custom-dropdown';
            chip.innerHTML = `
                <div class="urgency-chip">${task.urgency === 'none' ? 'Task' : `${task.urgency} priority`}</div>
                ${getPriorityDropdownHTML()}
            `;

            chip.onclick = (e) => showPrioritySelector(task.id, chip, e);

            // Bind local options
            chip.querySelectorAll('.dropdown-option').forEach(opt => {
                opt.onclick = (e) => {
                    e.stopPropagation();
                    const urg = opt.dataset.urg;
                    State.updateTask(task.id, { urgency: urg });
                    chip.classList.remove('active');
                    UI.renderTasks();
                };
            });

            const wrapper = document.createElement('div');
            wrapper.className = 'card-actions-wrapper';

            const actions = document.createElement('div');
            actions.className = 'card-actions';

            const archiveIcon = `<svg viewBox="0 0 24 24"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.01 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.49-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12.14l.82 1H5.12z"/></svg>`;
            const editIcon = `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
            const plusIcon = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`;
            const deleteIcon = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

            actions.innerHTML = `
                <button class="action-btn-small" onclick="UI.handleAddSubTask(${task.id})" data-tooltip="Add Sub-task">${plusIcon}</button>
                <button class="action-btn-small" onclick="UI.handleEditTask(${task.id}, this)" data-tooltip="Edit Task">${editIcon}</button>
                <button class="action-btn-small" onclick="UI.handleArchiveTask(${task.id})" data-tooltip="Archive Task">${archiveIcon}</button>
                <button class="action-btn-small delete-btn" onclick="UI.handleDeleteTask(${task.id})" data-tooltip="Delete Task">${deleteIcon}</button>
            `;

            const dots = document.createElement('div');
            dots.className = 'three-dots-trigger';
            dots.innerHTML = '<span></span><span></span><span></span>';
            dots.onclick = (e) => {
                e.stopPropagation();
                article.classList.toggle('active-actions');
            };

            wrapper.appendChild(actions);
            wrapper.appendChild(dots);
            header.appendChild(chip);
            header.appendChild(wrapper);
            article.appendChild(header);

            // Card Body
            const body = document.createElement('div');
            body.className = 'card-body';

            const titleRow = document.createElement('div');
            titleRow.className = 'title-row';

            const checkbox = document.createElement('div');
            checkbox.className = 'main-checkbox';
            checkbox.style.borderColor = accentColor;
            if (task.completed) {
                checkbox.style.backgroundColor = accentColor;
                checkbox.style.color = '#1E1F25';
                checkbox.innerHTML = '✔';
            }
            checkbox.onclick = () => { State.toggleTask(task.id); renderTasks(); };

            const title = document.createElement('span');
            title.className = 'task-title';
            title.textContent = task.text;
            title.onclick = () => { State.toggleTask(task.id); renderTasks(); };

            titleRow.appendChild(checkbox);
            titleRow.appendChild(title);
            body.appendChild(titleRow);

            // Subtasks List
            if (task.subtasks?.length > 0) {
                const subList = document.createElement('div');
                subList.className = 'subtasks-list';
                task.subtasks.forEach(sub => {
                    const subItem = document.createElement('div');
                    subItem.className = 'subtask-item draggable';
                    subItem.dataset.id = sub.id;
                    subItem.dataset.parentId = task.id;
                    subItem.dataset.type = 'subtask';
                    subItem.draggable = true;
                    if (sub.completed) subItem.classList.add('completed');

                    if (sub.isEditing) {
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.className = 'subtask-input';
                        input.value = sub.text;
                        input.onblur = () => { State.saveSubTask(task.id, sub.id, input.value); renderTasks(); };
                        input.onkeypress = (e) => { if (e.key === 'Enter') input.blur(); };
                        subItem.appendChild(input);
                        setTimeout(() => input.focus(), 0);
                    } else {
                        const chk = document.createElement('div');
                        chk.className = 'subtask-checkbox';
                        chk.innerHTML = sub.completed ? '<p>✔</p>' : '';
                        chk.onclick = () => {
                            const result = State.toggleSubTask(task.id, sub.id);
                            if (result.needsFullRefresh) {
                                renderTasks();
                            } else {
                                UI.updateSurgicalSubTask(task.id, sub.id, result.parentAutoChanged);
                            }
                        };

                        const txt = document.createElement('span');
                        txt.textContent = sub.text;
                        txt.onclick = chk.onclick;

                        const sActions = document.createElement('div');
                        sActions.className = 'subtask-actions';
                        const editIcon = `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
                        const deleteIcon = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
                        sActions.innerHTML = `
                            <button class="subtask-action-btn" onclick="UI.handleEditSubTask(${task.id}, ${sub.id}, this)">${editIcon}</button>
                            <button class="subtask-action-btn" onclick="UI.handleDeleteSubTask(${task.id}, ${sub.id})">${deleteIcon}</button>
                        `;

                        subItem.appendChild(chk);
                        subItem.appendChild(txt);
                        subItem.appendChild(sActions);
                    }
                    subList.appendChild(subItem);
                });
                body.appendChild(subList);
            }
            article.appendChild(body);

            // Card Footer
            const totalSub = task.subtasks?.length || 0;
            const doneSub = task.subtasks?.filter(s => s.completed).length || 0;
            const timeText = timeAgo(task.createdAt);

            if (totalSub > 0) {
                const footer = document.createElement('footer');
                footer.className = 'card-footer';
                footer.innerHTML = `
                    <div class="footer-meta">
                        <span>${doneSub}/${totalSub} completed</span>
                        <span>${timeText}</span>
                    </div>
                `;
                article.appendChild(footer);

                // Embedded Progress Bar
                const pct = Math.round((doneSub / totalSub) * 100);
                const prog = document.createElement('div');
                prog.className = 'embedded-progress';
                prog.innerHTML = `<div class="embedded-progress-fill" style="width: ${pct}%"></div>`;
                article.appendChild(prog);
            } else {
                // Minimal footer for simple tasks
                const footer = document.createElement('footer');
                footer.className = 'card-footer';
                footer.innerHTML = `
                    <div class="footer-meta">
                        <span>${timeText}</span>
                    </div>
                `;
                article.appendChild(footer);
            }

            article.addEventListener('dragstart', handleDragStart);
            article.addEventListener('dragover', handleDragOver);
            article.addEventListener('dragend', handleDragEnd);
            article.addEventListener('drop', handleDrop);

            todoList.appendChild(article);
        });
    };

    const showPrioritySelector = (id, container, e) => {
        e.stopPropagation();
        // Close other dropdowns first
        document.querySelectorAll('.custom-dropdown.active').forEach(d => {
            if (d !== container) d.classList.remove('active');
        });
        container.classList.toggle('active');
    };

    const updateSurgicalSubTask = (parentId, subId, parentChanged) => {
        const task = State.getTasks().find(t => t.id === parentId);
        const sub = task.subtasks.find(s => s.id === subId);
        const taskEl = document.querySelector(`article[data-id="${parentId}"]`);
        const subItem = taskEl?.querySelector(`.subtask-item[data-id="${subId}"]`);

        if (subItem && sub) {
            subItem.classList.toggle('completed', sub.completed);
            subItem.querySelector('.subtask-checkbox').innerHTML = sub.completed ? '<p>✔</p>' : '';
        }

        if (parentChanged && taskEl) {
            taskEl.classList.toggle('completed', task.completed);
            const mainCheckbox = taskEl.querySelector('.main-checkbox');
            if (mainCheckbox) {
                const accentColor = taskEl.style.getPropertyValue('--accent-color');
                if (task.completed) {
                    mainCheckbox.style.backgroundColor = accentColor;
                    mainCheckbox.style.color = '#1E1F25';
                    mainCheckbox.innerHTML = '✔';
                } else {
                    mainCheckbox.style.backgroundColor = 'transparent';
                    mainCheckbox.style.color = 'inherit';
                    mainCheckbox.innerHTML = '';
                }
            }
        }

        updateProgressBarSurgically(parentId);
    };

    const updateProgressBarSurgically = (parentId) => {
        const task = State.getTasks().find(t => t.id === parentId);
        const taskEl = document.querySelector(`article[data-id="${parentId}"]`);
        const progressFill = taskEl?.querySelector('.embedded-progress-fill');
        const footerSpan = taskEl?.querySelector('.footer-meta span:first-child');

        if (task && progressFill && footerSpan) {
            const total = task.subtasks.length;
            const done = task.subtasks.filter(s => s.completed).length;
            const pct = Math.round((done / total) * 100);
            progressFill.style.width = `${pct}%`;
            footerSpan.textContent = `${done}/${total} completed`;
        }
    };

    return {
        renderTasks,
        updateSurgicalSubTask,
        handleAddSubTask: (id) => { State.addSubTask(id); renderTasks(); },
        handleEditTask: (id, btn) => {
            const article = btn.closest('article');
            const titleSpan = article.querySelector('.task-title');
            const originalText = titleSpan.textContent;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'subtask-input';
            input.style.fontSize = '1.1rem';
            input.style.fontWeight = '600';
            input.value = originalText;

            titleSpan.replaceWith(input);
            input.focus();

            const save = () => {
                const val = input.value.trim();
                if (val && val !== originalText) {
                    State.updateTask(id, { text: val });
                }
                renderTasks();
            };

            input.onblur = save;
            input.onkeypress = (e) => { if (e.key === 'Enter') save(); };
            input.onclick = (e) => e.stopPropagation();
        },
        handleArchiveTask: (id) => { State.updateTask(id, { isArchived: true }); renderTasks(); },
        handleDeleteTask: (id) => { State.deleteTask(id); renderTasks(); },
        handleEditSubTask: (parentId, subId, btn) => {
            const subItem = btn.closest('.subtask-item');
            const textSpan = subItem.querySelector('span');
            const originalText = textSpan.textContent;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'subtask-input';
            input.value = originalText;

            textSpan.replaceWith(input);
            input.focus();

            const save = () => {
                const val = input.value.trim();
                if (val && val !== originalText) {
                    State.saveSubTask(parentId, subId, val);
                }
                renderTasks();
            };

            input.onblur = save;
            input.onkeypress = (e) => { if (e.key === 'Enter') save(); };
            input.onclick = (e) => e.stopPropagation();
        },
        handleDeleteSubTask: (pId, sId) => { State.deleteSubTask(pId, sId); renderTasks(); }
    };
})();

// ==========================================================================
// 4. Drag & Drop
// ==========================================================================
let draggedItem = null;
const handleDragStart = function (e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
};
const handleDragOver = (e) => e.preventDefault();
const handleDragEnd = function () { this.classList.remove('dragging'); draggedItem = null; };
const handleDrop = function (e) {
    e.stopPropagation();
    if (!draggedItem || draggedItem === this) return;
    const fromId = Number(draggedItem.dataset.id);
    const toId = Number(this.dataset.id);
    const type = draggedItem.dataset.type;

    if (type === 'task') {
        const tasks = State.getTasks();
        const fromIdx = tasks.findIndex(t => t.id === fromId);
        const toIdx = tasks.findIndex(t => t.id === toId);
        State.reorderTasks(fromIdx, toIdx);
    } else {
        const pId = Number(draggedItem.dataset.parentId);
        const task = State.getTasks().find(t => t.id === pId);
        const fromIdx = task.subtasks.findIndex(s => s.id === fromId);
        const toIdx = task.subtasks.findIndex(s => s.id === toId);
        State.reorderSubTasks(pId, fromIdx, toIdx);
    }
    UI.renderTasks();
};

// ==========================================================================
// 5. Event Listeners & Init
// ==========================================================================
addBtn.onclick = (e) => {
    e.stopPropagation();
    const text = todoInput.value.trim();
    if (!text) return;
    const urgency = urgDropdown.dataset.urgency || 'none';
    State.addTask({ text, urgency });

    // Reset Capsule & Draft
    todoInput.value = '';
    localStorage.removeItem('strideDraft');
    commandCapsule.classList.remove('has-content');
    updateCapsuleIdleState();

    // Close Capsule
    commandCapsule.classList.remove('active');

    // Reset Priority
    urgDropdown.dataset.urgency = 'none';
    activeUrgencyText.textContent = 'Priority';
    activeUrgencyStripe.className = 'urgency-stripe none';

    UI.renderTasks();
};

// Command Capsule Expansion & Draft Logic
const updateCapsuleIdleState = () => {
    const draft = localStorage.getItem('strideDraft');
    if (draft) {
        const snippet = draft.length > 20 ? draft.substring(0, 17) + '...' : draft;
        capsuleDisplayText.textContent = `Draft: ${snippet}`;
    } else {
        capsuleDisplayText.textContent = 'Add Task';
    }
};

commandCapsule.onclick = (e) => {
    // If we're already active, don't do anything (let children handle clicks)
    if (commandCapsule.classList.contains('active')) return;

    commandCapsule.classList.add('active');
    setTimeout(() => todoInput.focus(), 150);
};

todoInput.oninput = () => {
    const val = todoInput.value;
    localStorage.setItem('strideDraft', val);
    commandCapsule.classList.toggle('has-content', val.trim().length > 0);
};

todoInput.onkeypress = (e) => {
    if (e.key === 'Enter') addBtn.click();
};

testSuiteBtn.onclick = () => {
    State.addTask({ text: "Verify STRIDE responsiveness on mobile widths.", urgency: "high" });
    State.addTask({ text: "Test cross-browser compatibility for glassmorphism effects.", urgency: "medium" });
    State.addTask({ text: "Audit keyboard accessibility for custom priority dropdowns.", urgency: "low" });
    UI.renderTasks();
};

// Priority Dropdown Logic (Global & Local)
urgTrigger.onclick = (e) => {
    e.stopPropagation();
    editingTaskId = null;

    // For the capsule dropdown, we use its natural position (absolute)
    // rather than the fixed positioning used for task cards.
    urgOptionsList.style.position = 'absolute';
    urgOptionsList.style.top = 'auto';
    urgOptionsList.style.bottom = 'calc(100% + 12px)';
    urgOptionsList.style.left = '0';
    urgOptionsList.style.width = '150px';

    urgDropdown.classList.toggle('active');
};

urgOptions.forEach(opt => {
    opt.onclick = (e) => {
        e.stopPropagation();
        const urg = opt.dataset.urg;
        const label = opt.querySelector('span').textContent;

        if (editingTaskId) {
            State.updateTask(editingTaskId, { urgency: urg });
            editingTaskId = null;
        } else {
            urgDropdown.dataset.urgency = urg;
            activeUrgencyText.textContent = label;
            activeUrgencyStripe.className = `urgency-stripe ${urg}`;
        }

        urgDropdown.classList.remove('active');
        UI.renderTasks();
    };
});

window.onclick = (e) => {
    // Close capsule if clicking outside
    if (!commandCapsule.contains(e.target)) {
        if (commandCapsule.classList.contains('active')) {
            commandCapsule.classList.remove('active');
            updateCapsuleIdleState();
        }
    }

    // Close any active priority dropdowns
    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown.active').forEach(d => {
            d.classList.remove('active');
        });
    }
};

// Settings Modal Interaction
settingsBtn.onclick = () => settingsModal.classList.add('active');
closeSettings.onclick = () => settingsModal.classList.remove('active');

// Settings Engine Bindings
taskFontSelect.onchange = (e) => updatePreference('taskFont', e.target.value);
subtaskFontSelect.onchange = (e) => updatePreference('subtaskFont', e.target.value);
densitySlider.oninput = (e) => updatePreference('density', parseFloat(e.target.value));
speedSlider.oninput = (e) => {
    const val = parseFloat(e.target.value);
    speedValue.textContent = `${val.toFixed(1)}x`;
    updatePreference('animSpeed', val);
};
motionToggle.onchange = (e) => updatePreference('reducedMotion', e.target.checked);
stealthToggle.onchange = (e) => updatePreference('stealthMode', e.target.checked);
completionActionSelect.onchange = (e) => updatePreference('completionAction', e.target.value);

contrastSegments.forEach(seg => {
    seg.onclick = () => {
        contrastSegments.forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
        updatePreference('contrast', seg.dataset.value);
    };
});

resetDefaultsBtn.onclick = () => resetPreferences();

archiveToggleBtn.onclick = () => {
    currentView = currentView === 'timeline' ? 'archive' : 'timeline';
    archiveToggleBtn.classList.toggle('active', currentView === 'archive');
    UI.renderTasks();
};

// Theme Logic
const setTheme = (theme) => {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
};

themeToggleBtn.onclick = () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    setTheme(isLight ? 'dark' : 'light');
};

const updateThemeIcon = (theme) => {
    iconSun.style.display = theme === 'light' ? 'none' : 'block';
    iconMoon.style.display = theme === 'light' ? 'block' : 'none';
};

// Sync Settings UI with State
const syncSettingsUI = () => {
    taskFontSelect.value = userPreferences.taskFont;
    subtaskFontSelect.value = userPreferences.subtaskFont;
    densitySlider.value = userPreferences.density;
    speedSlider.value = userPreferences.animSpeed;
    speedValue.textContent = `${userPreferences.animSpeed.toFixed(1)}x`;
    motionToggle.checked = userPreferences.reducedMotion;
    stealthToggle.checked = userPreferences.stealthMode;
    completionActionSelect.value = userPreferences.completionAction || 'stay';

    contrastSegments.forEach(seg => {
        if (seg.dataset.value.toLowerCase() === userPreferences.contrast.toLowerCase()) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });
};

// Init
State.loadTasks();
UI.renderTasks();
syncSettingsUI();

// Restore Draft
const savedDraft = localStorage.getItem('strideDraft');
if (savedDraft) {
    todoInput.value = savedDraft;
    commandCapsule.classList.add('has-content');
}
updateCapsuleIdleState();

// Early-load sync
const currentTheme = localStorage.getItem('theme') || 'dark';
setTheme(currentTheme);
