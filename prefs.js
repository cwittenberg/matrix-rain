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
        console.log('[matrix-rain] {"event":"prefs-start","version":12,"settingsSchema":"v2"}');
        window.set_default_size(620, 420);
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

        const glowRow = new Adw.SwitchRow({
            title: 'Phosphor glow',
            subtitle: 'Add a single-pass halo; off uses the least GPU power.',
        });
        group.add(glowRow);
        window._settings.bind(
            'glow-enabled', glowRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        glowRow.connect('notify::active', widget => {
            const value = widget.active;
            const accepted = window._settings.set_boolean(
                'glow-enabled', value);
            console.log(`[matrix-rain] ${JSON.stringify({
                accepted,
                event: 'prefs-write-glow-enabled',
                storedValue: window._settings.get_boolean('glow-enabled'),
                value,
            })}`);
        });
        console.log(`[matrix-rain] ${JSON.stringify({
            event: 'prefs-glow-ready',
            value: window._settings.get_boolean('glow-enabled'),
        })}`);

        const sizeRow = new Adw.ActionRow({
            title: 'Font size',
            subtitle: 'Larger glyphs use fewer columns and fewer compositor resources.',
        });
        group.add(sizeRow);

        const scale = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL, 10, 48, 1);
        scale.valign = Gtk.Align.CENTER;
        scale.hexpand = true;
        scale.set_size_request(280, -1);
        scale.digits = 0;
        scale.draw_value = false;
        sizeRow.add_suffix(scale);
        sizeRow.set_activatable_widget(scale);

        window._settings.bind(
            'font-size', scale, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        scale.connect('value-changed', widget => {
            const value = Math.round(widget.value);
            const accepted = window._settings.set_double('font-size', value);
            console.log(`[matrix-rain] ${JSON.stringify({
                accepted,
                event: 'prefs-write-font-size',
                storedValue: window._settings.get_double('font-size'),
                value,
            })}`);
        });
        console.log(`[matrix-rain] ${JSON.stringify({
            event: 'prefs-font-slider-ready',
            value: window._settings.get_double('font-size'),
            widget: 'Gtk.Scale',
        })}`);

        const glyphScaleRow = new Adw.ActionRow({
            title: 'Glyph scale',
            subtitle: 'Resize each symbol inside its grid cell.',
        });
        group.add(glyphScaleRow);

        const glyphScale = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL, 50, 200, 5);
        glyphScale.valign = Gtk.Align.CENTER;
        glyphScale.hexpand = true;
        glyphScale.set_size_request(280, -1);
        glyphScale.digits = 0;
        glyphScale.draw_value = false;
        glyphScaleRow.add_suffix(glyphScale);
        glyphScaleRow.set_activatable_widget(glyphScale);

        window._settings.bind(
            'glyph-scale', glyphScale, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        glyphScale.connect('value-changed', widget => {
            const value = Math.round(widget.value / 5) * 5;
            const accepted = window._settings.set_double(
                'glyph-scale', value);
            console.log(`[matrix-rain] ${JSON.stringify({
                accepted,
                event: 'prefs-write-glyph-scale',
                storedValue: window._settings.get_double('glyph-scale'),
                value,
            })}`);
        });
        console.log(`[matrix-rain] ${JSON.stringify({
            event: 'prefs-glyph-scale-slider-ready',
            value: window._settings.get_double('glyph-scale'),
            widget: 'Gtk.Scale',
        })}`);

        const opacityRow = new Adw.ActionRow({
            title: 'Transparency',
            subtitle: 'Lower this for a subtle effect over the desktop.',
        });
        group.add(opacityRow);

        const opacityScale = Gtk.Scale.new_with_range(
            Gtk.Orientation.HORIZONTAL, 10, 100, 5);
        opacityScale.valign = Gtk.Align.CENTER;
        opacityScale.hexpand = true;
        opacityScale.set_size_request(280, -1);
        opacityScale.digits = 0;
        opacityScale.draw_value = false;
        opacityRow.add_suffix(opacityScale);
        opacityRow.set_activatable_widget(opacityScale);

        window._settings.bind(
            'effect-opacity', opacityScale, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        opacityScale.connect('value-changed', widget => {
            const value = Math.round(widget.value / 5) * 5;
            const accepted = window._settings.set_double(
                'effect-opacity', value);
            console.log(`[matrix-rain] ${JSON.stringify({
                accepted,
                event: 'prefs-write-effect-opacity',
                storedValue: window._settings.get_double('effect-opacity'),
                value,
            })}`);
        });
        console.log(`[matrix-rain] ${JSON.stringify({
            event: 'prefs-opacity-slider-ready',
            value: window._settings.get_double('effect-opacity'),
            widget: 'Gtk.Scale',
        })}`);
        console.log('[matrix-rain] {"event":"prefs-complete","version":12}');
    }
}
