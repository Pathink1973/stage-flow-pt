/*
  # Fix Stage Display Room Access

  1. Changes
    - Add RLS policy to allow anonymous users to view rooms for stage display
    - This enables the public stage display page to load room information

  2. Security
    - Only SELECT permission granted
    - Anonymous users can view all rooms but cannot modify them
    - This is necessary for the stage display to be publicly accessible
*/

-- Allow anonymous users to view rooms (for Stage Display)
CREATE POLICY "Anyone can view rooms for stage display"
  ON rooms FOR SELECT
  TO anon
  USING (true);
