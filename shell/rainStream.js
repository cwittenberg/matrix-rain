import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

const GLYPHS = [...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ'];

function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
}

function randomInteger(minimum, maximum) {
    return Math.floor(randomBetween(minimum, maximum + 1));
}

function randomGlyph() {
    return GLYPHS[randomInteger(0, GLYPHS.length - 1)];
}

function createMarkup(length) {
    const glyphs = [];

    for (let index = 0; index < length; index++) {
        const distanceFromHead = length - index - 1;

        if (distanceFromHead === 0) {
            glyphs.push(`<span foreground="#eaffee">${randomGlyph()}</span>`);
        } else if (distanceFromHead === 1) {
            glyphs.push(`<span foreground="#a6ffb5">${randomGlyph()}</span>`);
        } else {
            const progress = (index + 1) / length;
            const alpha = Math.round(12 + progress * 76);
            glyphs.push(`<span foreground="#20ee62" alpha="${alpha}%">${randomGlyph()}</span>`);
        }
    }

    return glyphs.join('\n');
}

export class RainStream {
    constructor(container, x, monitorHeight, fontDescription, fontSize) {
        this._monitorHeight = monitorHeight;
        this._fontSize = fontSize;
        this._actor = new Clutter.Text({
            editable: false,
            line_alignment: Pango.Alignment.CENTER,
            reactive: false,
            selectable: false,
        });
        this._actor.set_font_description(fontDescription);
        this._actor.set_x(Math.round(x));
        container.add_child(this._actor);

        this._restart(true);
    }

    _restart(distributeAcrossMonitor) {
        const maximumLength = Math.min(32,
            Math.max(12, Math.floor(this._monitorHeight / this._fontSize * 0.34)));
        const length = randomInteger(7, maximumLength);
        this._actor.set_markup(createMarkup(length));

        const [, naturalHeight] = this._actor.get_preferred_height(-1);
        const startY = distributeAcrossMonitor
            ? randomBetween(-naturalHeight, this._monitorHeight)
            : -naturalHeight - randomBetween(0, this._monitorHeight * 0.32);
        const endY = this._monitorHeight + randomBetween(0, this._fontSize * 8);
        const speed = this._fontSize * randomBetween(2.8, 5.6);
        const duration = Math.max(1000, (endY - startY) / speed * 1000);

        this._actor.set_y(Math.round(startY));
        this._actor.ease({
            y: Math.round(endY),
            duration: Math.round(duration),
            mode: Clutter.AnimationMode.LINEAR,
            animationRequired: true,
            onComplete: () => this._restart(false),
        });
    }

    destroy() {
        this._actor.remove_all_transitions();
        this._actor.destroy();
        this._actor = null;
    }
}
