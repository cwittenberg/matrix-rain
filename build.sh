#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later

set -euo pipefail

readonly EXTENSION_UUID='matrix-rain@cwittenberg'
readonly GETTEXT_DOMAIN='matrix-rain@cwittenberg'
readonly PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly BUILD_DIR="${PROJECT_DIR}/build"
readonly BUNDLE_PATH="${BUILD_DIR}/${EXTENSION_UUID}.shell-extension.zip"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        printf 'Required command not found: %s\n' "$1" >&2
        exit 1
    fi
}

check_shell_version() {
    local shell_version

    require_command gnome-shell
    shell_version="$(gnome-shell --version)"
    if [[ "$shell_version" != 'GNOME Shell 50'* ]]; then
        printf 'Code Rain requires GNOME Shell 50; found: %s\n' \
            "$shell_version" >&2
        exit 1
    fi
}

build_bundle() (
    local staging_dir

    require_command gnome-extensions
    require_command glib-compile-schemas
    require_command msgfmt
    mkdir -p -- "$BUILD_DIR"
    staging_dir="$(mktemp -d \
        "${BUILD_DIR}/.matrix-rain-stage.XXXXXXXX")"
    case "$staging_dir" in
    "${BUILD_DIR}/.matrix-rain-stage."*)
        ;;
    *)
        printf 'Unexpected staging directory: %s\n' "$staging_dir" >&2
        exit 1
        ;;
    esac
    if [[ ! -d "$staging_dir" || -L "$staging_dir" ]]; then
        printf 'Invalid staging directory: %s\n' "$staging_dir" >&2
        exit 1
    fi
    trap 'rm -rf -- "$staging_dir"' EXIT

    mkdir -p -- "$staging_dir/assets" "$staging_dir/schemas"
    cp -- "$PROJECT_DIR/metadata.json" "$staging_dir/"
    cp -- "$PROJECT_DIR/extension.js" "$staging_dir/"
    cp -- "$PROJECT_DIR/prefs.js" "$staging_dir/"
    cp -- "$PROJECT_DIR/LICENSE" "$staging_dir/"
    cp -- "$PROJECT_DIR/THIRD_PARTY.md" "$staging_dir/"
    cp -- "$PROJECT_DIR/assets/matrixcode_mask_rgb.png" \
        "$staging_dir/assets/"
    cp -- "$PROJECT_DIR/schemas/org.gnome.shell.extensions.matrix-rain.v5.gschema.xml" \
        "$staging_dir/schemas/"
    cp -R -- "$PROJECT_DIR/shell" "$staging_dir/"
    cp -R -- "$PROJECT_DIR/po" "$staging_dir/"

    glib-compile-schemas --strict "$staging_dir/schemas"

    gnome-extensions pack \
        --force \
        --extra-source=assets \
        --extra-source=shell \
        --extra-source=LICENSE \
        --extra-source=THIRD_PARTY.md \
        --podir=po \
        --gettext-domain="$GETTEXT_DOMAIN" \
        --out-dir="$BUILD_DIR" \
        "$staging_dir"
    printf 'Built %s\n' "$BUNDLE_PATH"
)

install_and_enable() {
    check_shell_version
    build_bundle

    if gnome-extensions info "$EXTENSION_UUID" >/dev/null 2>&1; then
        gnome-extensions disable "$EXTENSION_UUID"
    fi

    gnome-extensions install --force "$BUNDLE_PATH"

    if ! gnome-extensions enable "$EXTENSION_UUID"; then
        printf '%s\n' \
            'GNOME Shell has not discovered the new extension yet.' \
            'Log out and back in, then run:' \
            "  gnome-extensions enable ${EXTENSION_UUID}" >&2
        exit 1
    fi

    printf 'Enabled %s\n' "$EXTENSION_UUID"
}

open_preferences() {
    check_shell_version
    require_command gnome-extensions
    gnome-extensions prefs "$EXTENSION_UUID"
}

print_usage() {
    printf '%s\n' \
        'Usage: ./build.sh COMMAND' \
        '' \
        'Commands:' \
        '  build     Create the extension ZIP in build/' \
        '  install   Build, install, and enable the extension' \
        '  run       Alias for install' \
        '  prefs     Open the extension preferences' \
        '  help      Show this help'
}

case "${1:-help}" in
build)
    build_bundle
    ;;
install | run)
    install_and_enable
    ;;
prefs)
    open_preferences
    ;;
help | --help | -h)
    print_usage
    ;;
*)
    printf 'Unknown command: %s\n\n' "$1" >&2
    print_usage >&2
    exit 2
    ;;
esac
