-- CentraMind Command Center: Core Schema
-- Run this in your Supabase SQL Editor to set up the dashboard tables.

CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    description text,
    completeness numeric(3,2) DEFAULT 0,
    stack text[] DEFAULT '{}',
    blockers text[] DEFAULT '{}',
    next_actions text[] DEFAULT '{}',
    deployment_url text,
    deployment_status text DEFAULT 'none',
    repo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE session_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL UNIQUE,
    session_date date NOT NULL,
    duration text,
    summary text NOT NULL,
    projects_touched text[] DEFAULT '{}',
    completed text[] DEFAULT '{}',
    pending text[] DEFAULT '{}',
    decisions text[] DEFAULT '{}',
    blockers text[] DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE directives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    directive_id text NOT NULL UNIQUE,
    title text NOT NULL,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    rule text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE heartbeat_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    message text NOT NULL,
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE session_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE heartbeat_alerts;

-- RLS (open for single-user dashboard; tighten for multi-user)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE directives ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON projects FOR SELECT USING (true);
CREATE POLICY "Public write" ON projects FOR ALL USING (true);
CREATE POLICY "Public read" ON session_logs FOR SELECT USING (true);
CREATE POLICY "Public write" ON session_logs FOR ALL USING (true);
CREATE POLICY "Public read" ON directives FOR SELECT USING (true);
CREATE POLICY "Public write" ON directives FOR ALL USING (true);
CREATE POLICY "Public read" ON heartbeat_alerts FOR SELECT USING (true);
CREATE POLICY "Public write" ON heartbeat_alerts FOR ALL USING (true);
