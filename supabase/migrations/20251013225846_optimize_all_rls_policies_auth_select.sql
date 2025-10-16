/*
  # Optimize All RLS Policies with Auth Initialization Pattern

  ## Overview
  Optimizes ALL RLS policies by using (select auth.uid()) instead of auth.uid().
  This prevents re-evaluation of auth functions for each row, significantly improving 
  query performance at scale.

  ## Performance Impact
  - Reduces auth function calls from O(n) to O(1) per query
  - Improves query planning and execution time
  - Better performance with large datasets
  - Recommended by Supabase best practices

  ## Changes
  Drops and recreates all existing policies with the optimized pattern:
  - auth.uid() → (select auth.uid())
  
  Affected tables:
  1. profiles (3 policies)
  2. rooms (4 policies)
  3. room_members (4 policies)
  4. cues (4 policies)
  5. timers (4 policies)
  6. messages (4 policies)
  7. qa_submissions (3 policies)
  8. device_sessions (3 policies)
  9. timer_color_settings (3 policies)

  ## Important Notes
  - All policies maintain exact same logic, only optimization added
  - No security changes, only performance improvements
  - Uses SELECT to initialize auth context once per query
*/

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- ROOMS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can create rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can update rooms" ON rooms;
DROP POLICY IF EXISTS "Owners can delete rooms" ON rooms;

CREATE POLICY "Users can view own rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Owners can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- ============================================================================
-- ROOM_MEMBERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own memberships" ON room_members;
DROP POLICY IF EXISTS "Users can insert memberships for rooms they own" ON room_members;
DROP POLICY IF EXISTS "Users can update memberships for rooms they own" ON room_members;
DROP POLICY IF EXISTS "Users can delete memberships for rooms they own" ON room_members;

CREATE POLICY "Users can view own memberships"
  ON room_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert memberships for rooms they own"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update memberships for rooms they own"
  ON room_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete memberships for rooms they own"
  ON room_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- CUES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Room owners can view cues" ON cues;
DROP POLICY IF EXISTS "Room owners can manage cues" ON cues;
DROP POLICY IF EXISTS "Room owners can update cues" ON cues;
DROP POLICY IF EXISTS "Room owners can delete cues" ON cues;

CREATE POLICY "Room owners can view cues"
  ON cues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can manage cues"
  ON cues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can update cues"
  ON cues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can delete cues"
  ON cues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- TIMERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Room owners can view timers" ON timers;
DROP POLICY IF EXISTS "Room owners can manage timers" ON timers;
DROP POLICY IF EXISTS "Room owners can update timers" ON timers;
DROP POLICY IF EXISTS "Room owners can delete timers" ON timers;

CREATE POLICY "Room owners can view timers"
  ON timers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can manage timers"
  ON timers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can update timers"
  ON timers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can delete timers"
  ON timers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Room owners can view messages" ON messages;
DROP POLICY IF EXISTS "Room owners can create messages" ON messages;
DROP POLICY IF EXISTS "Room owners can update messages" ON messages;
DROP POLICY IF EXISTS "Room owners can delete messages" ON messages;

CREATE POLICY "Room owners can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- QA_SUBMISSIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can submit Q&A" ON qa_submissions;
DROP POLICY IF EXISTS "Room owners can view Q&A" ON qa_submissions;
DROP POLICY IF EXISTS "Room owners can update Q&A" ON qa_submissions;
DROP POLICY IF EXISTS "Room owners can delete Q&A" ON qa_submissions;

CREATE POLICY "Anyone can submit Q&A"
  ON qa_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.qa_public = true
    )
  );

CREATE POLICY "Room owners can view Q&A"
  ON qa_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can update Q&A"
  ON qa_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Room owners can delete Q&A"
  ON qa_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- DEVICE_SESSIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Room members can view sessions" ON device_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON device_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON device_sessions;

CREATE POLICY "Room members can view sessions"
  ON device_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = device_sessions.room_id
      AND rooms.owner_id = (select auth.uid())
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

-- ============================================================================
-- TIMER_COLOR_SETTINGS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can read timer color settings for their rooms" ON timer_color_settings;
DROP POLICY IF EXISTS "Users can insert timer color settings for their rooms" ON timer_color_settings;
DROP POLICY IF EXISTS "Users can update timer color settings for their rooms" ON timer_color_settings;

CREATE POLICY "Users can read timer color settings for their rooms"
  ON timer_color_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert timer color settings for their rooms"
  ON timer_color_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update timer color settings for their rooms"
  ON timer_color_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = (select auth.uid())
    )
  );
