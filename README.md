# Litematica Material Tracker

A desktop application to help you track your gathered materials for large-scale [Litematica](https://www.curseforge.com/minecraft/mc-mods/litematica) builds. 

Instead of manually checking off items on a notepad, this app reads Litematica's exported `.txt` material lists and provides an interactive, visual interface to track your progress with actual in-game item icons.

## Features

* **Interactive Tracking:** Drag across progress bars or click completion checkboxes to quickly log gathered materials.
* **Auto-Calculated Quantities:** Automatically formats raw numbers into Chests, Shulker Boxes (SB), Stacks, and Items.
* **Live Icon Rendering:** Fetches high-quality item textures on the fly using the [MC Item Gallery](https://mcitemgallery.com/) CDN.
* **File Management Built-in:** Upload new `.txt` files, rename existing ones, or change the default Litematica folder directory directly from the app.
* **Persistent Progress:** Saves your progress locally.
* **Filtering:** Easily filter between different progress states for each item.
* **Litematica folder:** By default, the app automatically looks for material lists in your default directory:
`%APPDATA%/.minecraft/config/litematica`

## Tech Stack

* **Backend:** Python & Flask
* **Frontend:** HTML, CSS (Custom), Vanilla JavaScript
* **Desktop Wrapper:** PyWebView
* **Bundler:** PyInstaller

## Getting Started

### Prerequisites
Make sure you have Python 3.x installed. Clone this repository and install the required dependencies:

```bash
git clone https://github.com/carlo-attanasio/litematica-material-tracker.git
cd litematica-material-tracker
pip install flask pywebview pyinstaller
```

### Running the App

To launch the application directly from the source code, run the launcher script:

```bash
python launcher.pyw
```

## Building the executable

You can easily compile this project into a single, portable Windows `.exe` file that requires no installation. Simply run the included build script:

```bash
python build.py
```

The script will use PyInstaller to package the Flask server and frontend assets, automatically clean up the temporary `build` and `dist` folders, and place `Litematica Material Tracker.exe` directly in your root directory.

## Credits

* Item icons are provided by the [MC Item Gallery](https://mcitemgallery.com/) API.
* Mod inspiration by masa's [Litematica](https://www.curseforge.com/minecraft/mc-mods/litematica).
* UI icons provided by [Icons8](https://icons8.com/).