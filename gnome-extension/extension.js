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
    orderTasks,
    taskMenuLabel,
    toggleTaskCompletion,
} from './taskModel.js';

const TASKS_KEY = 'tasks';

const NewTaskDialog = GObject.registerClass(
class NewTaskDialog extends ModalDialog.ModalDialog {
    _init(onSubmit) {
        super._init({styleClass: 'toodoo-new-task-dialog'});

        this._onSubmit = onSubmit;

        const content = new Dialog.MessageDialogContent({title: 'New task'});
        this.contentLayout.add_child(content);

        this._entry = new St.Entry({
            accessible_name: 'Task description',
            can_focus: true,
            hint_text: 'What needs doing?',
            style_class: 'toodoo-task-entry',
        });
        content.add_child(this._entry);
        this.setInitialKeyFocus(this._entry.clutter_text);

        content.add_child(new St.Label({
            text: 'Enter to add • Esc to cancel',
            style_class: 'toodoo-dialog-hint',
        }));

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
        this._newTaskDialog?.close();
        this._newTaskDialog = null;

        if (this._settingsSignal)
            this._settings.disconnect(this._settingsSignal);
        this._settingsSignal = 0;
        this._settings = null;

        this._indicator?.destroy();
        this._indicator = null;
    }

    _readTasks() {
        return this._settings.get_value(TASKS_KEY).deep_unpack()
            .map(([id, title, completed]) => ({id, title, completed}));
    }

    _writeTasks(tasks) {
        const records = tasks.map(({id, title, completed}) =>
            [id, title, completed]);
        this._settings.set_value(
            TASKS_KEY,
            new GLib.Variant('a(ssb)', records));
    }

    _syncMenu() {
        if (!this._indicator)
            return;

        this._indicator.menu.removeAll();
        this._indicator.menu.addAction('New task…', () => this._showNewTaskDialog());

        for (const task of orderTasks(this._readTasks()))
            this._indicator.menu.addMenuItem(this._taskMenuItem(task));
    }

    _taskMenuItem(task) {
        const item = new PopupMenu.PopupSubMenuMenuItem(
            taskMenuLabel(task.title), true);
        item.accessible_name = `${task.title}, ${task.completed ? 'completed' : 'not completed'}`;
        item.icon.icon_name = task.completed
            ? 'object-select-symbolic'
            : 'window-close-symbolic';
        item.icon.add_style_class_name(task.completed
            ? 'toodoo-task-completed'
            : 'toodoo-task-open');

        item.menu.addAction(
            task.completed ? 'Mark undone' : 'Mark done',
            () => this._writeTasks(toggleTaskCompletion(this._readTasks(), task.id)),
            task.completed ? 'edit-undo-symbolic' : 'object-select-symbolic');
        item.menu.addAction(
            'Delete',
            () => this._writeTasks(deleteTask(this._readTasks(), task.id)),
            'edit-delete-symbolic');

        return item;
    }

    _showNewTaskDialog() {
        if (this._newTaskDialog)
            return;

        const dialog = new NewTaskDialog(title => this._addTask(title));
        this._newTaskDialog = dialog;
        dialog.connect('destroy', () => {
            if (this._newTaskDialog === dialog)
                this._newTaskDialog = null;
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
}

export function init(metadata) {
    return new ToodooExtension(metadata);
}
