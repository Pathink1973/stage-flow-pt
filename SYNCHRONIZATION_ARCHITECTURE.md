# Timer Synchronization Architecture

## Overview

This application now uses a professional-grade, centralized timer synchronization system that ensures perfect harmony between the timer controller, stage preview, and shared stage display.

## Core Architecture

### 1. TimerSyncManager (Singleton Service)

**Location:** `src/services/TimerSyncManager.ts`

The centralized synchronization manager that coordinates all timer state across the entire application.

**Key Features:**
- **Single Source of Truth:** All timer state flows through one manager
- **Version-Based Sync:** Each state update has a version number to prevent out-of-order updates
- **Timestamp Authority:** Uses server timestamps to prevent client clock drift
- **Connection Health Monitoring:** Tracks connection quality (excellent, good, degraded, poor)
- **Automatic Reconnection:** Exponential backoff strategy for failed connections
- **Heartbeat System:** Periodic health checks every 15 seconds
- **Drift Detection:** Calculates and reports time drift between client and server

**How It Works:**
1. Components subscribe to timer updates for a specific room
2. Manager maintains a single realtime subscription per room
3. All subscribers receive synchronized updates simultaneously
4. Time calculations are centralized to ensure consistency

### 2. useTimerSync Hook

**Location:** `src/hooks/useTimerSync.ts`

A modern replacement for the old `useTimer` hook that integrates with TimerSyncManager.

**Returns:**
- `timer`: Current timer state from database
- `currentTime`: Real-time calculated display time
- `elapsed`: Current elapsed seconds
- `isOverrun`: Whether timer has exceeded its duration
- `loading`: Initial loading state
- `updating`: Whether an update operation is in progress
- `connected`: Connection status
- `syncStatus`: Detailed sync health information
- `startTimer()`: Start the timer
- `pauseTimer()`: Pause the timer
- `resetTimer()`: Reset timer to idle
- `adjustTimer(seconds)`: Adjust timer duration
- `refreshTimer()`: Force refresh from database

**Key Improvements:**
- Uses requestAnimationFrame for smooth 60fps updates
- Centralized time calculations prevent display drift
- Automatic state synchronization across all components
- Built-in connection status monitoring

### 3. Optimized TimerDisplay Component

**Location:** `src/components/timer/TimerDisplay.tsx`

Simplified display component that receives pre-calculated values.

**Changes:**
- Removed local time calculation logic
- Receives `currentTime`, `elapsed`, and `isOverrun` as props
- Uses `useMemo` for color state calculations
- No longer manages internal state or animation frames
- Pure rendering component for maximum performance

### 4. SyncStatusIndicator Component

**Location:** `src/components/sync/SyncStatusIndicator.tsx`

Visual feedback for synchronization health.

**Features:**
- Compact mode for minimal UI footprint
- Full mode with detailed sync information
- Color-coded status (green/blue/orange/red)
- Shows connection state and drift time
- Auto-hides when sync is excellent

**Status Levels:**
- **Excellent:** < 100ms drift, perfect sync
- **Good:** < 500ms drift, acceptable
- **Degraded:** < 2000ms drift, slow connection
- **Poor:** > 2000ms drift or disconnected

### 5. Enhanced Auto-Advance System

**Location:** `src/hooks/useAutoAdvance.ts`

Coordinated cue transitions using centralized time calculations.

**Improvements:**
- Uses TimerSyncManager for time calculations
- Prevents duplicate auto-advance triggers
- More frequent checks (250ms vs 1000ms)
- Synchronized with timer display state

## Data Flow

```
Database (Supabase)
    ↓
TimerSyncManager (singleton)
    ↓ (broadcasts to all subscribers)
    ├─→ ControlRoom (useTimerSync)
    │       ↓
    │   TimerDisplay + Controls
    │
    ├─→ StageDisplay (useTimerSync)
    │       ↓
    │   TimerDisplay (full screen)
    │
    └─→ StageDisplayPreview (useTimerSync)
            ↓
        TimerDisplay (miniature)
```

## Synchronization Guarantees

### 1. Frame-Perfect Updates
All displays update at the same frame using the same calculations, ensuring visual synchronization.

### 2. Timestamp-Based Ordering
Updates are ordered by server timestamp, preventing race conditions from network latency variations.

### 3. Drift Compensation
The system detects and reports time drift, allowing for automatic correction when drift exceeds thresholds.

### 4. Connection Resilience
- Automatic reconnection with exponential backoff
- Periodic heartbeat checks
- Graceful degradation during poor connections
- Manual refresh capability

### 5. Optimistic Updates
Timer control actions (start/pause/reset) apply immediately to the database, with synchronization propagating through the centralized manager.

## Performance Optimizations

### 1. Single Subscription Per Room
Only one realtime subscription is created per room, regardless of how many components need timer data.

### 2. Centralized Calculations
Time calculations happen once in TimerSyncManager, not separately in each display component.

### 3. Efficient Animation Frames
A single requestAnimationFrame loop updates all calculated values, preventing multiple concurrent loops.

### 4. Memoized Rendering
Display components use `useMemo` to prevent unnecessary recalculations and re-renders.

### 5. Subscription Cleanup
Unused subscriptions are automatically cleaned up when the last component unsubscribes.

## Connection Health Monitoring

### Metrics Tracked
- **Connection Status:** Connected vs. Disconnected
- **Last Sync Time:** Timestamp of most recent update
- **Time Drift:** Difference between local and server time
- **Health Score:** Calculated from drift and connection stability

### Automatic Actions
- Reconnection attempts with exponential backoff (max 5 attempts)
- Heartbeat checks every 15 seconds
- Force refresh after 60 seconds of no updates
- Visual indicators for connection issues

## Testing Synchronization

### Verification Steps

1. **Multi-Display Test:**
   - Open Control Room
   - Open Stage Display in new window
   - Start timer
   - Verify both displays show identical time

2. **Network Resilience Test:**
   - Start a timer
   - Disable network briefly
   - Re-enable network
   - Verify automatic reconnection and sync

3. **Cross-Device Test:**
   - Open Control Room on one device
   - Open Stage Display on another device
   - Control timer from first device
   - Verify second device updates in real-time

4. **Cue Transition Test:**
   - Load a cue with auto-advance enabled
   - Let timer reach zero
   - Verify next cue loads automatically
   - Check that preview and stage remain in sync

## Migration Notes

### Old System (useTimer)
- Each component had its own realtime subscription
- Local time calculations in each display
- Potential for drift between displays
- Optimistic updates without coordination
- Manual connection management

### New System (useTimerSync + TimerSyncManager)
- Single subscription per room
- Centralized time calculations
- Guaranteed synchronization
- Coordinated optimistic updates
- Automatic connection health management

### Breaking Changes
None! The new system is a drop-in replacement. All existing components work with the new hook by using the additional return values (`currentTime`, `elapsed`, `isOverrun`).

## Future Enhancements

Potential improvements for even better synchronization:

1. **WebSocket Priority Channel:** Direct WebSocket for timer updates
2. **Predictive Sync:** Anticipate network delays and compensate
3. **Multi-Controller Locking:** Prevent simultaneous control conflicts
4. **Sync Verification Tests:** Automated testing of cross-display sync
5. **Performance Metrics Dashboard:** Real-time monitoring of sync quality

## Conclusion

The new synchronization architecture provides professional-grade, frame-perfect synchronization across all timer displays in the application. The centralized manager ensures that the timer controller, stage preview, and shared stage display are always perfectly in harmony, with built-in resilience for network issues and comprehensive health monitoring.
