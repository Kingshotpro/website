# Playwright ships an official image that has Chromium + all system
# libs preinstalled. Use it to skip 300 MB of apt-get.
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the bot code
COPY lookup_player.py server.py ./

# Fly.io / most hosts set PORT; default to 8080 for local
ENV PORT=8080
EXPOSE 8080

# Playwright browsers are already installed in the base image.
# No `playwright install chromium` needed.

CMD ["python3", "server.py"]
