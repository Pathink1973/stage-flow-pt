# StageFlow

A professional remote timer and event management system for live productions, featuring real-time synchronization, neumorphic design, and comprehensive control capabilities.

## Features

### Timer Management
- **Multiple Timer Types**: Countdown, stopwatch, and clock modes
- **Quick Presets**: 5, 10, 15, 30, and 45-minute quick timers
- **Manual Controls**: Start, pause, reset, and time adjustment (±30 seconds)
- **Overrun Display**: Clear visual indication when timers exceed their duration
- **Real-time Synchronization**: All connected devices update instantly

### Rundown & Cue Management
- **Create & Edit Cues**: Full CRUD operations for event rundown items
- **Cue Details**: Title, speaker, duration, and private notes
- **Auto-Advance**: Automatically load the next cue when the current timer completes
- **Visual Indicators**: See which cue is currently active
- **Drag to Reorder**: Intuitive cue ordering (visual indicators included)

### Stage Display
- **Fullscreen Mode**: Clean, distraction-free display for presenters
- **Progress Visualization**: Bar or ring progress indicators
- **Current & Next Cue**: Shows current session and what's coming up
- **Message Overlays**: Real-time messages from control room
- **Responsive Design**: Adapts to any screen size

### Message Center
- **Two Display Types**:
  - **Ticker**: Bottom banner for non-urgent messages
  - **Overlay**: Full-screen overlay for critical announcements
- **Priority Levels**: Info, Warning, and Alert
- **Active Management**: Send, view history, and dismiss messages
- **Real-time Delivery**: Instant display on stage screens

### Q&A System
- **Public Submission**: Audience can submit questions via web link or QR code
- **Moderation Queue**: Review, approve, or reject submissions
- **Status Tracking**: Pending, approved, rejected, and answered states
- **Anonymous Support**: Optional author names
- **Real-time Updates**: Control room sees submissions instantly

### Theming System
- **Neumorphic Design**: Soft, raised surfaces with subtle shadows
- **Light & Dark Modes**: Switch between color schemes
- **Intensity Control**: Low, medium, or high neumorphism effects
- **Persistent Settings**: Theme preferences saved locally
- **Real-time Preview**: See changes immediately across all views

### Room Management
- **Multiple Rooms**: Create and manage multiple event rooms
- **Shareable Links**: Generate links for stage display and Q&A
- **QR Code Generation**: Easy audience access to Q&A
- **Back to Dashboard**: Quick navigation between rooms

### Security & Access
- **Authentication**: Email/password login via Supabase Auth
- **Row Level Security**: Database policies protect user data
- **Role-based Access**: Owner, controller, assistant, viewer roles
- **Device Tracking**: Monitor active connections per room

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom neumorphic utilities
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime channels
- **Authentication**: Supabase Auth
- **Routing**: React Router v7
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run migrations (handled automatically via Supabase MCP)

5. Start development server:
   ```bash
   npm run dev
   ```

## Usage

### Creating a Room
1. Sign up or log in
2. Click "New Room" on the dashboard
3. Enter your event name
4. Access the Control Room

### Setting Up a Rundown
1. In the Control Room, click "Add Cue"
2. Fill in title, speaker (optional), duration, and notes
3. Create multiple cues for your event schedule
4. Click on any cue to load it into the timer

### Running an Event
1. Open the Stage Display link on a separate device/screen
2. Use Control Room to manage timers and cues
3. Send messages to the stage as needed
4. Share the Q&A link with your audience
5. Moderate incoming questions in real-time

### Using Quick Timers
- Click any preset button (5, 10, 15, 30, 45 min)
- Timer loads immediately and is ready to start
- Perfect for breaks, Q&A sessions, or impromptu timing needs

### Sending Stage Messages
1. Type your message in the Message Center
2. Select type (Ticker or Overlay)
3. Choose priority level (Info, Warning, Alert)
4. Click "Send to Stage"
5. Message appears immediately on stage displays
6. Dismiss when no longer needed

## Architecture

### Database Schema
- **profiles**: User accounts and subscription status
- **rooms**: Event rooms with settings and themes
- **room_members**: Access control and roles
- **cues**: Rundown items with timing and metadata
- **timers**: Active timer state with real-time tracking
- **messages**: Stage messages with display settings
- **qa_submissions**: Audience questions with moderation
- **device_sessions**: Active connection tracking

### Real-time Channels
- Timer state synchronization
- Cue updates
- Message delivery
- Q&A submissions

### Custom Hooks
- `useTimer`: Timer operations and real-time updates
- `useAutoAdvance`: Automatic cue progression
- `useDeviceSession`: Connection tracking and heartbeat
- `useTheme`: Theme management and persistence

## Design System

### Neumorphism
- Raised surfaces for interactive elements
- Inset effects for inputs and pressed states
- Consistent shadow system with intensity levels
- Smooth transitions and micro-interactions

### Color Tokens
- Primary accent: Blue (#3B82F6 / #60A5FA)
- Success: Green (#16A34A / #22C55E)
- Warning: Amber (#F59E0B / #FBBF24)
- Danger: Red (#EF4444 / #F87171)

### Typography
- Font: Inter
- Heading weights: 700
- Body weight: 400-500
- Timer display: Monospace numerals

## PWA Support
- Manifest file configured
- Fullscreen API for stage displays
- Optimized for installation
- Offline-ready architecture

## Building for Production

```bash
npm run build
```

Output is generated in the `dist/` directory, ready for deployment.

## License

MIT
