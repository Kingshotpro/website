#!/usr/bin/env python3
"""
capture_session.py — Simultaneous video + touch-event capture for
building a tutorial state machine from an Architect playthrough.

Usage:
    python3 capture_session.py --session my_run_name

Starts two things:
1. `adb shell screenrecord` — chained 180s segments (Android limit),
   saved to /sdcard/ then pulled to local storage.
2. `adb shell getevent -lt` — every touch event with kernel timestamp.

Both start from a unified T=0 wallclock. Stop with Ctrl+C.

On stop:
- Pulls all video segments from phone
- Concatenates them with ffmpeg into one MP4
- Parses getevent into a tap/swipe JSON
- Saves session metadata (start/stop time, segment count, etc.)

Output layout:
    data/sessions/SESSION_NAME/
        session.json          # metadata
        events_raw.txt        # raw getevent stream
        events.json           # parsed tap/swipe actions
        segments/seg_001.mp4  # raw video segments
        segments/seg_002.mp4
        video.mp4             # concatenated video (post-stop)

Post-processing is a separate script (extract_states.py).
"""
import os
import sys
import time
import json
import signal
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

ADB = os.path.expanduser("~/platform-tools/adb")
DEVICE_ID = "R5CY61LHZVA"
SEGMENT_SECONDS = 180  # Android's screenrecord cap per file
SCRAPER_DIR = Path(__file__).parent
SESSIONS_DIR = SCRAPER_DIR / "data" / "sessions"


def adb(*args, capture=True, timeout=30):
    cmd = [ADB, "-s", DEVICE_ID] + list(args)
    if capture:
        return subprocess.run(cmd, capture_output=True, timeout=timeout)
    return subprocess.run(cmd, timeout=timeout)


class Capture:
    def __init__(self, session_name):
        self.name = session_name
        self.dir = SESSIONS_DIR / session_name
        self.segments_dir = self.dir / "segments"
        self.dir.mkdir(parents=True, exist_ok=True)
        self.segments_dir.mkdir(exist_ok=True)

        self.start_wall = None        # wallclock at session start
        self.getevent_proc = None
        self.getevent_fh = None
        self.screenrecord_proc = None
        self.segment_idx = 0
        self.segment_start_times = []  # wallclock seconds since start for each segment
        self.stopping = False

    def _kill_remote_screenrecord(self):
        """Kill any screenrecord running on the phone from past sessions."""
        adb("shell", "pkill", "-f", "screenrecord")

    def _start_getevent(self):
        """Start getevent process, writing raw stream to file."""
        raw_path = self.dir / "events_raw.txt"
        self.getevent_fh = open(raw_path, "w")
        self.getevent_proc = subprocess.Popen(
            [ADB, "-s", DEVICE_ID, "shell", "getevent", "-lt"],
            stdout=self.getevent_fh,
            stderr=subprocess.DEVNULL,
        )
        print(f"[getevent] started → {raw_path}")

    def _start_next_segment(self):
        """Start one screenrecord segment on the phone."""
        self.segment_idx += 1
        remote = f"/sdcard/cap_seg_{self.segment_idx:03d}.mp4"
        elapsed = time.time() - self.start_wall
        self.segment_start_times.append(elapsed)
        # screenrecord exits after --time-limit seconds on the phone
        self.screenrecord_proc = subprocess.Popen(
            [ADB, "-s", DEVICE_ID, "shell", "screenrecord",
             "--time-limit", str(SEGMENT_SECONDS),
             "--bit-rate", "4000000",  # 4 Mbps — good quality, ~30MB/min
             remote],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print(f"[video] segment {self.segment_idx} started → {remote} "
              f"(t+{elapsed:.1f}s)")

    def _pull_segment(self, idx):
        """Pull one segment from phone to local and delete remote."""
        remote = f"/sdcard/cap_seg_{idx:03d}.mp4"
        local = self.segments_dir / f"seg_{idx:03d}.mp4"
        adb("pull", remote, str(local), timeout=60)
        adb("shell", "rm", remote)
        return local

    def run(self):
        self.start_wall = time.time()
        self._kill_remote_screenrecord()
        time.sleep(1)
        self._start_getevent()
        self._start_next_segment()

        def handle_sigint(sig, frame):
            self.stopping = True
            print("\n[capture] Ctrl+C received, stopping...")

        signal.signal(signal.SIGINT, handle_sigint)

        # Supervise the screenrecord process; restart segments on natural exit
        try:
            while not self.stopping:
                time.sleep(1)
                # Check if the current segment has ended
                if self.screenrecord_proc.poll() is not None:
                    print(f"[video] segment {self.segment_idx} ended naturally")
                    if self.stopping:
                        break
                    # Start next segment immediately
                    self._start_next_segment()
        except Exception as e:
            print(f"[capture] error: {e}")

        # Stop remote screenrecord, pull segments
        print("[capture] stopping screenrecord on phone...")
        adb("shell", "pkill", "-f", "screenrecord")
        time.sleep(2)
        if self.screenrecord_proc:
            try:
                self.screenrecord_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.screenrecord_proc.kill()

        # Stop getevent
        print("[capture] stopping getevent...")
        if self.getevent_proc:
            self.getevent_proc.terminate()
            try:
                self.getevent_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.getevent_proc.kill()
        if self.getevent_fh:
            self.getevent_fh.close()

        stop_wall = time.time()
        duration = stop_wall - self.start_wall

        # Pull all segments
        print(f"[capture] pulling {self.segment_idx} segment(s)...")
        pulled = []
        for i in range(1, self.segment_idx + 1):
            try:
                p = self._pull_segment(i)
                pulled.append(str(p))
                print(f"  pulled {p}")
            except Exception as e:
                print(f"  FAILED seg {i}: {e}")

        # Concatenate video segments with ffmpeg (if > 1)
        video_out = self.dir / "video.mp4"
        if len(pulled) > 1:
            concat_list = self.dir / "concat.txt"
            with open(concat_list, "w") as f:
                for p in pulled:
                    f.write(f"file '{p}'\n")
            print("[capture] concatenating with ffmpeg...")
            res = subprocess.run(
                ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
                 "-i", str(concat_list), "-c", "copy", str(video_out)],
                capture_output=True
            )
            if res.returncode == 0:
                print(f"  video → {video_out}")
            else:
                print(f"  ffmpeg failed: {res.stderr.decode()[-500:]}")
        elif len(pulled) == 1:
            # Just copy/move the single segment as the final video
            subprocess.run(["cp", pulled[0], str(video_out)])
            print(f"  video → {video_out}")

        # Parse events (delegate to tutorial_recorder's parser)
        sys.path.insert(0, str(SCRAPER_DIR))
        try:
            from tutorial_recorder import raw_events_to_actions
            raw_lines = open(self.dir / "events_raw.txt").readlines()
            actions = raw_events_to_actions(raw_lines)
            with open(self.dir / "events.json", "w") as f:
                json.dump({
                    "action_count": len(actions),
                    "actions": actions,
                }, f, indent=2)
            taps = sum(1 for a in actions if a["action"] == "tap")
            swipes = sum(1 for a in actions if a["action"] == "swipe")
            print(f"[events] parsed {len(actions)} actions ({taps} taps, {swipes} swipes)")
        except Exception as e:
            print(f"[events] parse failed: {e}")

        # Write session metadata
        meta = {
            "session_name": self.name,
            "start_wall": self.start_wall,
            "start_iso": datetime.fromtimestamp(self.start_wall).isoformat(),
            "stop_iso": datetime.fromtimestamp(stop_wall).isoformat(),
            "duration_seconds": round(duration, 2),
            "segment_count": self.segment_idx,
            "segment_start_offsets": self.segment_start_times,
            "segments_dir": str(self.segments_dir),
            "video_out": str(video_out),
        }
        with open(self.dir / "session.json", "w") as f:
            json.dump(meta, f, indent=2)

        print()
        print(f"=== Session complete ===")
        print(f"  {self.dir}")
        print(f"  duration: {duration:.1f}s ({duration/60:.1f} min)")
        print(f"  segments: {self.segment_idx}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", required=True,
                        help="Session name (used for output directory)")
    args = parser.parse_args()

    # Refuse to overwrite an existing session
    target = SESSIONS_DIR / args.session
    if target.exists():
        print(f"Session '{args.session}' already exists: {target}")
        print("Pick a different name or delete the existing directory.")
        sys.exit(1)

    cap = Capture(args.session)
    print(f"=== Capture Session: {args.session} ===")
    print(f"  Output dir: {cap.dir}")
    print(f"  Press Ctrl+C to stop.")
    print()
    cap.run()


if __name__ == "__main__":
    main()
