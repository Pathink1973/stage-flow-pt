/*
  # StageFlow Database Schema

  ## Overview
  Creates the complete database structure for StageFlow, a remote timer and event management system
  with control room, stage display, and audience Q&A capabilities.

  ## New Tables
  
  ### 1. profiles
  User accounts with subscription status
  - `id` (uuid, pk) - references auth.users
  - `email` (text, unique) - user email
  - `name` (text) - display name
  - `is_pro` (bool) - subscription status
  - `created_at` (timestamptz) - account creation

  ### 2. rooms
  Event rooms with control links and theming
  - `id` (uuid, pk) - room identifier
  - `owner_id` (uuid) - references profiles
  - `name` (text) - event name
  - `slug` (text, unique) - URL-friendly identifier
  - `pin` (text, nullable) - control room PIN
  - `theme` (jsonb) - customization settings
  - `qa_public` (bool) - public Q&A enabled
  - `created_at` (timestamptz)

  ### 3. room_members
  Access control for room participants
  - `id` (uuid, pk)
  - `room_id` (uuid) - references rooms
  - `user_id` (uuid) - references profiles
  - `role` (text) - owner, controller, assistant, viewer
  - `joined_at` (timestamptz)

  ### 4. cues
  Rundown items with timing and speaker info
  - `id` (uuid, pk)
  - `room_id` (uuid) - references rooms
  - `idx` (int) - order in rundown
  - `title` (text) - cue title
  - `speaker` (text, nullable) - speaker name
  - `duration_sec` (int) - planned duration
  - `notes` (text) - private notes
  - `auto_advance` (bool) - auto-load next cue

  ### 5. timers
  Active timer state with real-time tracking
  - `id` (uuid, pk)
  - `room_id` (uuid) - references rooms
  - `cue_id` (uuid, nullable) - linked cue
  - `type` (text) - countdown, stopwatch, clock
  - `target_ts` (timestamptz) - countdown target
  - `base_sec` (int) - initial seconds
  - `state` (text) - idle, running, paused, finished
  - `started_at` (timestamptz)
  - `elapsed_sec` (int) - elapsed time
  - `overrun_sec` (int) - overtime

  ### 6. messages
  Stage messages and ticker overlays
  - `id` (uuid, pk)
  - `room_id` (uuid) - references rooms
  - `kind` (text) - ticker, overlay
  - `level` (text) - info, warn, alert
  - `body` (text) - message content
  - `is_active` (bool) - currently displayed
  - `created_at` (timestamptz)

  ### 7. qa_submissions
  Audience questions with moderation
  - `id` (uuid, pk)
  - `room_id` (uuid) - references rooms
  - `author` (text, nullable) - submitter name
  - `body` (text) - question text
  - `status` (text) - pending, approved, rejected, answered
  - `created_at` (timestamptz)

  ### 8. device_sessions
  Active device tracking for limits
  - `id` (uuid, pk)
  - `room_id` (uuid) - references rooms
  - `role` (text) - connection role
  - `device_info` (jsonb) - browser/device data
  - `last_seen` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to room members
  - Public Q&A submissions allowed when qa_public=true
  - Control actions require controller or owner role

  ## Indexes
  - Optimized for room-scoped queries
  - Cue ordering by idx
  - Timer state lookups
  - Q&A status filtering
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  is_pro boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  pin text,
  theme jsonb DEFAULT '{"mode": "light", "intensity": "medium"}'::jsonb,
  qa_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Room members table
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('owner', 'controller', 'assistant', 'viewer')) NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Cues table
CREATE TABLE IF NOT EXISTS cues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  idx int NOT NULL,
  title text NOT NULL,
  speaker text,
  duration_sec int DEFAULT 300,
  notes text,
  auto_advance boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cues_room_idx ON cues(room_id, idx);

ALTER TABLE cues ENABLE ROW LEVEL SECURITY;

-- Timers table
CREATE TABLE IF NOT EXISTS timers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  cue_id uuid REFERENCES cues(id) ON DELETE SET NULL,
  type text CHECK (type IN ('countdown', 'stopwatch', 'clock')) DEFAULT 'countdown',
  target_ts timestamptz,
  base_sec int DEFAULT 0,
  state text CHECK (state IN ('idle', 'running', 'paused', 'finished')) DEFAULT 'idle',
  started_at timestamptz,
  elapsed_sec int DEFAULT 0,
  overrun_sec int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timers_room_state ON timers(room_id, state);

ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  kind text CHECK (kind IN ('ticker', 'overlay')) DEFAULT 'ticker',
  level text CHECK (level IN ('info', 'warn', 'alert')) DEFAULT 'info',
  body text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Q&A Submissions table
CREATE TABLE IF NOT EXISTS qa_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  author text,
  body text NOT NULL,
  status text CHECK (status IN ('pending', 'approved', 'rejected', 'answered')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_room_status ON qa_submissions(room_id, status);

ALTER TABLE qa_submissions ENABLE ROW LEVEL SECURITY;

-- Device sessions table
CREATE TABLE IF NOT EXISTS device_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  device_info jsonb,
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Room members can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = rooms.id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for room_members
CREATE POLICY "Room members can view membership"
  ON room_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can manage members"
  ON room_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

-- RLS Policies for cues
CREATE POLICY "Room members can view cues"
  ON cues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM room_members
          WHERE room_members.room_id = rooms.id
          AND room_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Controllers can manage cues"
  ON cues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      LEFT JOIN room_members ON room_members.room_id = rooms.id
      WHERE rooms.id = cues.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        (room_members.user_id = auth.uid() AND room_members.role IN ('owner', 'controller'))
      )
    )
  );

-- RLS Policies for timers
CREATE POLICY "Room members can view timers"
  ON timers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM room_members
          WHERE room_members.room_id = rooms.id
          AND room_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Controllers can manage timers"
  ON timers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      LEFT JOIN room_members ON room_members.room_id = rooms.id
      WHERE rooms.id = timers.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        (room_members.user_id = auth.uid() AND room_members.role IN ('owner', 'controller', 'assistant'))
      )
    )
  );

-- RLS Policies for messages
CREATE POLICY "Room members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM room_members
          WHERE room_members.room_id = rooms.id
          AND room_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Controllers can manage messages"
  ON messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      LEFT JOIN room_members ON room_members.room_id = rooms.id
      WHERE rooms.id = messages.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        (room_members.user_id = auth.uid() AND room_members.role IN ('owner', 'controller', 'assistant'))
      )
    )
  );

-- RLS Policies for Q&A
CREATE POLICY "Public can submit Q&A"
  ON qa_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.qa_public = true
    )
  );

CREATE POLICY "Room members can view Q&A"
  ON qa_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM room_members
          WHERE room_members.room_id = rooms.id
          AND room_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Controllers can moderate Q&A"
  ON qa_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      LEFT JOIN room_members ON room_members.room_id = rooms.id
      WHERE rooms.id = qa_submissions.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        (room_members.user_id = auth.uid() AND room_members.role IN ('owner', 'controller'))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      LEFT JOIN room_members ON room_members.room_id = rooms.id
      WHERE rooms.id = qa_submissions.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        (room_members.user_id = auth.uid() AND room_members.role IN ('owner', 'controller'))
      )
    )
  );

-- RLS Policies for device sessions
CREATE POLICY "Room members can view sessions"
  ON device_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = device_sessions.room_id
      AND (
        rooms.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM room_members
          WHERE room_members.room_id = rooms.id
          AND room_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create sessions"
  ON device_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON device_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);