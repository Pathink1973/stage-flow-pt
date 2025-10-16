/*
  # Fix RLS infinite recursion in rooms and room_members tables

  ## Problem
  The rooms SELECT policy references room_members, and room_members policies
  reference rooms, creating a circular dependency that causes infinite recursion.

  ## Solution
  1. Drop the existing problematic policies
  2. Recreate simpler, non-recursive policies
  3. Use direct owner checks without circular references

  ## Changes
  - Drop and recreate rooms SELECT policy without room_members reference
  - Drop and recreate room_members policies without rooms reference  
  - Add simple ownership-based policies that avoid recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Room members can view rooms" ON rooms;
DROP POLICY IF EXISTS "Room members can view membership" ON room_members;
DROP POLICY IF EXISTS "Room owners can manage members" ON room_members;

-- Recreate rooms SELECT policy - only direct owner check, no room_members join
CREATE POLICY "Users can view own rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Recreate room_members policies without referencing rooms table
CREATE POLICY "Users can view own memberships"
  ON room_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert memberships for rooms they own"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update memberships for rooms they own"
  ON room_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete memberships for rooms they own"
  ON room_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_id
      AND rooms.owner_id = auth.uid()
    )
  );
