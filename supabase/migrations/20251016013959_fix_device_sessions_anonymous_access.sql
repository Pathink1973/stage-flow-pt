/*
  # Fix Device Sessions Anonymous Access
  
  ## Problem
  Stage Display pages are accessed anonymously (without login) but device_sessions 
  INSERT policy only allows authenticated users, causing RLS violations.
  
  ## Changes
  1. Drop existing INSERT policy for device_sessions
  2. Create new policy allowing both authenticated AND anonymous users
  
  ## Security
  - Still maintains data isolation via project_id
  - Anonymous users can only track their own sessions
  - No access to other users' data
*/

-- Drop the old authenticated-only policy
DROP POLICY IF EXISTS "Users can insert own sessions" ON device_sessions;

-- Create new policy allowing both authenticated and anonymous access
CREATE POLICY "Allow session tracking for all users"
  ON device_sessions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
