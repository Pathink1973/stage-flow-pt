/*
  # Enable Realtime for QA Submissions and Rooms Tables

  1. Changes
    - Enable realtime updates for the qa_submissions table
    - Enable realtime updates for the rooms table
    
  2. Notes
    - QA submissions will appear instantly in the control room moderation queue
    - Room settings changes (theme, name, etc.) will update across all connected devices immediately
    - Audience questions submitted via web form will show up in real-time
    - No refresh needed for any room configuration changes
*/

ALTER PUBLICATION supabase_realtime ADD TABLE qa_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;