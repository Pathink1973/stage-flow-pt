/*
  # Enable Realtime for Messages Table

  1. Changes
    - Enable realtime updates for the messages table
    - Allows clients to subscribe to message changes in real-time
    
  2. Notes
    - This enables the real-time subscription functionality for stage messages
    - Message updates (create, update, delete, dismiss) will now trigger client-side updates immediately
    - Stage displays will show ticker and overlay messages instantly
    - Control room will see message status changes in real-time
    - This is critical for live event interaction - no refresh needed
*/

ALTER PUBLICATION supabase_realtime ADD TABLE messages;