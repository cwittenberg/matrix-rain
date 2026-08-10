/**
 * Each monitor gets a series of clipped streams of independently "falling" code (streams)
 * Inspired by the movie The Matrix (1999) and the original matrix screensaver.
 */
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {MatrixRain} from './shell/matrixRain.js';

export default class MatrixRainExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._matrixRain = new MatrixRain(this._settings);
    }

    disable() {
        this._matrixRain.destroy();
        this._matrixRain = null;
        this._settings = null;
    }
}
