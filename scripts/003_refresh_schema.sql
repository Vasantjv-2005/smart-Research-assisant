-- Refresh the schema cache and ensure file_url column exists
-- Drop and recreate the table to ensure proper schema recognition
DROP TABLE IF EXISTS uploaded_files CASCADE;

-- Recreate the uploaded_files table with all required columns
CREATE TABLE uploaded_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  session_id text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  file_url text NOT NULL,
  status text DEFAULT 'uploaded',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_session_id ON uploaded_files(session_id);
CREATE INDEX idx_uploaded_files_created_at ON uploaded_files(created_at);

-- Enable RLS
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own files" ON uploaded_files
  FOR SELECT USING (true); -- Allow all for now, can be restricted later

CREATE POLICY "Users can insert their own files" ON uploaded_files
  FOR INSERT WITH CHECK (true); -- Allow all for now, can be restricted later

-- Grant permissions
GRANT ALL ON uploaded_files TO anon;
GRANT ALL ON uploaded_files TO authenticated;
