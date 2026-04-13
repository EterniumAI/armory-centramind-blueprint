-- Blueprint lead capture table
-- Stores email signups and their completed blueprint data

CREATE TABLE IF NOT EXISTS blueprint_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    blueprint_data jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blueprint_leads ENABLE ROW LEVEL SECURITY;

-- Allow inserts and updates from anon (public lead capture)
CREATE POLICY "Allow public insert" ON blueprint_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update" ON blueprint_leads FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Enable realtime (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE blueprint_leads;
