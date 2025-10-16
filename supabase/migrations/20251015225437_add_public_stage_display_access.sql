/*
  # Add public access for Stage Display

  1. Changes
    - Add policy to allow anonymous users to read rooms table
    - This enables the public Stage Display page to load room data
    - Only SELECT access is granted, no write permissions
  
  2. Security
    - Anonymous users can only read basic room information
    - No access to modify or delete rooms
    - Other tables (timers, cues, messages) will need similar policies
*/

-- Allow anonymous users to view rooms by slug (for Stage Display)
CREATE POLICY "Anyone can view rooms for stage display"
  ON rooms FOR SELECT
  TO anon
  USING (true);
