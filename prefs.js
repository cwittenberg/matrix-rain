// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.
// SPDX-License-Identifier: GPL-2.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MatrixRainPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(620, 260);
        window._settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'Appearance',
            icon_name: 'preferences-desktop-appearance-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Code Rain',
            description: 'Tune the rain for your display setup.',
        });
        page.add(group);

        const sizeRow = new Adw.ActionRow({
            title: 'Font size',
            subtitle: 'Larger glyphs use fewer streams and fewer compositor resources.',
        });
        group.add(sizeRow);

        const scale = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL, 10, 48, 1);
        scale.set_valign(Gtk.Align.CENTER);
        scale.set_hexpand(true);
        scale.set_size_request(280, -1);
        scale.set_digits(0);
        scale.set_draw_value(true);
        scale.set_value_pos(Gtk.PositionType.RIGHT);
        scale.add_mark(18, Gtk.PositionType.BOTTOM, null);
        scale.add_mark(32, Gtk.PositionType.BOTTOM, null);
        sizeRow.add_suffix(scale);
        sizeRow.set_activatable_widget(scale);

        window._settings.bind(
            'font-size', scale.get_adjustment(), 'value',
            Gio.SettingsBindFlags.DEFAULT);
    }
}
