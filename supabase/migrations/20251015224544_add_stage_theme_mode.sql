/*
  # Add Stage Theme Mode to Rooms

  1. Changes
    - Add `stage_theme_mode` column to rooms table
    - This allows users to choose between light and dark mode for the stage display
    - Defaults to 'light' mode for existing and new rooms

  2. Important Notes
    - This is a safe addition that doesn't affect existing data
    - The control room will continue to use local theme preferences
    - Only the stage display will use this setting
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'stage_theme_mode'
  ) THEN
    ALTER TABLE rooms ADD COLUMN stage_theme_mode text DEFAULT 'light' NOT NULL;
    
    ALTER TABLE rooms ADD CONSTRAINT rooms_stage_theme_mode_check 
      CHECK (stage_theme_mode IN ('light', 'dark'));
  END IF;
END $$;