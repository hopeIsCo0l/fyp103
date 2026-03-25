#!/bin/bash
# Free ports 5432, 5173, 8000 (Git Bash / WSL / Linux / macOS)

for port in 5432 5173 8000; do
  if command -v netstat &>/dev/null; then
    pid=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $5}' | head -1)
  elif command -v ss &>/dev/null; then
    pid=$(ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1)
  fi

  if [ -n "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 "$pid" 2>/dev/null || taskkill //F //PID "$pid" 2>/dev/null
  else
    echo "Port $port is free"
  fi
done
echo "Done. Wait a few seconds, then run: docker-compose -f ./docker/docker-compose.yml up --build"
