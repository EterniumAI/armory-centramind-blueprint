-- Migration 003: CRM + Tasks
-- Adds contacts, deals, and tasks tables for the Command Center.

-- contacts: people the user tracks (leads, clients, partners)
CREATE TABLE contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    company text,
    source text,
    status text NOT NULL DEFAULT 'lead'
        CHECK (status IN ('lead', 'prospect', 'client', 'churned', 'archived')),
    tags text[] DEFAULT '{}',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- deals: revenue opportunities linked to contacts
CREATE TABLE deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    title text NOT NULL,
    value_usd numeric(10,2) DEFAULT 0,
    stage text NOT NULL DEFAULT 'discovery'
        CHECK (stage IN ('discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    notes text,
    closed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- tasks: action items, optionally linked to a project or contact
CREATE TABLE tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
    priority text NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date date,
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update timestamps (reuse update_updated_at() from 001)
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE deals;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- RLS (open for single-user dashboard; tighten for multi-user)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON contacts FOR SELECT USING (true);
CREATE POLICY "Public write" ON contacts FOR ALL USING (true);
CREATE POLICY "Public read" ON deals FOR SELECT USING (true);
CREATE POLICY "Public write" ON deals FOR ALL USING (true);
CREATE POLICY "Public read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public write" ON tasks FOR ALL USING (true);
