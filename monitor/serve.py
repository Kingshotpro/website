#!/usr/bin/env python3
import os
import subprocess
import sys

project_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(project_dir)

node = "/Users/defimagic/.nvm/versions/node/v22.22.2/bin/node"
next_bin = os.path.join(project_dir, "node_modules", ".bin", "next")

env = os.environ.copy()
env["PATH"] = "/Users/defimagic/.nvm/versions/node/v22.22.2/bin:" + env.get("PATH", "")

proc = subprocess.run([node, next_bin, "dev", "-p", "3960"], cwd=project_dir, env=env)
sys.exit(proc.returncode)
