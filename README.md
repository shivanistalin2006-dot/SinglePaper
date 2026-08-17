# 📄 Single Paper

> **One sheet of paper. Infinite possibilities.**

An interactive, realistic digital paper playground built with vanilla JavaScript, HTML5 Canvas, and modern Web APIs. Tear it, crush it, flip it, paint on it with rich color palettes, and learn origami step-by-step!

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://shivanistalin2006-dot.github.io/SinglePaper/)
[![GitHub Pages](https://img.shields.io/badge/hosted%20with-GitHub%20Pages-blue.svg)](https://shivanistalin2006-dot.github.io/SinglePaper/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

- 🖐 **Physical Paper Simulation**: Realistic shadow, natural dimensions, 2-finger pinch zoom, wheel zoom, and smooth dragging.
- 🎨 **Drawing & Painting**:
  - **Pen**: Crisp, smooth lines for notes and handwriting.
  - **Pencil**: Textured, pressure-sensitive sketching feel.
  - **Marker**: Semi-transparent, vibrant highlighter strokes.
  - **Eraser**: Precise canvas erasing.
  - **20-Color Quick Palette** + full HEX color picker.
  - Adjustable brush size slider.
- ✂️ **Realistic Paper Tearing**: Cut jagged tear paths across the paper with realistic procedural audio feedback.
- 👊 **Paper Crushing & Crumpling**: Interactive crumpling simulation with tactile crunch sound effects and persistent crease lines.
- 🔄 **Paper Flipping**: Mirror and flip the sheet over to use both sides.
- 🦢 **Interactive Origami Studio**:
  - Step-by-step interactive folding tutorials.
  - Visual diagram renderings for every step.
  - Dynamic fold-line generation on your sheet.
- 💾 **Export & Save**: One-click high-resolution PNG export of your artwork and torn/folded creations.
- 📱 **PWA & Mobile-First**: Installable on Android, iOS, Windows, and Mac with complete offline support.

---

## 🎮 Controls

| Action | Mouse / Desktop | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Paper** | Click & drag in Move tool (🖐) | Single-finger drag (🖐) |
| **Zoom & Pan** | Scroll Wheel / Pinch Trackpad | 2-Finger Pinch & Spread |
| **Draw / Paint** | Select tool & Left Click Drag | Single-finger drawing |
| **Tear Paper** | Select ✂️ & Click Drag across | Drag across the paper |
| **Crush Paper** | Click 👊 in bottom toolbar | Tap 👊 in bottom toolbar |
| **Flip Paper** | Click 🔄 in bottom toolbar | Tap 🔄 in bottom toolbar |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y` or ↩️ / ↪️ | Tap ↩️ / ↪️ buttons |

---

## 🦢 Included Origami Models

1. **Paper Crane 🦢** (Hard) - Traditional Japanese Orizuru with wing spread.
2. **Paper Boat ⛵** (Easy) - Classic sailing hat-fold boat.
3. **Paper Plane ✈️** (Easy) - Aerodynamic dart glider.
4. **Paper Heart ❤️** (Easy) - Cute rounded corner Valentine fold.
5. **Paper Star ⭐** (Medium) - Puffy 3D lucky origami star.

---

## 🚀 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5 Canvas API, CSS3 Glassmorphism
- **Audio**: Web Audio API (real-time synthesized paper tearing & crunching noise)
- **Offline / PWA**: Service Workers & Web App Manifest
- **Hosting**: GitHub Pages

---

## 📦 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/shivanistalin2006-dot/SinglePaper.git

# Navigate into directory
cd SinglePaper

# Start any local HTTP server (e.g., with Python)
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

---

Made with ❤️ by [Shivani Stalin](https://github.com/shivanistalin2006-dot)
