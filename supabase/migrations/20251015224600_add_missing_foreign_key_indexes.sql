/*
  # Add Missing Foreign Key Indexes for Performance

  ## Overview
  Adds indexes for foreign key columns that were missing indexes, which can lead to suboptimal 
  query performance, especially for JOINs and CASCADE operations.

  ## New Indexes
  
  1. **device_sessions.room_id** - Foreign key to rooms table
     - Used in room-scoped queries and CASCADE deletes
  
  2. **messages.room_id** - Foreign key to rooms table
     - Used in room-scoped queries and CASCADE deletes
  
  3. **room_members.user_id** - Foreign key to profiles table
     - Used in user membership lookups and JOINs
  
  4. **rooms.owner_id** - Foreign key to profiles table
     - Used to find rooms owned by a user
  
  5. **timers.cue_id** - Foreign key to cues table
     - Used to link timers to their associated cues

  ## Performance Impact
  - Faster JOINs between related tables
  - Improved CASCADE delete performance
  - Better query plan optimization for room-scoped queries
  - Reduced table scan overhead

  ## Important Notes
  - These indexes improve both read and write performance
  - CASCADE operations are significantly faster with indexes
  - RLS policy evaluation also benefits from these indexes
*/

-- Add index for device_sessions.room_id
CREATE INDEX IF NOT EXISTS idx_device_sessions_room_id 
  ON device_sessions(room_id);

-- Add index for messages.room_id
CREATE INDEX IF NOT EXISTS idx_messages_room_id 
  ON messages(room_id);

-- Add index for room_members.user_id
CREATE INDEX IF NOT EXISTS idx_room_members_user_id 
  ON room_members(user_id);

-- Add index for rooms.owner_id
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id 
  ON rooms(owner_id);

-- Add index for timers.cue_id
CREATE INDEX IF NOT EXISTS idx_timers_cue_id 
  ON timers(cue_id);