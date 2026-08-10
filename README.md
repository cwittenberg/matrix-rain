# Matrix style Code Rain in GNOME

A GNOME Shell 50 extension that renders green digital rain behind application
windows on every connected monitor. The shared desktop background layer makes
the effect available on every workspace without duplicating it per workspace for efficiency.

The visual was originally inspired by [Rezmason's Matrix project](https://github.com/Rezmason/matrix/), but uses its own implementation and the system's fonts. No code, fonts, images,
or other assets are copied from that project.

## Performance

Each rain column is a small `Clutter.Text` actor. Mutter animates actor positions
on the compositor thread, so the extension has no JavaScript frame loop and no
full-screen Cairo buffers. Glyph strings are regenerated only after a stream
has completely crossed its monitor. Increasing the font size also reduces the
number of streams.

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
