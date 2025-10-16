/*
  # Fix Stage Display Tables Access

  1. Changes
    - Add RLS policies to allow anonymous users to view timers, cues, and messages
    - This enables the public stage display page to show timer, cue, and message information

  2. Security
    - Only SELECT permission granted to anonymous users
    - Anonymous users can view data but cannot modify it
    - This is necessary for the stage display to be publicly accessible
*/

-- Allow anonymous users to view timers (for Stage Display)
CREATE POLICY "Anyone can view timers for stage display"
  ON timers FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view cues (for Stage Display)
CREATE POLICY "Anyone can view cues for stage display"
  ON cues FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view messages (for Stage Display)
CREATE POLICY "Anyone can view messages for stage display"
  ON messages FOR SELECT
  TO anon
  USING (true);
