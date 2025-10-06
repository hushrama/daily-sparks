/*
  # Add Saved Sparks Table

  ## Overview
  This migration creates a table to store sparks that users have saved for later.

  ## New Tables
  1. **saved_sparks**
     - `id` (uuid, primary key) - Unique identifier for the saved spark entry
     - `user_id` (uuid, references auth.users) - The user who saved the spark
     - `spark_id` (uuid, references sparks) - The spark that was saved
     - `created_at` (timestamptz, default now()) - When the spark was saved

  ## Security
  1. Enable Row Level Security (RLS) on saved_sparks table
  2. Policy: Users can only view their own saved sparks
  3. Policy: Users can save sparks
  4. Policy: Users can unsave their own saved sparks

  ## Important Notes
  - A user can only save a spark once (unique constraint)
  - Deleting a spark will cascade delete saved references
*/

-- Create saved_sparks table
CREATE TABLE IF NOT EXISTS saved_sparks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spark_id uuid REFERENCES sparks(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, spark_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS saved_sparks_user_id_idx ON saved_sparks(user_id);
CREATE INDEX IF NOT EXISTS saved_sparks_spark_id_idx ON saved_sparks(spark_id);

-- Enable Row Level Security
ALTER TABLE saved_sparks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved sparks
CREATE POLICY "Users can view their own saved sparks"
  ON saved_sparks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can save sparks
CREATE POLICY "Users can save sparks"
  ON saved_sparks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unsave their own saved sparks
CREATE POLICY "Users can unsave sparks"
  ON saved_sparks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
