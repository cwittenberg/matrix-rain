import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {
    ExtensionPreferences,
    gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PROJECT_URL = 'https://github.com/cwittenberg/matrix-rain';

function createLinkButton(title, uri, styleClass = null) {
    const button = new Gtk.LinkButton({
        label: title,
        hexpand: true,
        uri,
        valign: Gtk.Align.CENTER,
    });

    if (styleClass)
        button.add_css_class(styleClass);

    return button;
}

function addSwitchSetting(settings, group, key, title, subtitle) {
    const row = new Adw.SwitchRow({
        active: settings.get_boolean(key),
        title,
        subtitle,
    });
    group.add(row);
    settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
}

function addScaleSetting(settings, group, options) {
    const row = new Adw.ActionRow({
        title: options.title,
        subtitle: options.subtitle,
    });
    const scale = Gtk.Scale.new_with_range(
        Gtk.Orientation.HORIZONTAL,
        options.minimum,
        options.maximum,
        options.step
    );
    scale.valign = Gtk.Align.CENTER;
    scale.hexpand = true;
    scale.set_size_request(300, -1);
    scale.digits = 0;
    scale.draw_value = false;
    scale.set_value(settings.get_double(options.key));
    const valueLabel = new Gtk.Label({
        label: `${Math.round(scale.get_value())}${options.unit}`,
        width_chars: 6,
        xalign: 1,
    });
    row.add_suffix(scale);
    row.add_suffix(valueLabel);
    row.set_activatable_widget(scale);
    group.add(row);

    scale.connect('value-changed', () => {
        const value = scale.get_value();
        valueLabel.label = `${Math.round(value)}${options.unit}`;
    });
    settings.bind(
        options.key, scale, 'value', Gio.SettingsBindFlags.DEFAULT);
}

function buildAppearancePage(settings) {
    const page = new Adw.PreferencesPage({
        title: _('Appearance'),
        icon_name: 'preferences-desktop-appearance-symbolic',
    });
    const group = new Adw.PreferencesGroup({
        title: _('Code Rain'),
        description: _('Tune the rain for your display setup.'),
    });
    page.add(group);

    addSwitchSetting(
        settings,
        group,
        'glow-enabled',
        _('Phosphor glow'),
        _('Add a single-pass halo.')
    );
    addSwitchSetting(
        settings,
        group,
        'soft-blur-enabled',
        _('Soft anti-aliasing'),
        _('Blend adjacent glyph samples for a softer cinematic bloom.')
    );
    addScaleSetting(settings, group, {
        key: 'font-size',
        title: _('Font size'),
        subtitle: _('Larger glyphs use fewer columns and fewer compositor resources.'),
        minimum: 10,
        maximum: 32,
        step: 1,
        unit: ' px',
    });
    addScaleSetting(settings, group, {
        key: 'glyph-scale',
        title: _('Glyph scale'),
        subtitle: _('Set the actual percentage of each grid cell filled by its symbol.'),
        minimum: 50,
        maximum: 100,
        step: 2,
        unit: '%',
    });
    addScaleSetting(settings, group, {
        key: 'rain-speed',
        title: _('Rain speed'),
        subtitle: _('Control how quickly streams fall and glyphs change.'),
        minimum: 25,
        maximum: 200,
        step: 5,
        unit: '%',
    });
    addScaleSetting(settings, group, {
        key: 'stream-density',
        title: _('Stream density'),
        subtitle: _('Increase or reduce the number of independent code streams.'),
        minimum: 25,
        maximum: 200,
        step: 5,
        unit: '%',
    });
    addScaleSetting(settings, group, {
        key: 'effect-opacity',
        title: _('Transparency'),
        subtitle: _('Lower this for a subtle effect over the desktop.'),
        minimum: 10,
        maximum: 100,
        step: 5,
        unit: '%',
    });

    return page;
}

function buildAboutPage(prefs) {
    const page = new Adw.PreferencesPage({
        title: _('About'),
        icon_name: 'help-about-symbolic',
    });
    const group = new Adw.PreferencesGroup();

    group.add(new Adw.ActionRow({
        title: _('Matrix Code Rain'),
        subtitle: _('Matrix-style animated code rain for the GNOME desktop.'),
    }));

    const linkBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 12,
        homogeneous: true,
        halign: Gtk.Align.CENTER,
        margin_top: 16,
        margin_bottom: 16,
    });
    linkBox.append(createLinkButton(
        _('Buy me a coffee'),
        'https://ko-fi.com/cwittenberg',
        'suggested-action'
    ));
    linkBox.append(createLinkButton(
        _('Report a Bug'),
        `${PROJECT_URL}/issues/new?template=bug_report.md`
    ));
    linkBox.append(createLinkButton(
        _('Request a Feature'),
        `${PROJECT_URL}/issues/new?template=feature_request.md`
    ));
    group.add(linkBox);

    group.add(new Adw.ActionRow({
        title: _('Developer'),
        subtitle: 'Christian Wittenberg',
    }));
    let versionString = _('Local / EGO (Auto-injected)');
    if (prefs.metadata.version !== undefined)
        versionString = prefs.metadata.version.toString();
    group.add(new Adw.ActionRow({
        title: _('Version'),
        subtitle: versionString,
    }));
    group.add(new Adw.ActionRow({
        title: _('Graphics requirement'),
        subtitle: _('Requires an OpenGL-capable compositor; CPU-only rendering is not supported.'),
    }));

    page.add(group);
    return page;
}

export default class MatrixRainPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(720, 620);
        window._settings = this.getSettings();
        window.add(buildAppearancePage(window._settings));
        window.add(buildAboutPage(this));
    }
}
