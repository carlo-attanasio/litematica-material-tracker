import subprocess
import shutil
import os

app_name = "Litematica Material Tracker"

subprocess.run([
    "pyinstaller", 
    "--noconsole", 
    "--icon=static/icons/icon.ico",
    "--name", app_name,
    "--onefile", 
    "--add-data=static;static",
    "--add-data=templates;templates",
    "launcher.pyw"
])

exe_path = os.path.join("dist", f"{app_name}.exe")
dest_path = f"../{app_name}.exe"
spec_file = f"{app_name}.spec"

if os.path.exists(exe_path):
    if os.path.exists(dest_path):
        os.remove(dest_path)
    shutil.move(exe_path, dest_path)

if os.path.exists("build"):
    shutil.rmtree("build")

if os.path.exists("dist"):
    shutil.rmtree("dist")

if os.path.exists("__pycache__"):
    shutil.rmtree("__pycache__")

if os.path.exists(spec_file):
    os.remove(spec_file)