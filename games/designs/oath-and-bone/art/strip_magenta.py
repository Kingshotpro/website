#!/usr/bin/env python3
"""
strip_magenta.py — Worker 13 / Oath and Bone pixel sprite pipeline
Two-mode background removal:
  1. Magenta chroma-key (primary): strips #FF00FF ± tolerance
  2. Corner flood-fill (fallback): samples corner color, flood-fills from all 4 corners
     Used when --corner flag passed, or when background is not magenta.
Usage:
  python3 strip_magenta.py <input.png> <output.png>           # magenta mode
  python3 strip_magenta.py <input.png> <output.png> --corner  # corner flood-fill mode
"""

import sys
from PIL import Image
import numpy as np
from collections import deque

def strip_magenta_chroma(img_arr):
    """Strip pixels where R>240 G<30 B>240 (pure magenta core + edge fade)."""
    r, g, b = img_arr[..., 0].astype(float), img_arr[..., 1].astype(float), img_arr[..., 2].astype(float)
    a = img_arr[..., 3].astype(float)

    core_mask = (r > 240) & (g < 30) & (b > 240)
    edge_mask = (r > 200) & (g < 60) & (b > 200) & ~core_mask

    magenta_score = np.clip(((r + b) / 2 - g) / 255.0, 0, 1)
    edge_alpha = (1.0 - magenta_score) * 255.0

    new_alpha = a.copy()
    new_alpha[core_mask] = 0
    new_alpha[edge_mask] = edge_alpha[edge_mask]
    return new_alpha

def strip_corner_flood(img_arr, tolerance=40):
    """Flood-fill background from all 4 corners using sampled corner color."""
    h, w = img_arr.shape[:2]
    corners = [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]

    # Sample background color from corners (average)
    corner_colors = np.array([img_arr[cy, cx, :3] for cy, cx in corners], dtype=float)
    bg_color = corner_colors.mean(axis=0)

    mask = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    for cy, cx in corners:
        if not visited[cy, cx]:
            visited[cy, cx] = True
            queue.append((cy, cx))

    while queue:
        cy, cx = queue.popleft()
        pixel = img_arr[cy, cx, :3].astype(float)
        dist = np.sqrt(((pixel - bg_color) ** 2).sum())
        if dist > tolerance:
            continue
        mask[cy, cx] = True
        for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
            ny, nx = cy+dy, cx+dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))

    # Soft edge: pixels near the mask boundary get partial alpha
    new_alpha = img_arr[..., 3].astype(float).copy()
    new_alpha[mask] = 0

    # Anti-alias: dilate mask 2px and fade
    from scipy.ndimage import binary_dilation
    dilated = binary_dilation(mask, iterations=2)
    edge = dilated & ~mask
    pixel_colors = img_arr[..., :3].astype(float)
    for cy2, cx2 in zip(*np.where(edge)):
        pixel = pixel_colors[cy2, cx2]
        dist = np.sqrt(((pixel - bg_color) ** 2).sum())
        fade = np.clip(dist / tolerance, 0, 1)
        new_alpha[cy2, cx2] = fade * 255.0

    return new_alpha

def strip(input_path, output_path, mode='magenta'):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img)

    if mode == 'magenta':
        new_alpha = strip_magenta_chroma(arr)
    else:
        try:
            new_alpha = strip_corner_flood(arr)
        except ImportError:
            print("scipy not available, falling back to magenta mode")
            new_alpha = strip_magenta_chroma(arr)

    arr[..., 3] = np.clip(new_alpha, 0, 255).astype(np.uint8)
    Image.fromarray(arr, 'RGBA').save(output_path, 'PNG')
    print(f"Saved: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <input.png> <output.png> [--corner]")
        sys.exit(1)
    mode = 'corner' if '--corner' in sys.argv else 'magenta'
    strip(sys.argv[1], sys.argv[2], mode)
