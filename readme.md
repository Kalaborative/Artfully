# Artfully - Multiplayer Drawing Game

A real-time multiplayer Pictionary-style drawing game built with React, Node.js, Socket.io, and Appwrite.

## Features

- Real-time multiplayer drawing and guessing
- Multiple drawing tools (pencil, pen, brush, eraser, fill)
- Custom color palette with color picker
- Lobby system with private/public games
- Multiple game modes (Normal and Quick)
- Live leaderboard and statistics
- Chat with guess detection
- Hint system and timer mechanics
- 500+ words across 10+ categories

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for bundling
- Tailwind CSS for styling
- Zustand for state management
- Socket.io-client for real-time communication
- Lucide React for icons
- Appwrite SDK for authentication

### Backend
- Node.js with Express
- TypeScript
- Socket.io for WebSocket communication
- Appwrite Node SDK for database and auth

### Database/Auth
- Appwrite (self-hosted or cloud)

## Project Structure

```
artfully/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── store/          # Zustand stores
│   │   ├── lib/            # Appwrite & Socket config
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── socket/         # Socket.io handlers
│   │   ├── game/           # Game logic
│   │   ├── lobby/          # Lobby management
│   │   ├── routes/         # API routes
│   │   └── ...
│   └── package.json
├── shared/                 # Shared types & constants
│   └── src/
│       ├── types/          # TypeScript interfaces
│       └── constants/      # Game config & events
└── package.json            # Root workspace
```

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Appwrite instance (cloud or self-hosted)

### 1. Clone and Install

```bash
git clone <repository-url>
cd artfully
npm install
```

### 2. Configure Appwrite

1. Create a new Appwrite project
2. Create the following collections in a database called "artfully":

**profiles**
- userId (string, required, indexed)
- username (string, required, indexed)
- displayName (string)
- avatarFileId (string)
- countryCode (string, size: 2)
- biography (string, size: 500)
- isOnline (boolean)
- lastSeenAt (datetime)
- createdAt (datetime)

**user_statistics**
- userId (string, required, indexed)
- gamesPlayed (integer, default: 0)
- gamesWon (integer, default: 0)
- totalPoints (integer, default: 0)
- drawingPoints (integer, default: 0)
- guessingPoints (integer, default: 0)
- correctGuesses (integer, default: 0)
- firstGuesses (integer, default: 0)
- roundsDrawn (integer, default: 0)
- worldRank (integer)
- countryRank (integer)
- currentWinStreak (integer, default: 0)
- bestWinStreak (integer, default: 0)

**words**
- word (string, required, indexed)
- difficulty (enum: easy, medium, hard)
- category (string, indexed)
- hint (string)
- timesUsed (integer, default: 0)
- timesGuessed (integer, default: 0)
- isActive (boolean, default: true)

3. Create a storage bucket called "avatars" for profile pictures

### 3. Environment Variables

Create `.env` files:

**Root .env (for server)**
```env
PORT=3001
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret-min-32-chars
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=artfully
```

**client/.env**
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=artfully
VITE_SERVER_URL=http://localhost:3001
```

### 4. Seed Words (Optional)

The game includes a built-in word bank with 500+ words. To seed them to your database:

```bash
cd server
npx tsx src/scripts/seed-words.ts
```

### 5. Run Development

```bash
npm run dev
```

This starts both the client (port 5173) and server (port 3001).

## Game Rules

1. **Lobby**: Create or join a lobby. Minimum 5 players, maximum 8.
2. **Turns**: Players take turns drawing. Each player draws once per round.
3. **Drawing**: The drawer chooses from 3 words (easy/medium/hard difficulty).
4. **Guessing**: Other players type guesses in the chat.
5. **Scoring**:
   - First correct guesser gets full points
   - Subsequent guessers get points based on remaining time
   - Drawer gets points based on how many people guessed correctly
6. **Hints**: Letters are revealed at 60s, 40s, and 20s remaining.
7. **Timer**: Timer halves when the first person guesses correctly.
8. **Winning**: Player with the most points after all rounds wins.

## API Endpoints

- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update current user profile
- `GET /api/users/:username` - Get user by username
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/words/random` - Get random words (internal)

## Socket Events

See `shared/src/types/socket-events.ts` for all event types.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
