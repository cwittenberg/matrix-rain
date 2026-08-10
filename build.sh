#!/usr/bin/env bash
# Generated with AI for personal use.
# Do NOT upload to extensions.gnome.org (EGO) unless you understand this code
# and can maintain it.
# SPDX-License-Identifier: GPL-2.0-or-later

set -euo pipefail

readonly EXTENSION_UUID='matrix-rain@cwittenberg'
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

build_bundle() {
    require_command gnome-extensions
    mkdir -p -- "$BUILD_DIR"
    gnome-extensions pack \
        --force \
        --extra-source=shell \
        --extra-source=LICENSE \
        --out-dir="$BUILD_DIR" \
        "$PROJECT_DIR"
    printf 'Built %s\n' "$BUNDLE_PATH"
}

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
