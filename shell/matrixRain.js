import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {RainStream} from './rainStream.js';

class MonitorRain {
    constructor(monitor, fontSize) {
        this._streams = [];
        const backgroundColor = new Cogl.Color();
        backgroundColor.init_from_4f(0, 0.02, 0.008, 0.32);
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

        const fontDescription = Pango.FontDescription.from_string('Monospace');
        fontDescription.set_absolute_size(fontSize * Pango.SCALE);
        const columnSpacing = fontSize * 1.35;
        const columnCount = Math.ceil(monitor.width / columnSpacing);

        for (let column = 0; column < columnCount; column++) {
            const x = column * columnSpacing + Math.random() * fontSize * 0.3;
            this._streams.push(new RainStream(
                this._actor,
                x,
                monitor.height,
                fontDescription,
                fontSize
            ));
        }
    }

    destroy() {
        for (const stream of this._streams)
            stream.destroy();

        this._streams = null;
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
        this._rebuildMonitors();
    }

    _rebuildMonitors() {
        for (const monitorRain of this._monitorRains)
            monitorRain.destroy();

        const fontSize = this._settings.get_double('font-size');
        this._monitorRains = Main.layoutManager.monitors.map(
            monitor => new MonitorRain(monitor, fontSize));
    }

    destroy() {
        Main.layoutManager.disconnect(this._monitorsChangedId);
        this._monitorsChangedId = null;

        this._settings.disconnect(this._fontSizeChangedId);
        this._fontSizeChangedId = null;

        for (const monitorRain of this._monitorRains)
            monitorRain.destroy();

        this._monitorRains = null;
        this._settings = null;
    }
}
