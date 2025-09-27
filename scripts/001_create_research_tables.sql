-- Create research sessions table
CREATE TABLE IF NOT EXISTS public.research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  results JSONB,
  live_search BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded files table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create policies for research_sessions (public access for demo)
CREATE POLICY "Allow public read access to research_sessions" ON public.research_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to research_sessions" ON public.research_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to research_sessions" ON public.research_sessions FOR UPDATE USING (true);

-- Create policies for uploaded_files (public access for demo)
CREATE POLICY "Allow public read access to uploaded_files" ON public.uploaded_files FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to uploaded_files" ON public.uploaded_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to uploaded_files" ON public.uploaded_files FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_session_id ON public.uploaded_files(session_id);
