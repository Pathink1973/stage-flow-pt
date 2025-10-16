/*
  # Add Updated_At Trigger for Timers Table

  1. Changes
    - Create a trigger function to automatically update the updated_at timestamp
    - Add trigger to timers table that fires on every UPDATE
    - Ensures updated_at is always current when timer state changes

  2. Notes
    - This is critical for real-time synchronization
    - Clients can use updated_at to detect the latest timer state
    - Helps prevent race conditions and stale data issues
*/

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_timers_updated_at ON timers;

-- Create trigger on timers table
CREATE TRIGGER update_timers_updated_at
  BEFORE UPDATE ON timers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();