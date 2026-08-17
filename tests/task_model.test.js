import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createTask,
    deleteTask,
    deleteTasksInState,
    migrateLegacyTaskRecords,
    normalizeTaskState,
    normalizeTaskTitle,
    orderTasks,
    setTaskState,
    TaskState,
    taskMenuLabel,
    updateTaskTitle,
} from '../gnome-extension/taskModel.js';

test('task titles are trimmed and blank tasks are rejected', () => {
    assert.equal(normalizeTaskTitle('  Buy milk  '), 'Buy milk');
    assert.equal(createTask('one', '   '), null);
    assert.deepEqual(createTask('one', '  Buy milk  '), {
        id: 'one',
        title: 'Buy milk',
        state: TaskState.UNDONE,
    });
});

test('duplicate titles remain distinct through stable IDs', () => {
    const tasks = [
        createTask('one', 'Call Alex'),
        createTask('two', 'Call Alex'),
    ];

    assert.deepEqual(deleteTask(tasks, 'one'), [tasks[1]]);
});

test('a task can move between all three states without mutating the input', () => {
    const tasks = [
        createTask('one', 'First'),
        createTask('two', 'Second'),
    ];
    const rejected = setTaskState(tasks, 'two', TaskState.REJECTED);
    const done = setTaskState(rejected, 'two', TaskState.DONE);

    assert.equal(tasks[1].state, TaskState.UNDONE);
    assert.equal(rejected[0], tasks[0]);
    assert.deepEqual(rejected[1], {
        ...tasks[1],
        state: TaskState.REJECTED,
    });
    assert.deepEqual(done[1], {...tasks[1], state: TaskState.DONE});
    assert.equal(normalizeTaskState('unknown'), TaskState.UNDONE);
});

test('task titles can be edited without changing identity or state', () => {
    const tasks = [
        {id: 'one', title: 'Old title', state: TaskState.REJECTED},
        createTask('two', 'Other task'),
    ];
    const updated = updateTaskTitle(tasks, 'one', '  New title  ');

    assert.equal(tasks[0].title, 'Old title');
    assert.deepEqual(updated[0], {
        id: 'one',
        title: 'New title',
        state: TaskState.REJECTED,
    });
    assert.equal(updated[1], tasks[1]);
    assert.equal(updateTaskTitle(tasks, 'one', '   '), null);
});

test('tasks can be deleted as a group by state', () => {
    const tasks = [
        {id: 'one', title: 'Done', state: TaskState.DONE},
        createTask('two', 'Still open'),
        {id: 'three', title: 'Rejected', state: TaskState.REJECTED},
    ];

    assert.deepEqual(deleteTasksInState(tasks, TaskState.DONE),
        [tasks[1], tasks[2]]);
    assert.deepEqual(deleteTasksInState(tasks, TaskState.REJECTED),
        [tasks[0], tasks[1]]);
    assert.equal(tasks.length, 3);
});

test('tasks are grouped undone, done, then rejected with stable creation order', () => {
    const tasks = [
        {id: 'one', title: 'Done first', state: TaskState.DONE},
        {id: 'two', title: 'Undone first', state: TaskState.UNDONE},
        {id: 'three', title: 'Rejected', state: TaskState.REJECTED},
        {id: 'four', title: 'Undone second', state: TaskState.UNDONE},
        {id: 'five', title: 'Done second', state: TaskState.DONE},
    ];

    assert.deepEqual(orderTasks(tasks).map(task => task.id),
        ['two', 'four', 'one', 'five', 'three']);
    assert.deepEqual(tasks.map(task => task.id),
        ['one', 'two', 'three', 'four', 'five']);
});

test('legacy completion booleans migrate to undone and done states', () => {
    const migrated = migrateLegacyTaskRecords([
        ['one', 'Open task', false],
        ['two', 'Finished task', true],
    ]);

    assert.deepEqual(migrated, [
        {id: 'one', title: 'Open task', state: TaskState.UNDONE},
        {id: 'two', title: 'Finished task', state: TaskState.DONE},
    ]);
});

test('long menu labels are shortened without changing the stored title', () => {
    const title = '📝'.repeat(60);
    const label = taskMenuLabel(title);

    assert.equal(Array.from(label).length, 48);
    assert.ok(label.endsWith('…'));
    assert.equal(title, '📝'.repeat(60));
});
