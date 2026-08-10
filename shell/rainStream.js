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

function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
}

function toHex(value) {
    return Math.round(value).toString(16).padStart(2, '0');
}

export class RainColumn {
    constructor(container, x, rowCount, monitorHeight, fontDescription,
        depth, now) {
        this._rowCount = rowCount;
        this._depth = depth;
        this._glyphs = Array.from({length: rowCount}, randomGlyph);
        this._tailLength = randomInteger(
            Math.max(7, Math.floor(rowCount * 0.16)),
            Math.max(9, Math.floor(rowCount * 0.42)));
        this._dropSpacing = randomInteger(
            this._tailLength + 5,
            Math.max(this._tailLength + 7,
                Math.floor(this._tailLength * 2.4)));
        this._headPosition = randomBetween(0, this._dropSpacing);
        this._lastHeadCell = Math.floor(this._headPosition);
        this._speed = randomBetween(1.5, 4.3) * (0.74 + depth * 0.38);
        this._glintOffset = randomInteger(2,
            Math.max(3, this._tailLength - 2));
        this._lastUpdateTime = now;
        this._nextGlyphCycleTime = now + randomBetween(500000, 1600000);

        const baseGreen = 10 + depth * 20;
        this._baseColor = `#01${toHex(baseGreen)}${toHex(5 + depth * 5)}`;
        this._actor = new Clutter.Text({
            editable: false,
            line_alignment: Pango.Alignment.CENTER,
            reactive: false,
            selectable: false,
        });
        this._actor.set_font_description(fontDescription);
        this._actor.set_pivot_point(0.5, 0);
        this._actor.set_x(Math.round(x));
        container.add_child(this._actor);

        this._render();
        const [, naturalHeight] = this._actor.get_preferred_height(-1);
        const horizontalScale = Math.random() < 0.38 ? -1 : 1;
        this._actor.set_scale(horizontalScale, monitorHeight / naturalHeight);
    }

    tick(now) {
        const elapsed = Math.min(0.25,
            Math.max(0, (now - this._lastUpdateTime) / 1000000));
        this._lastUpdateTime = now;
        this._headPosition = positiveModulo(
            this._headPosition + elapsed * this._speed,
            this._dropSpacing);

        const headCell = Math.floor(this._headPosition);
        let needsRender = headCell !== this._lastHeadCell;

        if (needsRender) {
            this._lastHeadCell = headCell;
            const screenHead = positiveModulo(headCell, this._rowCount);
            this._glyphs[screenHead] = randomGlyph();

            if (Math.random() < 0.28)
                this._glyphs[randomInteger(0, this._rowCount - 1)] = randomGlyph();

            if (Math.random() < 0.18) {
                this._glintOffset = randomInteger(2,
                    Math.max(3, this._tailLength - 2));
            }
        }

        if (now >= this._nextGlyphCycleTime) {
            const cycleCount = Math.random() < 0.22 ? 2 : 1;

            for (let index = 0; index < cycleCount; index++)
                this._glyphs[randomInteger(0, this._rowCount - 1)] = randomGlyph();

            this._nextGlyphCycleTime = now + randomBetween(500000, 1600000);
            needsRender = true;
        }

        if (needsRender)
            this._render();
    }

    _render() {
        const cells = this._glyphs.map((glyph, row) => {
            const distance = positiveModulo(
                this._lastHeadCell - row, this._dropSpacing);

            if (distance > this._tailLength)
                return glyph;

            if (distance === 0) {
                const color = this._depth > 0.62 ? '#eaffef' : '#83fda0';
                return `<span foreground="${color}" weight="bold">${glyph}</span>`;
            }

            if (distance === 1)
                return `<span foreground="#a8ffb9" weight="bold">${glyph}</span>`;

            if (distance === this._glintOffset && this._depth > 0.48)
                return `<span foreground="#c5ffd0" alpha="92%" weight="bold">${glyph}</span>`;

            const fade = 1 - distance / (this._tailLength + 1);
            const depthBrightness = 0.42 + this._depth * 0.58;
            const alpha = Math.round(
                Math.max(8, Math.pow(fade, 1.45) * 92 * depthBrightness));
            const color = this._depth > 0.44 ? '#15f35b' : '#0ab842';
            return `<span foreground="${color}" alpha="${alpha}%">${glyph}</span>`;
        });

        this._actor.set_markup(
            `<span foreground="${this._baseColor}">${cells.join('\n')}</span>`);
    }

    destroy() {
        this._glyphs = null;
        this._actor.destroy();
        this._actor = null;
    }
}
