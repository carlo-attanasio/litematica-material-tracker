import ctypes
import os
import sys
import threading
import time


def enable_per_monitor_dpi_awareness():
    if sys.platform != 'win32':
        return

    user32 = ctypes.WinDLL('user32', use_last_error=True)
    try:
        set_dpi_awareness_context = user32.SetProcessDpiAwarenessContext
    except AttributeError:
        try:
            shcore = ctypes.WinDLL('shcore', use_last_error=True)
            shcore.SetProcessDpiAwareness(2)
        except (AttributeError, OSError):
            user32.SetProcessDPIAware()
        return

    set_dpi_awareness_context.argtypes = [ctypes.c_void_p]
    set_dpi_awareness_context.restype = ctypes.c_bool
    if not set_dpi_awareness_context(ctypes.c_void_p(-4)):
        error = ctypes.get_last_error()
        if error != 5:
            raise ctypes.WinError(error)


enable_per_monitor_dpi_awareness()

import webview
from app import app


def run_flask():
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)

threading.Thread(target=run_flask, daemon=True).start()

app_data = os.environ.get('APPDATA', '')
storage_dir = os.path.join(app_data, 'LitematicaAppStorage')
os.makedirs(storage_dir, exist_ok=True)

webview.create_window('Litematica Material Tracker', 'http://127.0.0.1:5000', width=1024, height=768)

webview.start(icon='static/icons/icon.ico', private_mode=False, storage_path=storage_dir)