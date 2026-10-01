#!/usr/bin/env python3
import os
import sys
from PIL import Image, ImageDraw

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient: Deep Royal Blue to Electric Sapphire -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="40%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- TV Screen Gradient: Glossy Dark OLED -->
    <linearGradient id="screen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Play Icon Gradient: Brilliant White to Vivid Cyan -->
    <linearGradient id="play" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="60%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>

    <!-- Stand & Base Gradient -->
    <linearGradient id="stand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>

    <linearGradient id="glass-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="tv-shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#020617" flood-opacity="0.55"/>
    </filter>
    <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-play" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#0284c7" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- 1. Outer App Squircle with Bevel & Lighting -->
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="6" y="6" width="500" height="500" rx="110" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="6"/>

  <!-- Subtle Top Corner Glow -->
  <circle cx="96" cy="96" r="140" fill="url(#glass-sheen)"/>

  <!-- 2. TV Screen Outer Chassis -->
  <g filter="url(#tv-shadow)">
    <!-- Stand Column & Base (Rendered below TV body) -->
    <rect x="234" y="356" width="44" height="42" rx="6" fill="url(#stand)"/>
    <rect x="156" y="390" width="200" height="22" rx="11" fill="url(#stand)"/>
    <rect x="160" y="394" width="192" height="6" rx="3" fill="rgba(255,255,255,0.6)"/>

    <!-- TV Frame Bezel -->
    <rect x="64" y="74" width="384" height="290" rx="34" fill="#0b1120" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>

    <!-- Screen Glass -->
    <rect x="80" y="90" width="352" height="258" rx="24" fill="url(#screen)"/>

    <!-- Glass Reflection Diagonal -->
    <path d="M 80 90 L 260 90 L 80 270 Z" fill="url(#glass-sheen)"/>

    <!-- 3. Central Play Symbol (Eye-catching & crisp) -->
    <g filter="url(#glow-play)">
      <path d="M 218 152 C 218 143 228 137 236 142 L 334 206 C 342 211 342 223 334 228 L 236 292 C 228 297 218 291 218 282 Z" fill="url(#play)"/>
    </g>

    <!-- 4. LIVE Eye-Catcher Beacon (Pulsing Red Dot with Aura) -->
    <circle cx="396" cy="122" r="18" fill="#f43f5e" opacity="0.45" filter="url(#glow-red)"/>
    <circle cx="396" cy="122" r="10" fill="#ef4444"/>
    <circle cx="394" cy="120" r="3.5" fill="#ffffff" opacity="0.9"/>
  </g>
</svg>
'''

output_svg_path = os.path.abspath('public/favicon.svg')
with open(output_svg_path, 'w', encoding='utf-8') as f:
    f.write(svg_content.strip())
print(f"Written: {output_svg_path}")
