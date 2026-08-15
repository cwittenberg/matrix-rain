import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

export function notifyRendererFailure(error) {
    if (error.matrixRainUserNotified)
        return;

    error.matrixRainUserNotified = true;
    console.error(`[matrix-rain] renderer failed: ${error.message}`);
    //due to shader use (for efficiency) the PC must have a video card, preferably a gpu.
    //running this on cpu is wasteful, so disabled.
    Main.notifyError(
        _('Matrix Code could not start'),
        _('GNOME could not create the required OpenGL effect. This is likely because your system has no GPU or lacks the required OpenGL support.'));
}
