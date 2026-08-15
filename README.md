# Matrix Code Rain

For those still love this movie, here is a way to turn your GNOME desktops into proper code rain screens. Yes, it works seamlessly in multi-monitor setups.

Bring the classic digital rain to your Linux workspace. **Matrix Code Rain** renders animated, falling green code directly behind your windows, across every workspace and monitor.
Does require a GPU to run. CPU-only is not supported.

<img width="1575" height="1074" alt="smaller" src="https://github.com/user-attachments/assets/604186e2-f495-4362-9efc-2248ea6f5711" />


---

## Features

* **Authentic Visuals:** Utilizes an RGB-mask conversion of the classic Matrix code.
* **Multi-Monitor Support:** Each monitor gets its own clipped streams of independently falling code.
* **High Performance:** Runs entirely via GPU shaders using Cogl/OpenGL for maximum efficiency.
* **Customizable:** Tweak the aesthetics to match your exact setup.
* Translations for Italian, Japanese, Korean, French, Korean, Chinese (simplified)

---

## Requirements

* **GNOME Shell:** Version 50.
* **Hardware:** An OpenGL-capable GPU. CPU-only rendering is not supported due to efficiency requirements.

---

## Customization & Preferences

Tune the rain for your specific display setup via the extension preferences window with some cool options

---

## Installation

### Manual Installation (Source)

Clone this repository and use the included build script to compile and install the extension directly:

```bash
git clone https://github.com/cwittenberg/matrix-rain.git
cd matrix-rain
./build.sh install

```

---

## License & Credits

* **Extension License:** GNU General Public License v2.0 or later (GPL-2.0-or-later)
* **Glyph Atlas:** The classic Matrix MSDF atlas is based on the upstream work by [Rezmason/matrix](https://github.com/Rezmason/matrix) under MIT license
* **Development:** Created by @cwittenberg.

If you enjoy the extension, consider [buying the developer a coffee](https://ko-fi.com/cwittenberg).
