/*
  # Fix RLS policies for all tables to work with simplified rooms policy

  ## Problem
  After simplifying rooms policy to only check direct ownership, other tables'
  policies that reference rooms will work correctly since they only need to
  check rooms.owner_id.

  ## Solution
  Simplify all policies to directly check room ownership without room_members joins
  to avoid any potential recursion and improve performance.

  ## Changes
  - Drop and recreate all policies for cues, timers, messages, qa_submissions
  - Use direct room ownership checks only
  - Remove complex room_members joins that could cause issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Room members can view cues" ON cues;
DROP POLICY IF EXISTS "Controllers can manage cues" ON cues;
DROP POLICY IF EXISTS "Room members can view timers" ON timers;
DROP POLICY IF EXISTS "Controllers can manage timers" ON timers;
DROP POLICY IF EXISTS "Room members can view messages" ON messages;
DROP POLICY IF EXISTS "Controllers can manage messages" ON messages;
DROP POLICY IF EXISTS "Room members can view Q&A" ON qa_submissions;
DROP POLICY IF EXISTS "Controllers can moderate Q&A" ON qa_submissions;
DROP POLICY IF EXISTS "Public can submit Q&A" ON qa_submissions;

-- Cues policies
CREATE POLICY "Room owners can view cues"
  ON cues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can manage cues"
  ON cues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can update cues"
  ON cues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can delete cues"
  ON cues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = cues.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

-- Timers policies
CREATE POLICY "Room owners can view timers"
  ON timers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can manage timers"
  ON timers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can update timers"
  ON timers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can delete timers"
  ON timers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timers.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Room owners can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can update messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can delete messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = messages.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

-- Q&A Submissions policies
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
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can update Q&A"
  ON qa_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Room owners can delete Q&A"
  ON qa_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = qa_submissions.room_id
      AND rooms.owner_id = auth.uid()
    )
  );