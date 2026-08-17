const TASK_LABEL_LIMIT = 48;

export const TaskState = Object.freeze({
    REJECTED: 'rejected',
    UNDONE: 'undone',
    DONE: 'done',
});

export function normalizeTaskTitle(value) {
    return String(value ?? '').trim();
}

export function normalizeTaskState(value) {
    return Object.values(TaskState).includes(value)
        ? value
        : TaskState.UNDONE;
}

export function createTask(id, title) {
    const normalizedTitle = normalizeTaskTitle(title);
    if (!normalizedTitle)
        return null;

    return {id, title: normalizedTitle, state: TaskState.UNDONE};
}

export function setTaskState(tasks, id, state) {
    const normalizedState = normalizeTaskState(state);
    return tasks.map(task => task.id === id
        ? {...task, state: normalizedState}
        : task);
}

export function updateTaskTitle(tasks, id, title) {
    const normalizedTitle = normalizeTaskTitle(title);
    if (!normalizedTitle)
        return null;

    return tasks.map(task => task.id === id
        ? {...task, title: normalizedTitle}
        : task);
}

export function deleteTask(tasks, id) {
    return tasks.filter(task => task.id !== id);
}

export function deleteTasksInState(tasks, state) {
    return tasks.filter(task => task.state !== state);
}

export function migrateLegacyTaskRecords(records) {
    return records.map(([id, title, completed]) => ({
        id,
        title,
        state: completed ? TaskState.DONE : TaskState.UNDONE,
    }));
}

export function orderTasks(tasks) {
    return [
        ...tasks.filter(task => task.state === TaskState.UNDONE),
        ...tasks.filter(task => task.state === TaskState.DONE),
        ...tasks.filter(task => task.state === TaskState.REJECTED),
    ];
}

export function taskMenuLabel(title) {
    const characters = Array.from(title);
    if (characters.length <= TASK_LABEL_LIMIT)
        return title;

    return `${characters.slice(0, TASK_LABEL_LIMIT - 1).join('').trimEnd()}…`;
}
