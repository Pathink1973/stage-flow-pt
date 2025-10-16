/*
  # Enable Realtime for Cues Table

  1. Changes
    - Enable realtime updates for the cues table
    - Allows clients to subscribe to cue changes in real-time
    
  2. Notes
    - This enables the real-time subscription functionality for rundown items
    - Cue updates (create, update, delete) will now trigger client-side updates immediately
    - No more need to refresh the page to see cue changes
*/

ALTER PUBLICATION supabase_realtime ADD TABLE cues;