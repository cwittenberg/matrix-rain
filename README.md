# Matrix style Code Rain in GNOME

A GNOME Shell 50 extension that renders green digital rain behind application
windows on every connected monitor. The shared desktop background layer makes
the effect available on every workspace without duplicating it per workspace for efficiency.

The visual was originally inspired by [Rezmason's Matrix project](https://github.com/Rezmason/matrix/), but uses its own implementation and the system's fonts. No code, fonts, images,
or other assets are copied from that project.

## Performance

Each column is one narrow `Clutter.Text` actor containing a stationary glyph
grid. A low-priority 10 Hz scheduler only rebuilds a column when an
illumination head advances to the next cell or one of its glyphs cycles. There
are no full-screen Cairo buffers, blur passes, or external processes, and each
monitor is capped at 180 columns. Increasing the font size reduces both column
and row counts. The optional phosphor glow uses two subpixel `Clutter.Clone`
actors per monitor; clones reuse the existing column layer without duplicating
glyph state, text layouts, timers, or framebuffer-sized textures.

## Build and run locally

```sh
./build.sh run
```

This builds the ZIP, replaces an existing local installation if necessary, and
enables `matrix-rain@cwittenberg`. The available commands are:

```sh
./build.sh build    # Package only
./build.sh install  # Package, install, and enable
./build.sh prefs    # Open the font-size preferences
```

If GNOME Shell has not discovered a first-time installation yet, log out and
back in once, then run `gnome-extensions enable matrix-rain@cwittenberg`.
Preferences provide a font-size slider from 10 to 48 pixels.

`build.sh` is a local development helper and is deliberately not included in
the extension ZIP uploaded to EGO.

## Maintenance notice

This extension was generated with AI for personal use. Do not upload it to
[extensions.gnome.org](https://extensions.gnome.org/) unless you understand the
JavaScript and can maintain it for GNOME users.
