import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {RainColumn} from './rainStream.js';

const UPDATE_INTERVAL = 100;
const MAX_COLUMNS_PER_MONITOR = 180;

class MonitorRain {
    constructor(monitor, fontSize, glowEnabled) {
        this._columns = [];
        this._glowClones = [];
        const backgroundColor = new Cogl.Color();
        backgroundColor.init_from_4f(0, 0.008, 0.003, 0.84);
        this._actor = new Clutter.Actor({
            background_color: backgroundColor,
            clip_to_allocation: true,
            height: monitor.height,
            reactive: false,
            width: monitor.width,
            x: monitor.x,
            y: monitor.y,
        });
        Main.layoutManager._backgroundGroup.add_child(this._actor);
        this._columnsLayer = new Clutter.Actor({
            height: monitor.height,
            reactive: false,
            width: monitor.width,
        });
        this._actor.add_child(this._columnsLayer);

        const fontDescription = Pango.FontDescription.from_string('Monospace');
        fontDescription.set_absolute_size(fontSize * Pango.SCALE);
        const columnSpacing = Math.max(
            fontSize * 0.76, monitor.width / MAX_COLUMNS_PER_MONITOR);
        const columnCount = Math.ceil(monitor.width / columnSpacing);
        const rowCount = Math.ceil(monitor.height / (fontSize * 1.16)) + 1;
        const now = GLib.get_monotonic_time();

        for (let column = 0; column < columnCount; column++) {
            const x = column * columnSpacing + Math.random() * fontSize * 0.12;
            const depth = Math.pow(Math.random(), 0.72);
            this._columns.push(new RainColumn(
                this._columnsLayer,
                x,
                rowCount,
                monitor.height,
                fontDescription,
                depth,
                now
            ));
        }

        this.setGlowEnabled(glowEnabled);
    }

    tick(now) {
        if (!this._actor.is_mapped())
            return;

        for (const column of this._columns)
            column.tick(now);
    }

    setGlowEnabled(enabled) {
        for (const clone of this._glowClones)
            clone.destroy();

        this._glowClones = [];

        if (!enabled)
            return;

        for (const offset of [-0.7, 0.7]) {
            const clone = new Clutter.Clone({
                source: this._columnsLayer,
                height: this._actor.height,
                opacity: 54,
                reactive: false,
                width: this._actor.width,
                x: offset,
                y: offset,
            });
            this._actor.add_child(clone);
            this._actor.set_child_below_sibling(clone, this._columnsLayer);
            this._glowClones.push(clone);
        }
    }

    destroy() {
        this.setGlowEnabled(false);

        for (const column of this._columns)
            column.destroy();

        this._columns = null;
        this._glowClones = null;
        this._columnsLayer.destroy();
        this._columnsLayer = null;
        this._actor.destroy();
        this._actor = null;
    }
}

export class MatrixRain {
    constructor(settings) {
        this._settings = settings;
        this._monitorRains = [];
        this._monitorsChangedId = Main.layoutManager.connect(
            'monitors-changed', () => this._rebuildMonitors());
        this._fontSizeChangedId = this._settings.connect(
            'changed::font-size', () => this._rebuildMonitors());
        this._glowChangedId = this._settings.connect(
            'changed::glow-enabled', () => {
                const enabled = this._settings.get_boolean('glow-enabled');

                for (const monitorRain of this._monitorRains)
                    monitorRain.setGlowEnabled(enabled);
            });
        this._rebuildMonitors();

        this._updateSourceId = GLib.timeout_add(
            GLib.PRIORITY_LOW, UPDATE_INTERVAL, () => {
                const now = GLib.get_monotonic_time();

                for (const monitorRain of this._monitorRains)
                    monitorRain.tick(now);

                return GLib.SOURCE_CONTINUE;
            });
        GLib.Source.set_name_by_id(
            this._updateSourceId, '[matrix-rain] update illumination');
    }

    _rebuildMonitors() {
        for (const monitorRain of this._monitorRains)
            monitorRain.destroy();

        const fontSize = this._settings.get_double('font-size');
        const glowEnabled = this._settings.get_boolean('glow-enabled');
        this._monitorRains = Main.layoutManager.monitors.map(
            monitor => new MonitorRain(monitor, fontSize, glowEnabled));
    }

    destroy() {
        GLib.Source.remove(this._updateSourceId);
        this._updateSourceId = null;

        Main.layoutManager.disconnect(this._monitorsChangedId);
        this._monitorsChangedId = null;

        this._settings.disconnect(this._fontSizeChangedId);
        this._fontSizeChangedId = null;

        this._settings.disconnect(this._glowChangedId);
        this._glowChangedId = null;

        for (const monitorRain of this._monitorRains)
            monitorRain.destroy();

        this._monitorRains = null;
        this._settings = null;
    }
}
