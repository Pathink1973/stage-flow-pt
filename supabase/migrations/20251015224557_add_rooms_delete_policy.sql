/*
  # Add DELETE policy for rooms table

  ## Changes
  - Adds DELETE policy to rooms table allowing owners to delete their own rooms
  
  ## Security
  - Only room owners can delete rooms (verified by owner_id = auth.uid())
  - Cascading deletes are already configured in the schema for related data:
    - room_members (ON DELETE CASCADE)
    - cues (ON DELETE CASCADE)
    - timers (ON DELETE CASCADE)
    - messages (ON DELETE CASCADE)
    - qa_submissions (ON DELETE CASCADE)
    - device_sessions (ON DELETE CASCADE)

  ## Important Notes
  1. This policy was missing from the original schema migration
  2. Without this policy, RLS blocks all room deletions
  3. All related data will be automatically deleted due to CASCADE constraints
*/

-- Add DELETE policy for rooms table
CREATE POLICY "Owners can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());