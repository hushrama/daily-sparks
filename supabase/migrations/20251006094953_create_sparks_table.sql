/*
  # Create Sparks Table for Daily Sparks App

  ## Overview
  This migration creates the core sparks table for the Daily Sparks social app where users can post one inspirational thought per day.

  ## New Tables
  1. **sparks**
     - `id` (uuid, primary key) - Unique identifier for each spark
     - `user_id` (uuid, references auth.users) - The user who created the spark
     - `content` (text, not null) - The spark text content (inspiration/thought)
     - `created_at` (timestamptz, default now()) - When the spark was created

  ## Security
  1. Enable Row Level Security (RLS) on sparks table
  2. Policy: Users can read all sparks (public feed)
  3. Policy: Users can insert their own sparks only
  4. Policy: Users can update their own sparks only
  5. Policy: Users can delete their own sparks only

  ## Important Notes
  - Each user should only be able to post one spark per day (enforced in app logic)
  - All sparks are publicly readable for the feed feature
  - Users can only modify their own sparks
*/

-- Create sparks table
CREATE TABLE IF NOT EXISTS sparks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries by user and date
CREATE INDEX IF NOT EXISTS sparks_user_id_idx ON sparks(user_id);
CREATE INDEX IF NOT EXISTS sparks_created_at_idx ON sparks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sparks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (authenticated) can read all sparks
CREATE POLICY "Users can view all sparks"
  ON sparks
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own sparks
CREATE POLICY "Users can create their own sparks"
  ON sparks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sparks
CREATE POLICY "Users can update their own sparks"
  ON sparks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sparks
CREATE POLICY "Users can delete their own sparks"
  ON sparks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);