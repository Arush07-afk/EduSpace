// State Management & LocalStorage Initialization
let tasks = JSON.parse(localStorage.getItem('eduspire_tasks')) || [
    { id: 1, title: 'Complete Calculus Assignment', subject: 'Mathematics', priority: 'High', date: '2026-10-15', completed: false },
    { id: 2, title: 'Read Chapter 4 Physics Text', subject: 'Physics', priority: 'Medium', date: '2026-10-16', completed: true },
    { id: 3, title: 'Write Literature Essay Outline', subject: 'English', priority: 'Low', date: '2026-10-18', completed: false }
];

let studySessions = JSON.parse(localStorage.getItem('eduspire_sessions')) || {
    '2026-10-15': [
        { id: 1, time: '09:00 AM - 11:00 AM', topic: 'Calculus Problem Solving' },
        { id: 2, time: '02:00 PM - 04:00 PM', topic: 'Physics Lab Report' }
    ],
    '2026-10-16': [
        { id: 3, time: '10:00 AM - 12:00 PM', topic: 'Quantum Physics Review' }
    ]
};

let currentSelectedDate = '2026-10-15';
let chartsInstance = {};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeToggle();
    initTaskManager();
    initCalendar();
    renderAll();
});

// Navigation logic between pages
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            item.classList.add('active');
            const pageId = item.getAttribute('data-page');
            document.getElementById(`page-${pageId}`).classList.add('active');
            pageTitle.innerText = item.innerText.trim();

            if (pageId === 'analytics') {
                renderCharts();
            }
        });
    });
}

// Dark/Light Theme Toggle
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const htmlElem = document.documentElement;

    const savedTheme = localStorage.getItem('eduspire_theme') || 'light';
    htmlElem.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlElem.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlElem.setAttribute('data-theme', newTheme);
        localStorage.setItem('eduspire_theme', newTheme);
        updateThemeButton(newTheme);
    });
}

function updateThemeButton(theme) {
    const themeBtn = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        themeBtn.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
    } else {
        themeBtn.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
    }
}

// Task Management & CRUD
function initTaskManager() {
    const modal = document.getElementById('task-modal');
    const openBtn = document.getElementById('open-task-modal');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('task-form');
    const statusFilter = document.getElementById('filter-status');
    const priorityFilter = document.getElementById('filter-priority');

    openBtn.addEventListener('click', () => {
        document.getElementById('modal-title').innerText = 'Add New Task';
        document.getElementById('task-id').value = '';
        form.reset();
        modal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('show'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title-input').value;
        const subject = document.getElementById('task-subject-input').value;
        const priority = document.getElementById('task-priority-input').value;
        const date = document.getElementById('task-date-input').value;

        if (id) {
            // Edit task
            tasks = tasks.map(t => t.id == id ? { ...t, title, subject, priority, date } : t);
        } else {
            // Add task
            const newTask = { id: Date.now(), title, subject, priority, date, completed: false };
            tasks.push(newTask);
        }

        saveAndRender();
        modal.classList.remove('show');
    });

    statusFilter.addEventListener('change', renderTasks);
    priorityFilter.addEventListener('change', renderTasks);
}

function saveAndRender() {
    localStorage.setItem('eduspire_tasks', JSON.stringify(tasks));
    renderAll();
}

function renderAll() {
    renderStats();
    renderTasks();
    renderDashboardPreview();
}

function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-progress').innerText = `${progress}%`;
}

function renderTasks() {
    const tbody = document.getElementById('task-table-body');
    const statusVal = document.getElementById('filter-status').value;
    const priorityVal = document.getElementById('filter-priority').value;

    let filtered = tasks.filter(t => {
        if (statusVal === 'pending' && t.completed) return false;
        if (statusVal === 'completed' && !t.completed) return false;
        if (priorityVal !== 'all' && t.priority !== priorityVal) return false;
        return true;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No tasks found.</td></tr>`;
        return;
    }

    filtered.forEach(task => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})"></td>
            <td style="${task.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${task.title}</td>
            <td>${task.subject}</td>
            <td><span class="badge ${task.priority}">${task.priority}</span></td>
            <td>${task.date}</td>
            <td>
                <div class="action-btns">
                    <button onclick="editTask(${task.id})"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRender();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('modal-title').innerText = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-subject-input').value = task.subject;
    document.getElementById('task-priority-input').value = task.priority;
    document.getElementById('task-date-input').value = task.date;

    document.getElementById('task-modal').classList.add('show');
}

function renderDashboardPreview() {
    const container = document.getElementById('dashboard-task-preview');
    container.innerHTML = '';
    const recent = tasks.slice(0, 4);

    if (recent.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">No tasks available.</p>`;
        return;
    }

    recent.forEach(t => {
        const div = document.createElement('div');
        div.className = 'session-item';
        div.innerHTML = `<strong>${t.title}</strong><p style="font-size:0.8rem; color:var(--text-muted);">${t.subject} • Due: ${t.date}</p>`;
        container.appendChild(div);
    });
}

// Calendar & Planner
function initCalendar() {
    renderCalendarGrid();
    renderStudySessions(currentSelectedDate);
    initSessionModal();
}

function initSessionModal() {
    const modal = document.getElementById('session-modal');
    const openBtn = document.getElementById('open-session-modal');
    const closeBtn = document.getElementById('close-session-modal');
    const form = document.getElementById('session-form');

    openBtn.addEventListener('click', () => {
        form.reset();
        modal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('show'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const time = document.getElementById('session-time-input').value;
        const topic = document.getElementById('session-topic-input').value;

        if (!studySessions[currentSelectedDate]) {
            studySessions[currentSelectedDate] = [];
        }

        studySessions[currentSelectedDate].push({ id: Date.now(), time, topic });
        localStorage.setItem('eduspire_sessions', JSON.stringify(studySessions));

        renderStudySessions(currentSelectedDate);
        modal.classList.remove('show');
    });
}

function deleteSession(id) {
    if (!studySessions[currentSelectedDate]) return;
    studySessions[currentSelectedDate] = studySessions[currentSelectedDate].filter(s => s.id !== id);
    localStorage.setItem('eduspire_sessions', JSON.stringify(studySessions));
    renderStudySessions(currentSelectedDate);
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = '';

    const daysHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    daysHeaders.forEach(d => {
        const h = document.createElement('div');
        h.className = 'cal-day-header';
        h.innerText = d;
        grid.appendChild(h);
    });

    // Simple October 2026 representation generator
    for (let i = 1; i <= 31; i++) {
        const cell = document.createElement('div');
        const dayStr = `2026-10-${i < 10 ? '0' + i : i}`;
        cell.className = `cal-cell ${dayStr === currentSelectedDate ? 'active-date' : ''}`;
        cell.innerText = i;
        cell.addEventListener('click', () => {
            currentSelectedDate = dayStr;
            renderCalendarGrid();
            renderStudySessions(dayStr);
        });
        grid.appendChild(cell);
    }
}

function renderStudySessions(dateStr) {
    document.getElementById('selected-date-title').innerText = `Study Sessions (${dateStr})`;
    const list = document.getElementById('study-sessions-list');
    list.innerHTML = '';

    const sessions = studySessions[dateStr] || [];
    if (sessions.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted);">No scheduled sessions for this date.</p>`;
        return;
    }

    sessions.forEach(s => {
        const div = document.createElement('div');
        div.className = 'session-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div>
                <strong>${s.topic}</strong>
                <p style="font-size:0.85rem; color: var(--text-muted);">${s.time}</p>
            </div>
            <button onclick="deleteSession(${s.id})" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        `;
        list.appendChild(div);
    });
}

// Charts Initialization
function renderCharts() {
    // Small timeout ensures the DOM section is fully visible before initializing canvas dimensions
    setTimeout(() => {
        // Priority Chart
        const priorityCanvas = document.getElementById('priorityChart');
        if (priorityCanvas) {
            const priorityCtx = priorityCanvas.getContext('2d');
            const highCount = tasks.filter(t => t.priority === 'High').length;
            const medCount = tasks.filter(t => t.priority === 'Medium').length;
            const lowCount = tasks.filter(t => t.priority === 'Low').length;

            if (chartsInstance.priority) chartsInstance.priority.destroy();
            chartsInstance.priority = new Chart(priorityCtx, {
                type: 'doughnut',
                data: {
                    labels: ['High', 'Medium', 'Low'],
                    datasets: [{ data: [highCount, medCount, lowCount], backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'] }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Weekly Chart
        const weeklyCanvas = document.getElementById('weeklyChart');
        if (weeklyCanvas) {
            const weeklyCtx = weeklyCanvas.getContext('2d');
            if (chartsInstance.weekly) chartsInstance.weekly.destroy();
            chartsInstance.weekly = new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{ label: 'Hours Studied', data: [3, 5, 4, 6, 2, 4, 3], backgroundColor: '#6366f1' }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Dashboard Hours Chart
        const dashCanvas = document.getElementById('dashboardChart');
        if (dashCanvas) {
            const dashCtx = dashCanvas.getContext('2d');
            if (chartsInstance.dash) chartsInstance.dash.destroy();
            chartsInstance.dash = new Chart(dashCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{ label: 'Hours', data: [12, 19, 15, 22], borderColor: '#3b82f6', tension: 0.3 }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }, 50);
}