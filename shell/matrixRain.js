import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import GdkPixbuf from 'gi://GdkPixbuf';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const FRAME_INTERVAL_MS = 33;
const GLYPH_ATLAS_COLUMNS = 8;
const GLYPH_ATLAS_ROWS = 8;
const GLYPH_ATLAS_SIZE = 512;
const GLYPH_SEQUENCE_LENGTH = 57;
const HEARTBEAT_FRAME_INTERVAL = 300;
const LOG_PREFIX = '[matrix-rain]';
const SETTINGS_POLL_FRAME_INTERVAL = 30;

function logEvent(event, details = {}) {
    console.log(`${LOG_PREFIX} ${JSON.stringify({event, ...details})}`);
}

const SHADER_DECLARATIONS = `
uniform sampler2D tex;
uniform float matrix_time;
uniform float matrix_columns;
uniform float matrix_rows;
uniform float matrix_glow;
uniform float matrix_glyph_scale;
uniform float matrix_opacity;

float matrix_hash(float value) {
    return fract(sin(value * 12.9898) * 43758.5453);
}

float matrix_glyph_alpha(float glyph_index, vec2 local) {
    vec2 atlas_cell = vec2(
        mod(glyph_index, ${GLYPH_ATLAS_COLUMNS}.0),
        floor(glyph_index / ${GLYPH_ATLAS_COLUMNS}.0));
    vec2 atlas_uv = (atlas_cell + clamp(local, 0.015, 0.985)) /
        vec2(${GLYPH_ATLAS_COLUMNS}.0, ${GLYPH_ATLAS_ROWS}.0);
    return texture2D(tex, atlas_uv).r;
}

vec3 matrix_drop(float head, float row, float length, float cell_height) {
    float distance_from_head = head - row;

    if (distance_from_head < 0.0 || distance_from_head > length)
        return vec3(0.0);

    float tail = pow(max(0.0, 1.0 - distance_from_head / length), 1.35);
    float cursor = 1.0 - smoothstep(0.0, cell_height * 0.92,
        distance_from_head);
    float glint_position = length * 0.56;
    float glint = 1.0 - smoothstep(0.0, cell_height * 0.72,
        abs(distance_from_head - glint_position));
    return vec3(tail, cursor, glint);
}
`;

const SHADER_CODE = `
vec2 screen_uv = cogl_tex_coord_in[0].xy;
vec2 grid_position = screen_uv * vec2(matrix_columns, matrix_rows);
vec2 cell = floor(grid_position);
vec2 within_cell = fract(grid_position);
float requested_glyph_scale = mix(
    1.0, matrix_glyph_scale, step(0.01, matrix_glyph_scale));
float resolved_glyph_scale = mix(0.48, 0.96,
    clamp((requested_glyph_scale - 0.5) / 1.5, 0.0, 1.0));
vec2 glyph_local = (within_cell - 0.5) / resolved_glyph_scale + 0.5;
float glyph_cell_mask =
    step(0.0, glyph_local.x) * step(glyph_local.x, 1.0) *
    step(0.0, glyph_local.y) * step(glyph_local.y, 1.0);
float cell_seed = cell.x * 131.0 + cell.y * 17.0;
float column_seed = matrix_hash(cell.x * 7.17 + 3.0);
float depth = matrix_hash(cell.x * 3.91 + 11.0);
float glyph_epoch = floor(matrix_time * mix(0.75, 2.4,
    matrix_hash(cell_seed + 41.0)) + cell.y * 0.173);
float glyph_index = floor(matrix_hash(
    cell_seed + glyph_epoch * 97.31) * ${GLYPH_SEQUENCE_LENGTH}.0);
float glyph_alpha = matrix_glyph_alpha(glyph_index, glyph_local) *
    glyph_cell_mask;

float length = mix(0.20, 0.52, matrix_hash(cell.x * 5.73 + 19.0));
float gap = mix(0.08, 0.30, matrix_hash(cell.x * 9.31 + 7.0));
float period = 1.0 + length + gap;
float speed = mix(0.12, 0.31, column_seed) * mix(0.82, 1.18, depth);
float phase = matrix_hash(cell.x * 15.13 + 23.0) * period;
float head_one = mod(matrix_time * speed + phase, period) - length;
float row = 1.0 - (cell.y + 0.5) / matrix_rows;
float cell_height = 1.0 / matrix_rows;
vec3 first_drop = matrix_drop(head_one, row, length, cell_height);
float second_length = length * mix(0.58, 0.82,
    matrix_hash(cell.x * 21.7 + 5.0));
float head_two = mod(matrix_time * speed * 0.91 + phase + period * 0.53,
    period) - second_length;
vec3 second_drop = matrix_drop(head_two, row, second_length, cell_height) *
    step(0.34, matrix_hash(cell.x * 27.1 + 13.0));
vec3 rain = max(first_drop, second_drop);

float illumination = clamp(
    rain.x * 0.88 + rain.y * 0.78 + rain.z * 0.30,
    0.0, 1.0);
vec3 dark_green = vec3(0.008, 0.19, 0.035);
vec3 rain_green = vec3(0.025, 0.94, 0.18);
vec3 cursor_green = vec3(0.94, 1.0, 0.96);
vec3 color = mix(dark_green, rain_green, pow(rain.x, 0.72));
color = mix(color, vec3(0.42, 1.0, 0.58), rain.z * 0.72);
color = mix(color, cursor_green, rain.y);

float halo = 0.0;
if (matrix_glow > 0.5) {
    float halo_offset = 2.25 / 64.0;
    halo = max(halo, matrix_glyph_alpha(
        glyph_index, glyph_local + vec2(halo_offset, 0.0)));
    halo = max(halo, matrix_glyph_alpha(
        glyph_index, glyph_local - vec2(halo_offset, 0.0)));
    halo = max(halo, matrix_glyph_alpha(
        glyph_index, glyph_local + vec2(0.0, halo_offset)));
    halo = max(halo, matrix_glyph_alpha(
        glyph_index, glyph_local - vec2(0.0, halo_offset)));
    halo *= glyph_cell_mask;
}

float rain_strength = max(rain.x, max(rain.y, rain.z));
float core_alpha = glyph_alpha * illumination;
float halo_alpha = halo * rain_strength * matrix_glow * 0.34;
float output_alpha = clamp(max(core_alpha, halo_alpha), 0.0, 1.0);
output_alpha *= matrix_opacity;
float dither = matrix_hash(dot(gl_FragCoord.xy, vec2(0.067, 0.113))) * 0.01;
color *= 1.0 - dither;
cogl_color_out = vec4(color * output_alpha, output_alpha);
`;

const MatrixIlluminationEffect = GObject.registerClass(
class MatrixIlluminationEffect extends Shell.GLSLEffect {
    _init(params) {
        super._init(params);

        this._timeLocation = this.get_uniform_location('matrix_time');
        this._columnsLocation = this.get_uniform_location('matrix_columns');
        this._rowsLocation = this.get_uniform_location('matrix_rows');
        this._glowLocation = this.get_uniform_location('matrix_glow');
        this._glyphScaleLocation = this.get_uniform_location(
            'matrix_glyph_scale');
        this._opacityLocation = this.get_uniform_location('matrix_opacity');
        logEvent('shader-uniforms-ready', {
            columns: String(this._columnsLocation),
            glyphScale: String(this._glyphScaleLocation),
            glow: String(this._glowLocation),
            opacity: String(this._opacityLocation),
            rows: String(this._rowsLocation),
            time: String(this._timeLocation),
        });
    }

    vfunc_build_pipeline() {
        logEvent('shader-pipeline-build', {
            direction: 'down-cogl-coordinates',
            atlasChannel: 'red',
            atlasColumns: GLYPH_ATLAS_COLUMNS,
            atlasRows: GLYPH_ATLAS_ROWS,
            glyphSequenceLength: GLYPH_SEQUENCE_LENGTH,
            headsPerColumn: 2,
            sampling: 'dynamic-high-resolution-atlas',
        });
        this.add_glsl_snippet(
            Cogl.SnippetHook.FRAGMENT,
            SHADER_DECLARATIONS,
            SHADER_CODE,
            true
        );
    }

    setGridGeometry(columns, rows, monitorWidth, monitorHeight) {
        this.set_uniform_float(this._columnsLocation, 1, [columns]);
        this.set_uniform_float(this._rowsLocation, 1, [rows]);
        logEvent('shader-grid-set', {
            columns,
            monitorHeight,
            monitorWidth,
            rows,
        });
    }

    setGlowEnabled(enabled) {
        this.set_uniform_float(this._glowLocation, 1, [enabled ? 1 : 0]);
        this.queue_repaint();
    }

    setGlyphScale(percentage) {
        this.set_uniform_float(
            this._glyphScaleLocation, 1, [percentage / 100]);
        this.queue_repaint();
    }

    setEffectOpacity(percentage) {
        this.set_uniform_float(
            this._opacityLocation, 1, [percentage / 100]);
        this.queue_repaint();
    }

    setTime(seconds) {
        this.set_uniform_float(this._timeLocation, 1, [seconds]);
        this.queue_repaint();
    }
});

class MonitorRain {
    constructor(index, monitor, fontSize, glyphScale, glowEnabled, effectOpacity,
        glyphImage) {
        this._index = index;
        this._actor = new Clutter.Actor({
            clip_to_allocation: true,
            height: monitor.height,
            reactive: false,
            width: monitor.width,
            x: monitor.x,
            y: monitor.y,
        });
        Main.layoutManager._backgroundGroup.add_child(this._actor);

        const glyphWidth = Math.max(6, fontSize * 0.68);
        const columnCount = Math.ceil(monitor.width / glyphWidth);
        const rowCount = Math.ceil(monitor.height / fontSize) + 1;
        const grid = new Clutter.Actor({
            content: glyphImage,
            content_gravity: Clutter.ContentGravity.RESIZE_FILL,
            height: monitor.height,
            reactive: false,
            width: monitor.width,
        });
        this._actor.add_child(grid);

        this._effect = new MatrixIlluminationEffect({name: 'matrix-rain-v12'});
        grid.add_effect(this._effect);
        this._effect.setGridGeometry(
            columnCount, rowCount, monitor.width, monitor.height);
        this._effect.setGlyphScale(glyphScale);
        this._effect.setGlowEnabled(glowEnabled);
        this.setEffectOpacity(effectOpacity);
        logEvent('monitor-ready', {
            backgroundDimming: false,
            columns: columnCount,
            fontSize,
            glyphWidth,
            glyphScale,
            glowEnabled,
            height: monitor.height,
            index,
            opacity: effectOpacity,
            rows: rowCount,
            width: monitor.width,
            x: monitor.x,
            y: monitor.y,
        });
    }

    setGlowEnabled(enabled) {
        this._effect.setGlowEnabled(enabled);
        logEvent('monitor-glow-set', {enabled, index: this._index});
    }

    setEffectOpacity(percentage) {
        this._effect.setEffectOpacity(percentage);
        logEvent('monitor-opacity-set', {
            index: this._index,
            percentage,
            shaderOpacity: percentage / 100,
        });
    }

    tick(seconds) {
        if (!this._actor.is_mapped())
            return false;

        this._effect.setTime(seconds);
        return true;
    }

    destroy() {
        logEvent('monitor-destroy', {index: this._index});
        this._effect = null;
        this._actor.destroy();
        this._actor = null;
    }
}

export class MatrixRain {
    constructor(settings, extensionPath) {
        this._settings = settings;
        this._frameCount = 0;
        const atlasPath = GLib.build_filenamev([
            extensionPath,
            'assets',
            'matrixcode_mask_rgb.png',
        ]);
        logEvent('renderer-start', {atlasPath, extensionPath, version: 12});

        const glyphPixbuf = GdkPixbuf.Pixbuf.new_from_file(atlasPath);
        const channelCount = glyphPixbuf.get_n_channels();
        const hasAlpha = glyphPixbuf.get_has_alpha();
        const pixelFormat = hasAlpha
            ? Cogl.PixelFormat.RGBA_8888
            : Cogl.PixelFormat.RGB_888;
        const pixelFormatName = hasAlpha ? 'RGBA_8888' : 'RGB_888';

        logEvent('glyph-atlas-decoded', {
            channels: channelCount,
            hasAlpha,
            height: glyphPixbuf.get_height(),
            rowstride: glyphPixbuf.get_rowstride(),
            startupPixelScan: false,
            width: glyphPixbuf.get_width(),
        });
        const coglContext = global.stage.context
            .get_backend().get_cogl_context();
        this._glyphImage = St.ImageContent.new_with_preferred_size(
            GLYPH_ATLAS_SIZE, GLYPH_ATLAS_SIZE);
        this._glyphImage.set_bytes(
            coglContext,
            glyphPixbuf.read_pixel_bytes(),
            pixelFormat,
            glyphPixbuf.get_width(),
            glyphPixbuf.get_height(),
            glyphPixbuf.get_rowstride()
        );
        logEvent('glyph-atlas-uploaded', {
            atlasColumns: GLYPH_ATLAS_COLUMNS,
            atlasRows: GLYPH_ATLAS_ROWS,
            bytesPerPixel: channelCount,
            glyphSequenceLength: GLYPH_SEQUENCE_LENGTH,
            pixelFormat: pixelFormatName,
            rowstride: glyphPixbuf.get_rowstride(),
            sharedAcrossMonitors: true,
        });
        this._monitorRains = [];
        this._monitorsChangedId = Main.layoutManager.connect(
            'monitors-changed', () => {
                logEvent('monitors-changed');
                this._rebuildMonitors();
            });
        this._fontSizeChangedId = this._settings.connect(
            'changed::font-size', () => {
                this._syncSettings('signal:font-size');
            });
        this._glyphScaleChangedId = this._settings.connect(
            'changed::glyph-scale', () => {
                this._syncSettings('signal:glyph-scale');
            });
        this._glowChangedId = this._settings.connect(
            'changed::glow-enabled', () => {
                this._syncSettings('signal:glow-enabled');
            });
        this._opacityChangedId = this._settings.connect(
            'changed::effect-opacity', () => {
                this._syncSettings('signal:effect-opacity');
            });
        this._rebuildMonitors();

        const startTime = GLib.get_monotonic_time();
        this._animationSourceId = GLib.timeout_add(
            GLib.PRIORITY_LOW, FRAME_INTERVAL_MS, () => {
                const elapsed = (GLib.get_monotonic_time() - startTime) /
                    1000000;
                let mappedMonitors = 0;

                for (const monitorRain of this._monitorRains) {
                    if (monitorRain.tick(elapsed % 4096))
                        mappedMonitors++;
                }

                this._frameCount++;
                if (this._frameCount % SETTINGS_POLL_FRAME_INTERVAL === 0)
                    this._syncSettings('poll');

                if (this._frameCount <= 3 ||
                    this._frameCount % HEARTBEAT_FRAME_INTERVAL === 0) {
                    logEvent('animation-heartbeat', {
                        elapsedSeconds: Math.round(elapsed * 100) / 100,
                        frame: this._frameCount,
                        mappedMonitors,
                        monitorCount: this._monitorRains.length,
                        settings: this._settingsSnapshot,
                    });
                }

                return GLib.SOURCE_CONTINUE;
            });
        GLib.Source.set_name_by_id(
            this._animationSourceId, '[matrix-rain] update shader time');
    }

    _rebuildMonitors() {
        const fontSize = this._settings.get_double('font-size');
        const glyphScale = this._settings.get_double('glyph-scale');
        const glowEnabled = this._settings.get_boolean('glow-enabled');
        const effectOpacity = this._settings.get_double('effect-opacity');
        this._settingsSnapshot = {
            effectOpacity,
            fontSize,
            glyphScale,
            glowEnabled,
        };
        logEvent('monitors-rebuild-start', {
            effectOpacity,
            fontSize,
            glyphScale,
            glowEnabled,
            monitorCount: Main.layoutManager.monitors.length,
        });

        for (const monitorRain of this._monitorRains)
            monitorRain.destroy();

        this._monitorRains = Main.layoutManager.monitors.map(
            (monitor, index) => new MonitorRain(
                index,
                monitor,
                fontSize,
                glyphScale,
                glowEnabled,
                effectOpacity,
                this._glyphImage
            ));
        logEvent('monitors-rebuild-complete', {
            monitorCount: this._monitorRains.length,
        });
    }

    _syncSettings(source) {
        const next = {
            effectOpacity: this._settings.get_double('effect-opacity'),
            fontSize: this._settings.get_double('font-size'),
            glyphScale: this._settings.get_double('glyph-scale'),
            glowEnabled: this._settings.get_boolean('glow-enabled'),
        };
        const previous = this._settingsSnapshot;

        if (previous &&
            previous.effectOpacity === next.effectOpacity &&
            previous.fontSize === next.fontSize &&
            previous.glyphScale === next.glyphScale &&
            previous.glowEnabled === next.glowEnabled)
            return;

        this._settingsSnapshot = next;
        logEvent('settings-synchronized', {next, previous, source});
        this._rebuildMonitors();
    }

    destroy() {
        logEvent('renderer-destroy', {
            framesRendered: this._frameCount,
            monitorCount: this._monitorRains.length,
        });
        GLib.Source.remove(this._animationSourceId);
        this._animationSourceId = null;

        Main.layoutManager.disconnect(this._monitorsChangedId);
        this._monitorsChangedId = null;

        this._settings.disconnect(this._fontSizeChangedId);
        this._fontSizeChangedId = null;

        this._settings.disconnect(this._glyphScaleChangedId);
        this._glyphScaleChangedId = null;

        this._settings.disconnect(this._glowChangedId);
        this._glowChangedId = null;

        this._settings.disconnect(this._opacityChangedId);
        this._opacityChangedId = null;

        for (const monitorRain of this._monitorRains)
            monitorRain.destroy();

        this._monitorRains = null;
        this._frameCount = null;
        this._glyphImage = null;
        this._settingsSnapshot = null;
        this._settings = null;
    }
}
