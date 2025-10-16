/*
  # Add public access for Stage Display related tables

  1. Changes
    - Add policies to allow anonymous users to read:
      - timers (for countdown display)
      - cues (for current/next cue information)
      - messages (for overlays and tickers)
    - Only SELECT access is granted
  
  2. Security
    - Anonymous users can only read data
    - No write, update, or delete permissions
    - These tables are needed for the public Stage Display functionality
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
