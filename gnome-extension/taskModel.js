const TASK_LABEL_LIMIT = 48;

export function normalizeTaskTitle(value) {
    return String(value ?? '').trim();
}

export function createTask(id, title) {
    const normalizedTitle = normalizeTaskTitle(title);
    if (!normalizedTitle)
        return null;

    return {id, title: normalizedTitle, completed: false};
}

export function toggleTaskCompletion(tasks, id) {
    return tasks.map(task => task.id === id
        ? {...task, completed: !task.completed}
        : task);
}

export function deleteTask(tasks, id) {
    return tasks.filter(task => task.id !== id);
}

export function orderTasks(tasks) {
    return [
        ...tasks.filter(task => !task.completed),
        ...tasks.filter(task => task.completed),
    ];
}

export function taskMenuLabel(title) {
    const characters = Array.from(title);
    if (characters.length <= TASK_LABEL_LIMIT)
        return title;

    return `${characters.slice(0, TASK_LABEL_LIMIT - 1).join('').trimEnd()}…`;
}
