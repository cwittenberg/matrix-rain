/**
 * Each monitor (well, in case of multiple monitors) gets a series of clipped streams of independently "falling" code.
 * Inspired by the movie The Matrix ('99) and the original matrix screensaver from back in the day.
 * Shader code is used to render the effect for its efficiency, so a GPU is required.
 */

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {notifyRendererFailure} from './shell/errorNotification.js';
import {MatrixRain} from './shell/matrixRain.js';

export default class MatrixRainExtension extends Extension {
    enable() {
        console.log('[matrix-rain] {"event":"extension-enable"}');
        this._settings = this.getSettings();
        try {
            this._matrixRain = new MatrixRain(this._settings, this.path);
        } catch (error) {
            notifyRendererFailure(error);
            this._matrixRain = null;
        }
    }

    disable() {
        console.log('[matrix-rain] {"event":"extension-disable"}');
        if (this._matrixRain)
            this._matrixRain.destroy();
        this._matrixRain = null;
        this._settings = null;
    }
}
