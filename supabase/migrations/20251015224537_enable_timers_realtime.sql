/*
  # Enable Realtime for Timers Table

  1. Changes
    - Enable realtime updates for the timers table
    - Allows clients to subscribe to timer changes in real-time

  2. Notes
    - This enables the real-time subscription functionality
    - Timer updates will now trigger client-side updates immediately
*/

ALTER PUBLICATION supabase_realtime ADD TABLE timers;