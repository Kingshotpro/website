#!/usr/bin/env python3
"""
popup_handler.py — Universal popup detection & dismissal.

Known popups in Kingshot (observed empirically):
1. Rookie Value Pack / promo packs — large colorful overlay, X at top-right (~1040, 130)
2. Welcome Back offline income — "Time Offline" text, Confirm button bottom
3. Teleport confirmation — "Respected Governor" text, Confirm bottom
4. Quit Game — "Quit game?" text, Cancel + Confirm
5. Wish / Mystic Divination — purple witch popup
6. Wilderness Exploration / first-time world tutorial — multi-tab header
7. Bonus Overview (accidentally opened) — X at top-right of popup
8. Login confirmation (when switching characters) — Cancel + Confirm

Detection: pixel signatures at known screen positions.
Dismissal: tap the appropriate button, verify popup gone.

Usage:
    handler = PopupHandler(adb_controller)
    handler.dismiss_all()  # Clear any popups, up to 5 attempts
"""
from io import BytesIO
from PIL import Image
import time


class PopupHandler:
    def __init__(self, adb):
        self.adb = adb  # ADBController instance with .run() method
        self._log = getattr(adb, 'log', print)

    # ------------------------------------------------------------------ utils

    def _screenshot(self):
        data = self.adb.screenshot_bytes()
        return Image.open(BytesIO(data))

    def _tap(self, x, y, reason=""):
        self.adb.run("shell", "input", "tap", str(x), str(y))
        if reason:
            self._log(f"  popup: {reason} → tap ({x}, {y})")
        time.sleep(1.5)

    def _pixel(self, img, x, y):
        return img.getpixel((x, y))

    def _is_color(self, px, r_range, g_range, b_range):
        """Check if pixel matches color range."""
        return (r_range[0] <= px[0] <= r_range[1] and
                g_range[0] <= px[1] <= g_range[1] and
                b_range[0] <= px[2] <= b_range[1])

    # --------------------------------------------------------------- detectors

    def detect_quit_dialog(self, img):
        """
        'Quit game?' confirmation. Orange Cancel (~300, 1440), Cyan Confirm (~750, 1440).
        """
        cancel = self._pixel(img, 300, 1440)
        confirm = self._pixel(img, 750, 1440)
        is_orange = self._is_color(cancel, (200, 255), (80, 170), (30, 110))
        is_cyan = self._is_color(confirm, (50, 140), (180, 240), (190, 245))
        return is_orange and is_cyan

    def detect_login_confirm(self, img):
        """
        Character login confirmation — same button colors as Quit, but
        character portrait is in the middle (~540, 1150). Distinguished by
        checking for portrait's rounded-square frame.
        """
        # Same button pattern
        cancel = self._pixel(img, 300, 1440)
        confirm = self._pixel(img, 750, 1440)
        is_orange = self._is_color(cancel, (200, 255), (80, 170), (30, 110))
        is_cyan = self._is_color(confirm, (50, 140), (180, 240), (190, 245))
        # Login has a character portrait around y=1150 center
        portrait = self._pixel(img, 540, 1150)
        # Portrait area has skin/bright colors, Quit dialog has beige/tan text
        is_portrait = (portrait[0] > 100 and portrait[1] > 80 and sum(portrait[:3]) > 400)
        return is_orange and is_cyan and is_portrait

    def detect_welcome_back(self, img):
        """
        'Welcome back!' offline income dialog. Green Confirm button at bottom ~y=1800.
        Has 'Time Offline' label area. Green RGB approximately (100-180, 200-255, 100-170).
        """
        confirm_btn = self._pixel(img, 540, 1800)
        return self._is_color(confirm_btn, (80, 180), (180, 255), (80, 170))

    def detect_teleport_confirm(self, img):
        """
        'Respected Governor' teleport notice. Single cyan Confirm at ~y=1500.
        No Cancel button. Distinguished from welcome-back by y position.
        """
        confirm_btn = self._pixel(img, 540, 1500)
        # Cyan/teal button
        return self._is_color(confirm_btn, (50, 140), (180, 240), (190, 245))

    def detect_promo_pack(self, img):
        """
        Rookie Value Pack or other colorful promo. X button usually at (1040, 130)
        or (1040, 175). Top-right area has dark/high-contrast X.
        """
        # Check for dark X at common positions
        candidates = [(1040, 130), (1040, 175), (1010, 175), (930, 400)]
        # Also check if the screen has the "promotional yellow/orange" banner
        banner = self._pixel(img, 540, 800)
        is_promo = self._is_color(banner, (180, 255), (120, 200), (50, 130))
        return is_promo

    def detect_wish_popup(self, img):
        """Wish/Mystic Divination — purple background."""
        bg = self._pixel(img, 300, 900)
        return self._is_color(bg, (50, 120), (20, 80), (60, 140))

    def detect_wilderness_exploration(self, img):
        """First-time world map intro — tabs at top with 'Plunder', 'Battle', etc."""
        # Has orange tab header around y=290-340
        header = self._pixel(img, 200, 310)
        return self._is_color(header, (220, 255), (130, 200), (50, 130))

    def detect_bonus_overview(self, img):
        """Accidentally opened Bonus Overview — has 'Bonus Overview' text header."""
        # Beige banner header
        header = self._pixel(img, 540, 400)
        return self._is_color(header, (190, 220), (180, 210), (150, 190))

    # --------------------------------------------------------------- dismissal

    def dismiss_once(self):
        """
        Check for any popup; dismiss the first one found.
        Returns a short identifier of what was dismissed, or None if nothing found.
        """
        img = self._screenshot()

        # Order matters: more specific checks first
        if self.detect_quit_dialog(img):
            self._tap(300, 1440, "Quit dialog → Cancel")
            return "quit_dialog"

        if self.detect_teleport_confirm(img):
            self._tap(540, 1500, "Teleport → Confirm")
            return "teleport"

        if self.detect_welcome_back(img):
            self._tap(540, 1800, "Welcome back → Confirm")
            return "welcome_back"

        if self.detect_wilderness_exploration(img):
            self._tap(1040, 520, "Wilderness intro → X")
            return "wilderness"

        if self.detect_wish_popup(img):
            # Try back button for event popups
            self._tap(55, 130, "Wish popup → back")
            return "wish"

        if self.detect_bonus_overview(img):
            self._tap(960, 360, "Bonus overview → X")
            return "bonus_overview"

        if self.detect_promo_pack(img):
            # Try multiple X positions
            self._tap(1040, 130, "Promo pack → X (top)")
            time.sleep(1)
            self._tap(1010, 175, "Promo pack → X (alt)")
            return "promo_pack"

        return None

    def dismiss_all(self, max_attempts=8):
        """
        Loop: detect + dismiss popups until none remain or we give up.
        Returns list of what was dismissed.
        """
        dismissed = []
        for i in range(max_attempts):
            kind = self.dismiss_once()
            if kind is None:
                break
            dismissed.append(kind)
            time.sleep(1.5)  # let animation finish
        if dismissed:
            self._log(f"  popups cleared: {', '.join(dismissed)}")
        return dismissed
