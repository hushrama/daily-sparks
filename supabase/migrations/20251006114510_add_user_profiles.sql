/*
  # Add User Profiles Table

  ## Overview
  This migration adds a profiles table to store user information including username and avatar.

  ## New Tables
  1. **profiles**
     - `id` (uuid, primary key, references auth.users)
     - `username` (text, unique, not null) - User's chosen username
     - `avatar` (text, not null) - Avatar identifier (icon name or URL)
     - `created_at` (timestamptz, default now()) - Profile creation timestamp
     - `updated_at` (timestamptz, default now()) - Last update timestamp

  ## Security
  1. Enable Row Level Security (RLS) on profiles table
  2. Policy: All authenticated users can read all profiles
  3. Policy: Users can insert their own profile
  4. Policy: Users can update only their own profile

  ## Important Notes
  - Usernames must be unique across all users
  - Avatar field stores the icon identifier
  - Profile is created during onboarding
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read all profiles
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
