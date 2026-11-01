import webview
import os
import threading
import time
from app import app

def run_flask():
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)

threading.Thread(target=run_flask, daemon=True).start()

app_data = os.environ.get('APPDATA', '')
storage_dir = os.path.join(app_data, 'LitematicaAppStorage')
os.makedirs(storage_dir, exist_ok=True)

webview.create_window('Litematica Material Tracker', 'http://127.0.0.1:5000', width=1024, height=768)

webview.start(icon='static/icons/icon.ico', private_mode=False, storage_path=storage_dir)