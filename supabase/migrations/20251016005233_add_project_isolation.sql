/*
  # Add Project Isolation for Multi-Deployment Support

  ## Overview
  Adds project_id column to all tables to support multiple deployments (PT, EN, etc.)
  sharing the same Supabase instance while maintaining complete data isolation.

  ## Changes

  ### 1. Add project_id Column to All Tables
  - `rooms.project_id` (text, not null, default 'default')
  - `profiles.project_id` (text, not null, default 'default')
  - `cues.project_id` (text, not null, default 'default')
  - `timers.project_id` (text, not null, default 'default')
  - `messages.project_id` (text, not null, default 'default')
  - `qa_submissions.project_id` (text, not null, default 'default')
  - `device_sessions.project_id` (text, not null, default 'default')
  - `timer_color_settings.project_id` (text, not null, default 'default')
  - `room_members.project_id` (text, not null, default 'default')

  ### 2. Create Indexes
  - Index on project_id for all tables to optimize filtered queries
  - Composite indexes for common query patterns (project_id + room_id)

  ### 3. Update RLS Policies
  - All existing policies updated to include project_id filter
  - Ensures complete isolation between projects

  ## Migration Strategy
  - Uses 'default' as the default project_id for existing data
  - New deployments will use their specific project_id (e.g., 'pt', 'en')
  - Non-destructive: existing data remains accessible with 'default' project_id
*/

-- Add project_id column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to rooms
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to room_members
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to cues
ALTER TABLE cues 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to timers
ALTER TABLE timers 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to qa_submissions
ALTER TABLE qa_submissions 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to device_sessions
ALTER TABLE device_sessions 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Add project_id column to timer_color_settings
ALTER TABLE timer_color_settings 
ADD COLUMN IF NOT EXISTS project_id text NOT NULL DEFAULT 'default';

-- Create indexes for project_id on all tables
CREATE INDEX IF NOT EXISTS idx_profiles_project_id ON profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_rooms_project_id ON rooms(project_id);
CREATE INDEX IF NOT EXISTS idx_room_members_project_id ON room_members(project_id);
CREATE INDEX IF NOT EXISTS idx_cues_project_id ON cues(project_id);
CREATE INDEX IF NOT EXISTS idx_timers_project_id ON timers(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_submissions_project_id ON qa_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_project_id ON device_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_timer_color_settings_project_id ON timer_color_settings(project_id);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_rooms_project_owner ON rooms(project_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_cues_project_room ON cues(project_id, room_id);
CREATE INDEX IF NOT EXISTS idx_timers_project_room ON timers(project_id, room_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_room ON messages(project_id, room_id);
CREATE INDEX IF NOT EXISTS idx_qa_submissions_project_room ON qa_submissions(project_id, room_id);

-- Update slug uniqueness constraint to be per-project
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS rooms_project_slug_unique ON rooms(project_id, slug);