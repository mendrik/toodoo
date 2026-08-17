import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Dialog from 'resource:///org/gnome/shell/ui/dialog.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {
    createTask,
    deleteTask,
    deleteTasksInState,
    migrateLegacyTaskRecords,
    normalizeTaskState,
    orderTasks,
    setTaskState,
    TaskState,
    taskMenuLabel,
    updateTaskTitle,
} from './taskModel.js';

const TASKS_KEY = 'tasks-v2';
const LEGACY_TASKS_KEY = 'tasks';

const TASK_STATE_PRESENTATION = Object.freeze({
    [TaskState.REJECTED]: {
        label: 'Rejected',
        iconName: 'window-close-symbolic',
        styleClass: 'toodoo-task-rejected',
    },
    [TaskState.UNDONE]: {
        label: 'Undone',
        symbol: '•',
    },
    [TaskState.DONE]: {
        label: 'Done',
        iconName: 'object-select-symbolic',
        styleClass: 'toodoo-task-done',
    },
});

const TASK_STATE_CHOICES = [
    TaskState.REJECTED,
    TaskState.UNDONE,
    TaskState.DONE,
];

function createTaskStateIcon(presentation) {
    if (presentation.symbol) {
        const icon = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
            style_class: 'popup-menu-icon toodoo-task-state-icon',
            y_align: Clutter.ActorAlign.CENTER,
        });
        icon.add_child(new St.Label({
            text: presentation.symbol,
            style_class: 'toodoo-task-undone-symbol',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        }));
        return icon;
    }

    const icon = new St.Icon({
        icon_name: presentation.iconName,
        style_class: 'popup-menu-icon toodoo-task-state-icon',
        y_align: Clutter.ActorAlign.CENTER,
    });
    if (presentation.styleClass)
        icon.add_style_class_name(presentation.styleClass);
    return icon;
}

const TaskSubMenuMenuItem = GObject.registerClass(
class TaskSubMenuMenuItem extends PopupMenu.PopupSubMenuMenuItem {
    _init(text, icon) {
        super._init(text, false);

        this.icon = icon;
        this.add_child(this.icon);
        this.set_child_below_sibling(this.icon, this.label);
    }

    setSubmenuShown(open) {
        // GNOME Shell resets an animated submenu to its natural height after
        // expanding, which can produce a visible snap with fractional scaling.
        if (open)
            this.menu.open(false);
        else
            this.menu.close(false);
    }
});

const TaskDialog = GObject.registerClass(
class TaskDialog extends ModalDialog.ModalDialog {
    _init({title, initialText = '', submitHint, onSubmit}) {
        super._init({styleClass: 'toodoo-task-dialog'});

        this._onSubmit = onSubmit;

        const content = new Dialog.MessageDialogContent({title});
        this.contentLayout.add_child(content);

        this._entry = new St.Entry({
            accessible_name: 'Task description',
            can_focus: true,
            hint_text: 'What needs doing?',
            style_class: 'toodoo-task-entry',
        });
        this._entry.set_text(initialText);
        const fields = new St.BoxLayout({
            vertical: true,
            style_class: 'toodoo-task-fields',
        });
        fields.add_child(this._entry);
        fields.add_child(new St.Label({
            text: `${submitHint} • Esc to cancel`,
            style_class: 'toodoo-dialog-hint',
        }));
        content.add_child(fields);
        this.setInitialKeyFocus(this._entry.clutter_text);

        this._entry.clutter_text.connect('activate', () => {
            if (this._onSubmit(this._entry.get_text()))
                this.close();
        });
        this._entry.clutter_text.connect('key-press-event', (_text, event) => {
            if (event.get_key_symbol() !== Clutter.KEY_Escape)
                return Clutter.EVENT_PROPAGATE;

            this.close();
            return Clutter.EVENT_STOP;
        });
    }
});

export default class ToodooExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._migrateLegacyTasks();
        this._settingsSignal = this._settings.connect(
            `changed::${TASKS_KEY}`,
            () => this._syncMenu());

        this._indicator = new PanelMenu.Button(0.0, 'Toodoo', false);
        this._indicator.add_child(new St.Icon({
            icon_name: 'view-list-symbolic',
            style_class: 'system-status-icon',
        }));
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'right');

        this._syncMenu();
    }

    disable() {
        this._taskDialog?.close();
        this._taskDialog = null;

        if (this._settingsSignal)
            this._settings.disconnect(this._settingsSignal);
        this._settingsSignal = 0;
        this._settings = null;

        this._indicator?.destroy();
        this._indicator = null;
    }

    _readTasks() {
        return this._settings.get_value(TASKS_KEY).deep_unpack()
            .map(([id, title, state]) => ({
                id,
                title,
                state: normalizeTaskState(state),
            }));
    }

    _writeTasks(tasks) {
        const records = tasks.map(({id, title, state}) =>
            [id, title, state]);
        this._settings.set_value(
            TASKS_KEY,
            new GLib.Variant('a(sss)', records));
    }

    _migrateLegacyTasks() {
        const legacyRecords = this._settings
            .get_value(LEGACY_TASKS_KEY).deep_unpack();
        if (legacyRecords.length === 0)
            return;

        const currentRecords = this._settings.get_value(TASKS_KEY).deep_unpack();
        if (currentRecords.length === 0)
            this._writeTasks(migrateLegacyTaskRecords(legacyRecords));

        this._settings.reset(LEGACY_TASKS_KEY);
    }

    _syncMenu() {
        if (!this._indicator)
            return;

        this._indicator.menu.removeAll();
        this._indicator.menu.addAction('New task…', () => this._showNewTaskDialog());

        const tasks = this._readTasks();
        this._indicator.menu.addMenuItem(this._tasksMenuItem(tasks));

        for (const task of orderTasks(tasks))
            this._indicator.menu.addMenuItem(this._taskMenuItem(task));
    }

    _tasksMenuItem(tasks) {
        const item = new PopupMenu.PopupSubMenuMenuItem('Tasks', false);
        item.menu.addMenuItem(this._deleteTasksInStateItem(
            'Delete completed', tasks, TaskState.DONE));
        item.menu.addMenuItem(this._deleteTasksInStateItem(
            'Delete rejected', tasks, TaskState.REJECTED));

        const deleteAllItem = new PopupMenu.PopupImageMenuItem(
            'Delete all', 'edit-delete-symbolic');
        deleteAllItem.connect('activate', () => this._writeTasks([]));
        deleteAllItem.setSensitive(tasks.length > 0);
        item.menu.addMenuItem(deleteAllItem);

        return item;
    }

    _deleteTasksInStateItem(label, tasks, state) {
        const item = new PopupMenu.PopupImageMenuItem(
            label, 'edit-delete-symbolic');
        item.connect('activate', () =>
            this._writeTasks(deleteTasksInState(this._readTasks(), state)));
        item.setSensitive(tasks.some(task => task.state === state));
        return item;
    }

    _taskMenuItem(task) {
        const presentation = TASK_STATE_PRESENTATION[task.state];
        const item = new TaskSubMenuMenuItem(
            taskMenuLabel(task.title), createTaskStateIcon(presentation));
        item.accessible_name = `${task.title}, ${presentation.label.toLowerCase()}`;

        for (const state of TASK_STATE_CHOICES)
            this._addTaskStateAction(item.menu, task, state);

        item.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        item.menu.addAction(
            'Edit…',
            () => this._showEditTaskDialog(task),
            'document-edit-symbolic');
        item.menu.addAction(
            'Delete',
            () => this._writeTasks(deleteTask(this._readTasks(), task.id)),
            'edit-delete-symbolic');

        return item;
    }

    _addTaskStateAction(menu, task, state) {
        const action = new PopupMenu.PopupMenuItem(
            TASK_STATE_PRESENTATION[state].label);
        action.setOrnament(task.state === state
            ? PopupMenu.Ornament.DOT
            : PopupMenu.Ornament.NO_DOT);
        action.connect('activate', () => {
            if (task.state === state)
                return;

            this._writeTasks(setTaskState(this._readTasks(), task.id, state));
        });
        menu.addMenuItem(action);
    }

    _showNewTaskDialog() {
        this._showTaskDialog({
            title: 'New task',
            submitHint: 'Enter to add',
            onSubmit: title => this._addTask(title),
        });
    }

    _showEditTaskDialog(task) {
        this._showTaskDialog({
            title: 'Edit task',
            initialText: task.title,
            submitHint: 'Enter to save',
            onSubmit: title => this._updateTaskTitle(task.id, title),
        });
    }

    _showTaskDialog(options) {
        if (this._taskDialog)
            return;

        // Settle both top-level and nested menu activation before GNOME Shell
        // measures and centers the modal dialog.
        this._indicator.menu.close(false);

        const dialog = new TaskDialog(options);
        this._taskDialog = dialog;
        dialog.connect('destroy', () => {
            if (this._taskDialog === dialog)
                this._taskDialog = null;
        });

        if (!dialog.open())
            dialog.destroy();
    }

    _addTask(title) {
        const task = createTask(GLib.uuid_string_random(), title);
        if (!task)
            return false;

        this._writeTasks([...this._readTasks(), task]);
        return true;
    }

    _updateTaskTitle(id, title) {
        const tasks = updateTaskTitle(this._readTasks(), id, title);
        if (!tasks)
            return false;

        this._writeTasks(tasks);
        return true;
    }
}

export function init(metadata) {
    return new ToodooExtension(metadata);
}
