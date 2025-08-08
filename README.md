# 🧩 Tetris Kids 🌈

A colorful and engaging Tetris game designed specifically for kids, built with modern JavaScript and HTML5 Canvas.

## ✨ Features

- **Kid-Friendly Design**: Bright colors, fun fonts, and engaging animations
- **Responsive Layout**: Works great on desktop and mobile devices
- **Touch Controls**: Mobile-optimized touch controls for tablets and phones
- **Progressive Difficulty**: Levels that gradually increase in speed
- **Sound Effects**: Engaging audio feedback (with mute option)
- **Achievements**: Fun achievements to keep kids motivated
- **Personal Best Tracking**: Saves high scores locally

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎮 How to Play

- **Arrow Keys**: Move and rotate pieces
  - ← Left Arrow: Move left
  - → Right Arrow: Move right
  - ↓ Down Arrow: Soft drop
  - ↑ Up Arrow: Rotate piece
- **Spacebar**: Hard drop (instant drop)
- **P Key**: Pause/unpause game
- **M Key**: Toggle sound

### Touch Controls (Mobile)

- Use the on-screen buttons for movement and rotation
- Tap the rotate button to turn pieces
- Use directional buttons to move pieces

## 🏗️ Project Structure

```
tetris/
├── src/
│   ├── core/           # Core game engine
│   │   ├── GameEngine.js
│   │   ├── StateManager.js
│   │   └── Constants.js
│   ├── game/           # Game logic
│   ├── input/          # Input handling
│   ├── rendering/      # Canvas rendering
│   ├── ui/             # User interface
│   ├── audio/          # Sound system
│   ├── utils/          # Utility functions
│   ├── assets/         # Game assets
│   ├── tests/          # Unit tests
│   ├── styles/         # CSS styles
│   └── main.js         # Entry point
├── assets/             # Static assets
│   ├── images/
│   ├── sounds/
│   └── fonts/
├── public/             # Public files
└── index.html          # Main HTML file
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Code Style

This project uses ESLint and Prettier for code formatting. The configuration emphasizes:

- Modern JavaScript (ES2021+)
- Consistent formatting
- Error prevention
- Readable code structure

## 🎨 Design Philosophy

**Tetris Kids** is designed with children in mind:

- **Bright, cheerful colors** that appeal to young players
- **Large, easily readable fonts** (Fredoka family)
- **Simple, intuitive controls** that are easy to learn
- **Positive reinforcement** through achievements and encouraging messages
- **No scary game over screens** - just friendly encouragement to try again!
- **Mobile-first responsive design** for play anywhere

## 🔧 Technologies Used

- **Vanilla JavaScript (ES2021+)** - Modern JavaScript without frameworks
- **HTML5 Canvas** - High-performance 2D graphics
- **CSS3** - Modern styling with gradients and animations
- **Vite** - Fast development and building
- **Jest** - Testing framework
- **ESLint & Prettier** - Code quality tools

## 🤝 Contributing

This is a learning project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or creating your own version!

## 🎯 Roadmap

Future enhancements planned:

- [ ] Multiple game themes/skins
- [ ] Multiplayer mode
- [ ] More sound effects and background music
- [ ] Additional game modes (e.g., puzzle mode)
- [ ] Leaderboards
- [ ] More achievements
- [ ] Accessibility improvements
- [ ] PWA support for offline play

## 🐛 Known Issues

- Audio system not yet implemented
- Game logic systems need completion
- Touch controls need refinement

## 📞 Support

If you encounter any issues or have questions, please create an issue in the repository.

---

Made with ❤️ for kids everywhere! 🌈