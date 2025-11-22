# Super Mario Infinite Runner 🎮

A production-ready infinite platformer game with procedural generation, retro music, and full mobile support!

## Features ✨

- 🎵 **Retro 8-bit Music & Sound Effects** - Generated in real-time using Web Audio API
- 🎮 **Infinite Procedural Generation** - Never-ending gameplay with random platform patterns
- 📱 **Fully Mobile Responsive** - Touch controls and optimized for all screen sizes
- 🎨 **Custom Character Upload** - Upload your own images for player and enemies
- 💾 **Best Score Tracking** - Saves your high score locally
- ⏸️ **Pause System** - Pause/resume anytime
- � **3 Enemy kTypes** - Ground enemies, jets, and rockets
- 💰 **Coin Collection** - Collect coins for points
- 🏆 **Score & Distance Tracking** - Track your progress

## How to Play 🕹️

### Desktop Controls
- **Arrow Keys** or **WASD** - Move left/right
- **Space** / **W** / **↑** - Jump
- **ESC** or **P** - Pause/Resume

### Mobile Controls
- **Touch Buttons** - Left, Right, and Jump buttons appear on mobile
- **Responsive Design** - Works on all screen sizes and orientations

## Installation & Running 🚀

### Option 1: Python Server (Recommended)
```bash
cd super-mario-prod
python -m http.server 8082
```
Then open: http://localhost:8082

### Option 2: Node.js Server
```bash
cd super-mario-prod
npx http-server -p 8082
```
Then open: http://localhost:8082

### Option 3: Any Web Server
Simply serve the `super-mario-prod` folder with any web server.

## Audio Troubleshooting 🔊

**Audio not playing?**
- Modern browsers require user interaction before playing audio
- Click the "START GAME" button to enable audio
- Check browser console for any audio errors
- Make sure your device volume is up
- Try refreshing the page if audio stops working

**Audio in different browsers:**
- ✅ Chrome/Edge - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support (may need user interaction)
- ✅ Mobile browsers - Full support

## Customization 🎨

### Upload Custom Images
On the start screen, you can upload custom images for:
- Player character
- Ground enemy
- Jet enemy
- Rocket enemy

Supported formats: PNG, JPG, GIF, WebP

### Modify Game Settings
Edit `game.js` to customize:
- Mario speed: `mario.speed`
- Jump power: `mario.jumpPower`
- Gravity: `mario.gravity`
- Platform generation patterns: `patterns` array
- Enemy spawn rate: Adjust probability in `generatePlatform()`

## File Structure 📁

```
super-mario-prod/
├── index.html      # Main HTML file
├── style.css       # All styles and responsive design
├── game.js         # Game logic, audio, and controls
└── README.md       # This file
```

## Browser Compatibility 🌐

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)

## Performance Optimization ⚡

- Efficient canvas rendering
- Object pooling for platforms/enemies/coins
- Automatic cleanup of off-screen objects
- Optimized collision detection
- Smooth 60 FPS gameplay

## Mobile Optimization 📱

- Touch-action: none for better touch handling
- Dynamic viewport height (dvh) for mobile browsers
- Responsive HUD and controls
- Landscape and portrait mode support
- Optimized button sizes for touch

## Known Issues & Solutions 🔧

**Issue: Audio doesn't start**
- Solution: Click the START GAME button (browsers require user interaction)

**Issue: Game too fast/slow on mobile**
- Solution: The game uses requestAnimationFrame for consistent speed

**Issue: Touch controls not appearing**
- Solution: The game auto-detects mobile devices. Refresh if needed.

## Development 🛠️

To modify the game:

1. Edit `game.js` for game logic
2. Edit `style.css` for styling
3. Edit `index.html` for structure
4. Test on multiple devices and browsers

## Credits 👏

- Inspired by Super Mario Bros
- Built with vanilla JavaScript, HTML5 Canvas, and Web Audio API
- No external dependencies required

## License 📄

Free to use and modify for personal and educational purposes.

## Version 📌

v1.0.0 - Production Ready

---

Enjoy the game! 🎮🍄⭐
