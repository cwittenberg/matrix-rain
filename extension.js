// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.
// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * Each monitor gets a series of clipped streams of independently "falling" code (streams)
 * Inspired by the movie The Matrix (1999) and the original matrix screensaver.
 */
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {MatrixRain} from './shell/matrixRain.js';

export default class MatrixRainExtension extends Extension {
    enable() {
        console.log('[matrix-rain] {"event":"extension-enable","version":12,"settingsSchema":"v2"}');
        this._settings = this.getSettings();
        this._matrixRain = new MatrixRain(this._settings, this.path);
    }

    disable() {
        console.log('[matrix-rain] {"event":"extension-disable","version":12}');
        this._matrixRain.destroy();
        this._matrixRain = null;
        this._settings = null;
    }
}
