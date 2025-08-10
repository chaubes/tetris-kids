# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev         # Start development server on http://localhost:3000
npm run build       # Build for production (outputs to dist/)
npm run preview     # Preview production build
```

### Testing
```bash
npm test                          # Run all tests
npm run test:watch               # Run tests in watch mode
npx jest src/tests/StateManager.test.js  # Run specific test file
npx playwright test              # Run E2E tests (requires Docker on port 7301)
npx playwright test --project=chromium    # Run E2E tests on specific browser
```

### Code Quality
```bash
npm run lint            # Check code with ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check if code needs formatting
```

### Docker Deployment
```bash
./docker-deploy.sh              # One-command Docker deployment
docker compose up -d            # Start production container on port 7301
docker compose down             # Stop container
docker compose logs -f          # View container logs
docker compose up -d --build    # Rebuild and restart
```

### Git Operations
```bash
git push                        # Push to https://github.com/chaubes/tetris-kids
```

## Architecture Overview

### Core Systems Structure
The game follows a modular architecture with clear separation of concerns:

1. **GameEngine** (`src/core/GameEngine.js`) - Central orchestrator that manages:
   - Game loop with fixed timestep (60 FPS)
   - System registration and coordination
   - State transitions through StateManager
   - Input buffering and processing

2. **StateManager** (`src/core/StateManager.js`) - Handles game state transitions:
   - States: MENU, PLAYING, PAUSED, GAME_OVER
   - Event-driven state changes
   - State persistence to localStorage

3. **Game Logic Layer** (`src/game/`) - Core Tetris mechanics:
   - **GameLogic**: Board management, piece placement, line clearing
   - **PieceGenerator**: 7-bag randomization algorithm with wall kicks
   - **CollisionDetector**: Boundary checking, T-spin detection
   - **ScoreManager**: Scoring system with achievements

4. **Rendering Pipeline** (`src/rendering/`) - Canvas-based rendering:
   - **CanvasRenderer**: Responsive canvas sizing, mobile optimization
   - **AnimationManager**: Particle effects, line clear animations

5. **Input System** (`src/input/InputController.js`) - Unified input handling:
   - Keyboard controls with repeat rates
   - Touch controls for mobile (60px buttons)
   - Swipe gestures (left/right move, up rotate, down soft drop)
   - Input buffering for smooth gameplay

6. **Audio System** (`src/audio/`) - Programmatic audio generation:
   - **AudioManager**: Web Audio API orchestration
   - **MusicPlayer**: Procedural background music
   - **SoundEffects**: Action-based sound generation

### Key Design Patterns

1. **Event-Driven Architecture**: Systems communicate through events
   ```javascript
   stateManager.on('stateChanged', (oldState, newState) => {...})
   inputController.on('input', ({ action, type }) => {...})
   ```

2. **System Registration Pattern**: Modular system management
   ```javascript
   gameEngine.registerSystem('renderer', canvasRenderer)
   ```

3. **Fixed Timestep Game Loop**: Consistent physics regardless of framerate
   ```javascript
   accumulator += deltaTime;
   while (accumulator >= fixedTimeStep) {
     update(fixedTimeStep);
     accumulator -= fixedTimeStep;
   }
   ```

### Mobile Optimizations

1. **Viewport Configuration**: Prevents zoom and ensures proper scaling
2. **Touch Controls**: Large buttons (60px) with visual feedback
3. **Canvas Scaling**: Device pixel ratio capped at 2 for performance
4. **Reduced Particles**: 20 max particles on mobile vs 50 on desktop
5. **Hardware Acceleration**: CSS transforms and will-change properties

### Production Deployment

The app is containerized with Docker for production:
- Multi-stage build (Node.js builder → Nginx server)
- Security hardened (non-root user, read-only filesystem)
- Resource limits (0.5 CPU, 128MB memory)
- Health checks and automatic restarts
- Exposed on port 7301

### Testing Strategy

1. **Unit Tests**: Jest with JSDOM for game logic
2. **E2E Tests**: Playwright for browser automation
3. **Mobile Tests**: Device emulation for iPhone/Android
4. **Smoke Tests**: Quick validation of core functionality

### Performance Considerations

1. **Canvas Rendering**: 
   - Double buffering for smooth animations
   - Dirty rectangle optimization
   - RequestAnimationFrame for optimal frame timing

2. **Mobile Performance**:
   - Reduced particle effects
   - Optimized touch event handling
   - Debounced resize events (250ms)

3. **Memory Management**:
   - Particle pool reuse
   - Event listener cleanup in destroy methods
   - Limited input buffer size

### Development Workflow

1. **Local Development**: Vite dev server with HMR
2. **Testing**: Jest for unit tests, Playwright for E2E
3. **Building**: Vite production build with minification
4. **Deployment**: Docker container on port 7301

The codebase emphasizes modularity, performance, and mobile-first design while maintaining the fun, kid-friendly aesthetic throughout.