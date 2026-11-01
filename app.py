import os
import sys
import json
from pathlib import Path
from flask import Flask, render_template, jsonify, request

if getattr(sys, 'frozen', False):
    base_dir = Path(sys._MEIPASS)
else:
    base_dir = Path(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__, 
    static_folder=str(base_dir / 'static'),
    template_folder=str(base_dir / 'templates')
)

app_data = os.environ.get('APPDATA', '')
storage_dir = Path(app_data) / 'LitematicaAppStorage'
config_file = storage_dir / 'config.json'

custom_dir_cache = None

def load_config():
    global custom_dir_cache
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                if 'custom_dir' in config and config['custom_dir']:
                    custom_dir_cache = Path(config['custom_dir'])
        except (FileNotFoundError, json.JSONDecodeError):
            pass

load_config()

def get_litematica_dir():
    global custom_dir_cache
    if custom_dir_cache:
        return custom_dir_cache
    base_dir = os.environ.get('APPDATA', '')
    return Path(base_dir) / '.minecraft' / 'config' / 'litematica'

def get_latest_files():
    directory = get_litematica_dir()
    if not directory.exists():
        return []
    files = list(directory.glob('*.txt'))
    files.sort(key=lambda x: x.stat().st_ctime, reverse=True)
    return [f.name for f in files]

def parse_litematica_txt(filepath):
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.startswith('|'):
                continue
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 4:
                item_name_raw = parts[1]
                total_str = parts[2]
                if item_name_raw == 'Item' or item_name_raw.startswith('Area Analysis'):
                    continue
                try:
                    total = int(total_str)
                    minecraft_id = "minecraft:" + item_name_raw.lower().replace(' ', '_').replace("'", "")
                    data.append({
                        "RawItem": minecraft_id,
                        "TotalEstimate": total
                    })
                except ValueError:
                    continue
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/files')
def list_files():
    return jsonify(get_latest_files())

@app.route('/api/file/<filename>')
def get_file(filename):
    directory = get_litematica_dir()
    filepath = directory / filename
    if not filepath.exists():
        return jsonify([])
    parsed_data = parse_litematica_txt(filepath)
    return jsonify(parsed_data)

@app.route('/api/rename', methods=['POST'])
def rename_file():
    data = request.get_json()
    old_name = data.get('old_name')
    new_name = data.get('new_name')
    if not old_name or not new_name:
        return jsonify({"error": "Invalid names"}), 400
    if not new_name.endswith('.txt'):
        new_name += '.txt'
    directory = get_litematica_dir()
    old_path = directory / old_name
    new_path = directory / new_name
    if old_path.exists() and not new_path.exists():
        old_path.rename(new_path)
        return jsonify({"success": True, "new_name": new_name})
    return jsonify({"error": "File not found or name already exists"}), 400

@app.route('/api/directory', methods=['GET', 'POST'])
def manage_directory():
    global custom_dir_cache
    if request.method == 'POST':
        data = request.get_json()
        new_dir = data.get('directory')
        if new_dir:
            os.makedirs(storage_dir, exist_ok=True)
            with open(config_file, 'w') as f:
                json.dump({'custom_dir': new_dir}, f)
            custom_dir_cache = Path(new_dir)
            return jsonify({"success": True})
        return jsonify({"error": "Invalid directory"}), 400
    return jsonify({"directory": str(get_litematica_dir())})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    data = request.get_json()
    filename = data.get('filename')
    content = data.get('content')
    if not filename or not content:
        return jsonify({"error": "Missing data"}), 400
    directory = get_litematica_dir()
    directory.mkdir(parents=True, exist_ok=True)
    filepath = directory / filename
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return jsonify({"success": True, "filename": filename})