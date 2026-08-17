import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createTask,
    deleteTask,
    normalizeTaskTitle,
    orderTasks,
    taskMenuLabel,
    toggleTaskCompletion,
} from '../gnome-extension/taskModel.js';

test('task titles are trimmed and blank tasks are rejected', () => {
    assert.equal(normalizeTaskTitle('  Buy milk  '), 'Buy milk');
    assert.equal(createTask('one', '   '), null);
    assert.deepEqual(createTask('one', '  Buy milk  '), {
        id: 'one',
        title: 'Buy milk',
        completed: false,
    });
});

test('duplicate titles remain distinct through stable IDs', () => {
    const tasks = [
        createTask('one', 'Call Alex'),
        createTask('two', 'Call Alex'),
    ];

    assert.deepEqual(deleteTask(tasks, 'one'), [tasks[1]]);
});

test('completion toggles only the selected task without mutating the input', () => {
    const tasks = [
        createTask('one', 'First'),
        createTask('two', 'Second'),
    ];
    const toggled = toggleTaskCompletion(tasks, 'two');

    assert.equal(tasks[1].completed, false);
    assert.equal(toggled[0], tasks[0]);
    assert.deepEqual(toggled[1], {...tasks[1], completed: true});
});

test('unfinished tasks come first with stable creation order in each group', () => {
    const tasks = [
        {id: 'one', title: 'Done first', completed: true},
        {id: 'two', title: 'Open first', completed: false},
        {id: 'three', title: 'Done second', completed: true},
        {id: 'four', title: 'Open second', completed: false},
    ];

    assert.deepEqual(orderTasks(tasks).map(task => task.id),
        ['two', 'four', 'one', 'three']);
    assert.deepEqual(tasks.map(task => task.id),
        ['one', 'two', 'three', 'four']);
});

test('long menu labels are shortened without changing the stored title', () => {
    const title = '📝'.repeat(60);
    const label = taskMenuLabel(title);

    assert.equal(Array.from(label).length, 48);
    assert.ok(label.endsWith('…'));
    assert.equal(title, '📝'.repeat(60));
});
