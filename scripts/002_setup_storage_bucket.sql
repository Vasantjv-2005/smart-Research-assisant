-- Create the user-uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads', 
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'user-uploads');

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.objects TO anon;
