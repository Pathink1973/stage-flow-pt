/*
  # Add Timer Color Settings Table

  1. New Tables
    - `timer_color_settings`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to rooms table)
      - `warning_threshold_sec` (integer) - When to show orange warning color
      - `critical_threshold_sec` (integer) - When to show red critical color
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `timer_color_settings` table
    - Add policy for authenticated room owners/controllers to read their room settings
    - Add policy for authenticated room owners/controllers to insert their room settings
    - Add policy for authenticated room owners/controllers to update their room settings

  3. Important Notes
    - Default warning threshold is 60 seconds (1 minute)
    - Default critical threshold is 15 seconds
    - One settings record per room
*/

CREATE TABLE IF NOT EXISTS timer_color_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL UNIQUE,
  warning_threshold_sec integer DEFAULT 60 NOT NULL,
  critical_threshold_sec integer DEFAULT 15 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timer_color_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read timer color settings for their rooms"
  ON timer_color_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timer color settings for their rooms"
  ON timer_color_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timer color settings for their rooms"
  ON timer_color_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = timer_color_settings.room_id
      AND rooms.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_timer_color_settings_room_id ON timer_color_settings(room_id);