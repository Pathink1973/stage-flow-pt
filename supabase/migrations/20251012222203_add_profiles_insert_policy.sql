/*
  # Add INSERT policy for profiles table

  ## Changes
  - Add policy to allow authenticated users to insert their own profile
  - This allows the ensureProfile function to work correctly

  ## Security
  - Users can only insert a profile with their own auth.uid()
  - Prevents users from creating profiles for other users
*/

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
